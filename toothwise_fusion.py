from ultralytics import YOLO
import cv2
import os
import csv
import numpy as np

# ============================================================
# PATHS
# ============================================================

MODEL1_PATH = r"runs\detect\train-3\weights\best.pt"
MODEL2_PATH = r"runs\segment\train-2\weights\best.pt"
MODEL3_PATH = r"runs\segment\train-4\weights\best.pt"

IMAGE_PATH = r"C:\Users\Prajwal\Desktop\MajorProject\PERLNEST\dataset3_findings\test\images\cate1-00007_jpg.rf.xZ7gUIZa9Yr38nP3OXMk.jpg"

OUTPUT_DIR = r"runs\toothwise"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# CONFIDENCE SETTINGS
# ============================================================

TOOTH_CONF = 0.25
CARIES_CONF = 0.25
FINDING_CONF = 0.50

# Minimum overlap required before a finding can be
# associated with a tooth.
OVERLAP_THRESHOLD = 0.15

# ============================================================
# FDI MAPPING
# ============================================================

FDI_CLASSES = [
    11, 12, 13, 14, 15, 16, 17, 18,
    21, 22, 23, 24, 25, 26, 27, 28,
    31, 32, 33, 34, 35, 36, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48
]

# ============================================================
# MODEL 3 CLASSES
# ============================================================

FINDING_CLASSES = [
    "Implant",
    "Filling",
    "Composite filling",
    "Amalgam filling",
    "Crown"
]

# ============================================================
# LOAD IMAGE
# ============================================================

image = cv2.imread(IMAGE_PATH)

if image is None:
    raise FileNotFoundError(
        f"Could not find X-ray image:\n{IMAGE_PATH}"
    )

height, width = image.shape[:2]

print("\n==============================================")
print("        PERLNEST TOOTH-WISE FUSION")
print("==============================================")

print(f"\nImage: {IMAGE_PATH}")
print(f"Image size: {width} x {height}")

# ============================================================
# LOAD MODELS
# ============================================================

print("\nLoading models...")

model1 = YOLO(MODEL1_PATH)
model2 = YOLO(MODEL2_PATH)
model3 = YOLO(MODEL3_PATH)

print("All models loaded successfully.")

# ============================================================
# MODEL 1 - TOOTH DETECTION
# ============================================================

print("\nRunning Model 1 - Tooth Detection...")

result1 = model1.predict(
    source=image,
    imgsz=640,
    conf=TOOTH_CONF,
    device=0,
    verbose=False
)[0]

raw_teeth = []

if result1.boxes is not None:

    boxes = result1.boxes.xyxy.cpu().numpy()
    classes = result1.boxes.cls.cpu().numpy().astype(int)
    confidences = result1.boxes.conf.cpu().numpy()

    for box, cls, conf in zip(
        boxes,
        classes,
        confidences
    ):

        if cls < 0 or cls >= len(FDI_CLASSES):
            continue

        x1, y1, x2, y2 = map(int, box)

        raw_teeth.append({
            "fdi": FDI_CLASSES[cls],
            "box": (x1, y1, x2, y2),
            "confidence": float(conf)
        })

print(f"Raw tooth detections: {len(raw_teeth)}")

# ============================================================
# REMOVE DUPLICATE FDI DETECTIONS
# KEEP HIGHEST CONFIDENCE
# ============================================================

unique_teeth = {}

for tooth in raw_teeth:

    fdi = tooth["fdi"]

    if (
        fdi not in unique_teeth
        or tooth["confidence"]
        > unique_teeth[fdi]["confidence"]
    ):
        unique_teeth[fdi] = tooth

teeth = list(unique_teeth.values())

teeth.sort(key=lambda x: x["fdi"])

print(
    f"Unique FDI teeth after duplicate removal: "
    f"{len(teeth)}"
)

# ============================================================
# MODEL 2 - CARIES SEGMENTATION
# ============================================================

print("\nRunning Model 2 - Caries Segmentation...")

result2 = model2.predict(
    source=image,
    imgsz=512,
    conf=CARIES_CONF,
    device=0,
    verbose=False
)[0]

caries_masks = []

