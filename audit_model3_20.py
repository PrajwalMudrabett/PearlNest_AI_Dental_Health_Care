
from pathlib import Path
from collections import Counter
import random
import csv
import cv2
import numpy as np
import matplotlib.pyplot as plt

# Read-only audit: original dataset is never changed.
ROOT = Path("dataset3")
IMAGE_DIR = ROOT / "train" / "images"
LABEL_DIR = ROOT / "train" / "labels"
OUT_DIR = Path("model3_audit_output")

SAMPLE_SIZE = 20
SEED = 42

TARGET_CLASSES = {
    3: "Amalgam filling",
    12: "Composite filling",
    14: "Crown",
    20: "Filling",
}

COLORS = {
    3: (255, 70, 70),
    12: (70, 220, 70),
    14: (70, 130, 255),
    20: (255, 180, 40),
}

EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp", ".webp"]


def find_image(stem):
    for ext in EXTENSIONS:
        path = IMAGE_DIR / (stem + ext)
        if path.exists():
            return path
    return None


def read_polygons(label_path, width, height):
    results = []
    malformed = 0

    for line_no, line in enumerate(
        label_path.read_text().splitlines(), start=1
    ):
        parts = line.split()
        if not parts:
            continue

        try:
            class_id = int(parts[0])
            values = list(map(float, parts[1:]))
        except ValueError:
            malformed += 1
            continue

        if len(values) < 6 or len(values) % 2:
            malformed += 1
            continue

        points = np.array(values, dtype=np.float32).reshape(-1, 2)

        if not np.isfinite(points).all():
            malformed += 1
            continue

        # YOLO segmentation coordinates should be normalized.
        if np.any(points < 0) or np.any(points > 1):
            malformed += 1
            continue

        pixels = points.copy()
        pixels[:, 0] *= width
        pixels[:, 1] *= height

        area = abs(cv2.contourArea(pixels))
        coverage = area / (width * height)

        results.append({
            "class_id": class_id,
            "points": pixels,
            "vertices": len(points),
            "area_fraction": coverage,
        })

    return results, malformed


def main():
    if not IMAGE_DIR.exists() or not LABEL_DIR.exists():
        raise FileNotFoundError(
            "Expected dataset3/train/images and "
            "dataset3/train/labels. Run from the PERLNEST folder."
        )

    label_files = sorted(LABEL_DIR.glob("*.txt"))
    pairs = [
        (label, find_image(label.stem))
        for label in label_files
    ]
    pairs = [(label, image) for label, image in pairs
             if image is not None]

    if len(pairs) < SAMPLE_SIZE:
        raise RuntimeError(
            f"Only {len(pairs)} matching image-label pairs found."
        )

    random.seed(SEED)
    selected = random.sample(pairs, SAMPLE_SIZE)

    OUT_DIR.mkdir(exist_ok=True)
    report_rows = []
    preview_items = []

    print(f"Matched source pairs: {len(pairs)}")
    print(f"Random sample size: {SAMPLE_SIZE}")
    print(f"Random seed: {SEED}")
    print("\nPer-image restoration annotation counts:")

    for label_path, image_path in selected:
        image_bgr = cv2.imread(str(image_path))
        if image_bgr is None:
            print("UNREADABLE IMAGE:", image_path.name)
            continue

        image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        height, width = image.shape[:2]
        polygons, malformed = read_polygons(
            label_path, width, height
        )

        counts = Counter(p["class_id"] for p in polygons)
        row = {
            "image": image_path.name,
            "label": label_path.name,
            "width": width,
            "height": height,
            "malformed_lines": malformed,
        }

        print(f"\n{image_path.name}")
        print(f"  Image dimensions: {width} x {height}")
        print(f"  Malformed lines: {malformed}")

        overlay = image.copy()

        for class_id, class_name in TARGET_CLASSES.items():
            matching = [
                p for p in polygons if p["class_id"] == class_id
            ]
            print(f"  {class_name}: {len(matching)} polygon(s)")

            row[f"class_{class_id}_count"] = len(matching)

            for polygon in matching:
                pts = polygon["points"].astype(np.int32)
                color = COLORS[class_id]

                cv2.polylines(
                    overlay, [pts], True, color, 2
                )

                x, y = pts[0]
                cv2.putText(
                    overlay,
                    class_name,
                    (int(x), max(15, int(y))),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.38,
                    color,
                    1,
                    cv2.LINE_AA,
                )

                row.setdefault(
                    f"class_{class_id}_coverage", []
                ).append(round(polygon["area_fraction"], 6))

        # Keep report columns simple and readable.
        for class_id in TARGET_CLASSES:
            values = row.pop(f"class_{class_id}_coverage", [])
            row[f"class_{class_id}_coverage"] = ";".join(
                map(str, values)
            )

        report_rows.append(row)
        preview_items.append((
            image_path.name,
            image,
            overlay,
        ))

    csv_path = OUT_DIR / "audit_report.csv"
    if report_rows:
        with csv_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f, fieldnames=list(report_rows[0].keys())
            )
            writer.writeheader()
            writer.writerows(report_rows)

    # Original image beside its annotated overlay.
    if preview_items:
        fig, axes = plt.subplots(
            len(preview_items), 2,
            figsize=(14, max(20, len(preview_items) * 2.5))
        )

        for i, (name, original, overlay) in enumerate(preview_items):
            axes[i, 0].imshow(original)
            axes[i, 0].set_title(f"Original: {name}", fontsize=8)
            axes[i, 1].imshow(overlay)
            axes[i, 1].set_title("Restoration annotations", fontsize=8)

            axes[i, 0].axis("off")
            axes[i, 1].axis("off")

        plt.tight_layout()
        preview_path = OUT_DIR / "audit_20_images.png"
        fig.savefig(preview_path, dpi=120, bbox_inches="tight")
        plt.close(fig)

        print("\nAudit completed.")
        print("Report:", csv_path.resolve())
        print("Visual preview:", preview_path.resolve())
        print("Original dataset was not modified.")


if __name__ == "__main__":
    main()
