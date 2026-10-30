from __future__ import annotations

import base64
import io
import os
import sys
from pathlib import Path

import cv2
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from PIL import Image

# Run this file from the PERLNEST project root so the existing pipeline and
# model paths resolve exactly as they do in the original project.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB upload limit
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

PERFORMANCE = [
    {
        "id": "tooth",
        "name": "Tooth Detection & FDI",
        "architecture": "YOLOv8n · 32 FDI classes",
        "test_images": 28,
        "instances": 690,
        "metrics": {"Precision": 95.4, "Recall": 95.0, "mAP@50": 97.9, "mAP@50-95": 67.2},
        "note": "Held-out test set contains 28 X-rays."
    },
    {
        "id": "caries",
        "name": "Caries Segmentation",
        "architecture": "YOLOv8n-Seg · 1 class",
        "test_images": 53,
        "instances": 53,
        "metrics": {"Mask Precision": 98.1, "Mask Recall": 99.4, "Mask mAP@50": 99.3, "Mask mAP@50-95": 70.5},
        "note": "Held-out test set contains 53 images and 53 instances."
    },
    {
        "id": "findings",
        "name": "Dental Findings Segmentation",
        "architecture": "YOLOv8n-Seg · 5 classes",
        "test_images": 130,
        "instances": 3651,
        "metrics": {"Mask Precision": 73.3, "Mask Recall": 73.6, "Mask mAP@50": 75.2, "Mask mAP@50-95": 53.2},
        "note": "Image-level random split; patient-level separation has not been established."
    },
]

FINDING_KEYS = [
    ("Caries", ("Caries", "caries")),
    ("Implant", ("Implant", "implant")),
    ("Filling", ("Filling", "filling")),
    ("Composite", ("Composite filling", "Composite", "composite")),
    ("Amalgam", ("Amalgam filling", "Amalgam", "amalgam")),
    ("Crown", ("Crown", "crown")),
]


def _encode_image(image_array):
    if image_array is None:
        return None
    arr = np.asarray(image_array)
    if arr.ndim == 3 and arr.shape[2] == 3:
        ok, encoded = cv2.imencode(".png", arr)
    elif arr.ndim == 2:
        ok, encoded = cv2.imencode(".png", arr)
    else:
        return None
    if not ok:
        return None
    return base64.b64encode(encoded.tobytes()).decode("ascii")


def _json_safe(value):
    if value is None:
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if pd.isna(value):
        return None
    return value


def _summary_count(summary, candidates):
    if not isinstance(summary, dict):
        return 0
    # Prefer exact keys; then case-insensitive/substring matching.
    for key in candidates:
        if key in summary:
            try:
                return int(summary[key])
            except (TypeError, ValueError):
                pass
    for key, value in summary.items():
        key_text = str(key).lower()
        if any(candidate.lower() == key_text for candidate in candidates):
            try:
                return int(value)
            except (TypeError, ValueError):
                pass
    return 0


def normalize_pipeline_result(result, original_bgr):
    """Convert the current pipeline result into a stable frontend response."""
    if not isinstance(result, dict):
        raise ValueError("analyze_image() must return a dictionary.")

    annotated = result.get("annotated")
    if annotated is None:
        # A safe fallback: return original image if annotation key is absent.
        annotated = original_bgr

    dataframe = result.get("dataframe")
    if isinstance(dataframe, pd.DataFrame):
        rows = [
            {str(k): _json_safe(v) for k, v in row.items()}
            for row in dataframe.to_dict(orient="records")
        ]
        columns = [str(c) for c in dataframe.columns]
    elif isinstance(dataframe, list):
        rows = dataframe
        columns = list(rows[0].keys()) if rows and isinstance(rows[0], dict) else []
    else:
        rows, columns = [], []

    fused = result.get("fused_summary") or {}
    summary = {
        "teeth_detected": len({str(row.get("FDI", row.get("fdi", ""))) for row in rows
                               if row.get("FDI", row.get("fdi")) not in (None, "")}),
        "caries_assignments": _summary_count(fused, ["Caries", "caries"]),
        "implant_assignments": _summary_count(fused, ["Implant", "implant"]),
        "filling_assignments": _summary_count(fused, ["Filling", "filling"]),
        "composite_assignments": _summary_count(fused, ["Composite filling", "Composite", "composite"]),
        "amalgam_assignments": _summary_count(fused, ["Amalgam filling", "Amalgam", "amalgam"]),
        "crown_assignments": _summary_count(fused, ["Crown", "crown"]),
    }

    # Prefer explicit tooth count if the pipeline provides it.
    for key in ("teeth_detected", "Teeth detected", "tooth_count"):
        if key in fused:
            try:
                summary["teeth_detected"] = int(fused[key])
                break
            except (TypeError, ValueError):
                pass

    return {
        "annotated_image": _encode_image(annotated),
        "original_image": _encode_image(original_bgr),
        "summary": summary,
        "rows": rows,
        "columns": columns,
        "disclaimer": "Model-generated predictions and tooth-wise assignments only; not a clinical diagnosis."
    }


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "PERLNEST API"})


@app.get("/api/performance")
def performance():
    return jsonify({"models": PERFORMANCE})


@app.post("/api/analyze")
def analyze():
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        return jsonify({"error": "Choose a panoramic X-ray image first."}), 400

    extension = uploaded.filename.rsplit(".", 1)[-1].lower() if "." in uploaded.filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Unsupported file type. Upload JPG, JPEG, or PNG."}), 400

    raw = uploaded.read()
    if not raw:
        return jsonify({"error": "The uploaded file is empty."}), 400

    try:
        pil_image = Image.open(io.BytesIO(raw)).convert("RGB")
        rgb = np.array(pil_image)
        original_bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    except Exception:
        return jsonify({"error": "Could not read this image. Try another JPG or PNG file."}), 400

    try:
        # Import lazily so /health can respond even if model dependencies are
        # not installed yet. Existing model weights and pipeline are untouched.
        from perlnest_pipeline import analyze_image

        def read_conf(name, default):
            try:
                value = float(request.form.get(name, default))
                return max(0.01, min(0.99, value))
            except (TypeError, ValueError):
                return default

        result = analyze_image(
            original_bgr,
            model1_conf=read_conf("model1_conf", 0.25),
            model2_conf=read_conf("model2_conf", 0.25),
            model3_conf=read_conf("model3_conf", 0.50),
        )
        response = normalize_pipeline_result(result, original_bgr)
        response["filename"] = uploaded.filename
        return jsonify(response)
    except Exception as exc:
        app.logger.exception("PERLNEST analysis failed")
        return jsonify({
            "error": "Analysis failed. Check the Flask terminal for the full traceback.",
            "detail": str(exc)
        }), 500


if __name__ == "__main__":
    print("PERLNEST API starting at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False , use_reloader=False)