if result2.masks is not None:

    masks = result2.masks.data.cpu().numpy()
    confidences = result2.boxes.conf.cpu().numpy()

    for mask, conf in zip(
        masks,
        confidences
    ):

        mask = cv2.resize(
            mask,
            (width, height),
            interpolation=cv2.INTER_NEAREST
        )

        caries_masks.append({
            "mask": mask > 0.5,
            "confidence": float(conf)
        })

print(
    f"Caries regions detected: "
    f"{len(caries_masks)}"
)

# ============================================================
# MODEL 3 - FINDING SEGMENTATION
# ============================================================

print("\nRunning Model 3 - Dental Findings Segmentation...")

result3 = model3.predict(
    source=image,
    imgsz=512,
    conf=FINDING_CONF,
    device=0,
    verbose=False
)[0]

finding_masks = []

if result3.masks is not None:

    masks = result3.masks.data.cpu().numpy()
    classes = result3.boxes.cls.cpu().numpy().astype(int)
    confidences = result3.boxes.conf.cpu().numpy()

    for mask, cls, conf in zip(
        masks,
        classes,
        confidences
    ):

        if cls < 0 or cls >= len(FINDING_CLASSES):
            continue

        mask = cv2.resize(
            mask,
            (width, height),
            interpolation=cv2.INTER_NEAREST
        )

        finding_masks.append({
            "class": FINDING_CLASSES[cls],
            "mask": mask > 0.5,
            "confidence": float(conf)
        })

print(
    f"Dental findings detected: "
    f"{len(finding_masks)}"
)

# ============================================================
# OVERLAP FUNCTION
# ============================================================

def calculate_overlap(finding_mask, tooth_box):

    x1, y1, x2, y2 = tooth_box

    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(width, x2)
    y2 = min(height, y2)

    if x2 <= x1 or y2 <= y1:
        return 0.0

    tooth_region = finding_mask[y1:y2, x1:x2]

    overlap_pixels = np.sum(tooth_region)

    total_finding_pixels = np.sum(finding_mask)

    if total_finding_pixels == 0:
        return 0.0

    return float(
        overlap_pixels / total_finding_pixels
    )

# ============================================================
# FIND BEST TOOTH FOR EACH FINDING
# ============================================================

def find_best_tooth(finding_mask):

    best_tooth = None
    best_overlap = 0.0

    for tooth in teeth:

        overlap = calculate_overlap(
            finding_mask,
            tooth["box"]
        )

        if overlap > best_overlap:

            best_overlap = overlap
            best_tooth = tooth

    if (
        best_tooth is not None
        and best_overlap >= OVERLAP_THRESHOLD
    ):

        return best_tooth, best_overlap

    return None, best_overlap

# ============================================================
# INITIALIZE TOOTH RESULTS
# ============================================================

tooth_results = {}

for tooth in teeth:

    tooth_results[tooth["fdi"]] = {
        "fdi": tooth["fdi"],
        "tooth_confidence": tooth["confidence"],
        "box": tooth["box"],
        "findings": []
    }

# ============================================================
# ASSIGN CARIES
# ============================================================

for caries in caries_masks:

    tooth, overlap = find_best_tooth(
        caries["mask"]
    )

    if tooth is None:
        continue

    fdi = tooth["fdi"]

    tooth_results[fdi]["findings"].append({
        "finding": "Caries",
        "confidence": caries["confidence"],
        "overlap": overlap
    })

# ============================================================
# ASSIGN MODEL 3 FINDINGS
# ============================================================

for finding in finding_masks:

    tooth, overlap = find_best_tooth(
        finding["mask"]
    )

    if tooth is None:
        continue

    fdi = tooth["fdi"]

    tooth_results[fdi]["findings"].append({
        "finding": finding["class"],
        "confidence": finding["confidence"],
        "overlap": overlap
    })

# ============================================================
# REMOVE DUPLICATE FINDING TYPES PER TOOTH
# ============================================================

for fdi, tooth in tooth_results.items():

    best_findings = {}

    for finding in tooth["findings"]:

        name = finding["finding"]

        if (
            name not in best_findings
            or finding["confidence"]
            > best_findings[name]["confidence"]
        ):

            best_findings[name] = finding

    tooth["findings"] = list(
        best_findings.values()
    )

    tooth["findings"].sort(
        key=lambda x: x["confidence"],
        reverse=True
    )

# ============================================================
# PRINT RESULTS
# ============================================================

print("\n==============================================")
print("             TOOTH-WISE RESULTS")
print("==============================================")

for fdi in sorted(tooth_results):

    tooth = tooth_results[fdi]

    print(
        f"\nFDI {fdi} "
        f"(Tooth confidence: "
        f"{tooth['tooth_confidence']:.2f})"
    )

    if not tooth["findings"]:

        print("   -> No detected finding")

    else:

        for finding in tooth["findings"]:

            print(
                f"   -> {finding['finding']} "
                f"| confidence: "
                f"{finding['confidence']:.2f} "
                f"| overlap: "
                f"{finding['overlap']:.2f}"
            )

# ============================================================
# SAVE CSV
# ============================================================

csv_path = os.path.join(
    OUTPUT_DIR,
    "toothwise_results.csv"
)

with open(
    csv_path,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.writer(file)

    writer.writerow([
        "FDI Tooth",
        "Tooth Confidence",
        "Finding",
        "Finding Confidence",
        "Overlap"
    ])

    for fdi in sorted(tooth_results):

        tooth = tooth_results[fdi]

        if not tooth["findings"]:

            writer.writerow([
                fdi,
                f"{tooth['tooth_confidence']:.4f}",
                "No detected finding",
                "",
                ""
            ])

        else:

            for finding in tooth["findings"]:

                writer.writerow([
                    fdi,
                    f"{tooth['tooth_confidence']:.4f}",
                    finding["finding"],
                    f"{finding['confidence']:.4f}",
                    f"{finding['overlap']:.4f}"
                ])

print("\nCSV saved to:")
print(csv_path)

# ============================================================
# CREATE ANNOTATED IMAGE
# ============================================================

output = image.copy()

# ------------------------------------------------------------
# Draw finding masks FIRST
# ------------------------------------------------------------

for caries in caries_masks:

    mask = caries["mask"]

    overlay = output.copy()

    overlay[mask] = (0, 0, 255)

    output = cv2.addWeighted(
        output,
        0.75,
        overlay,
        0.25,
        0
    )

for finding in finding_masks:

    mask = finding["mask"]
    name = finding["class"]

    if name == "Implant":
        color = (255, 255, 0)

    elif name == "Filling":
        color = (0, 255, 0)

    elif name == "Composite filling":
        color = (0, 255, 255)

    elif name == "Amalgam filling":
        color = (255, 0, 255)

    elif name == "Crown":
        color = (0, 165, 255)

    else:
        color = (255, 255, 255)

    overlay = output.copy()

    overlay[mask] = color

    output = cv2.addWeighted(
        output,
        0.75,
        overlay,
        0.25,
        0
    )

# ------------------------------------------------------------
# Draw tooth boxes AFTER masks
# ------------------------------------------------------------

for fdi in sorted(tooth_results):

    tooth = tooth_results[fdi]

    x1, y1, x2, y2 = tooth["box"]

    cv2.rectangle(
        output,
        (x1, y1),
        (x2, y2),
        (255, 0, 0),
        2
    )

    cv2.putText(
        output,
        f"FDI {fdi}",
        (x1, max(y1 - 8, 20)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 0, 0),
        2
    )

# ============================================================
# SAVE IMAGE
# ============================================================

image_path = os.path.join(
    OUTPUT_DIR,
    "toothwise_result.jpg"
)

cv2.imwrite(
    image_path,
    output
)

print("\nAnnotated image saved to:")
print(image_path)

# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n==============================================")
print("             FUSION COMPLETE")
print("==============================================")

print(
    f"Raw tooth detections    : {len(raw_teeth)}"
)

print(
    f"Unique FDI teeth        : {len(teeth)}"
)

print(
    f"Caries regions          : {len(caries_masks)}"
)

print(
    f"Dental findings         : {len(finding_masks)}"
)

print("\nOutput files:")
print(f"1. {csv_path}")
print(f"2. {image_path}")

print("\n==============================================")
