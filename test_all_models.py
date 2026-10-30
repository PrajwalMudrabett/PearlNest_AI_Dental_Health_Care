from ultralytics import YOLO
import cv2
import os

# ============================================================
# MODEL PATHS
# ============================================================

MODEL1_PATH = r"runs\detect\train-3\weights\best.pt"
MODEL2_PATH = r"runs\segment\train-2\weights\best.pt"
MODEL3_PATH = r"runs\segment\train-4\weights\best.pt"

# Change this to your panoramic X-ray image
IMAGE_PATH = r"C:\Users\Prajwal\Desktop\MajorProject\PERLNEST\dataset1\test\images\213_jpg.rf.bf23d182f18ddc8b486e4619ca36532d.jpg"

OUTPUT_DIR = r"runs\integrated"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# FDI CLASS MAPPING FOR MODEL 1
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
        f"Could not find image: {IMAGE_PATH}"
    )

original = image.copy()

# ============================================================
# LOAD MODELS
# ============================================================

print("\nLoading models...")

model1 = YOLO(MODEL1_PATH)
model2 = YOLO(MODEL2_PATH)
model3 = YOLO(MODEL3_PATH)

print("All models loaded successfully.")

# ============================================================
# MODEL 1 - TOOTH DETECTION + FDI NUMBERING
# ============================================================

print("\nRunning Model 1 - Tooth Detection...")

result1 = model1.predict(
    source=image,
    imgsz=640,
    conf=0.25,
    device=0,
    verbose=False
)[0]

output = original.copy()

tooth_count = 0

if result1.boxes is not None:

    boxes = result1.boxes.xyxy.cpu().numpy()
    classes = result1.boxes.cls.cpu().numpy().astype(int)
    confidences = result1.boxes.conf.cpu().numpy()

    for box, cls, conf in zip(boxes, classes, confidences):

        x1, y1, x2, y2 = map(int, box)

        if 0 <= cls < len(FDI_CLASSES):
            fdi_number = FDI_CLASSES[cls]
        else:
            fdi_number = "?"

        cv2.rectangle(
            output,
            (x1, y1),
            (x2, y2),
            (255, 0, 0),
            2
        )

        label = f"FDI {fdi_number} {conf:.2f}"

        cv2.putText(
            output,
            label,
            (x1, max(y1 - 8, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (255, 0, 0),
            2
        )

        tooth_count += 1

print(f"Detected teeth: {tooth_count}")

# ============================================================
# MODEL 2 - CARIES SEGMENTATION
# ============================================================

print("\nRunning Model 2 - Caries Segmentation...")

result2 = model2.predict(
    source=image,
    imgsz=512,
    conf=0.25,
    device=0,
    verbose=False
)[0]

caries_count = 0

if result2.masks is not None:

    masks = result2.masks.data.cpu().numpy()

    for mask in masks:

        mask = cv2.resize(
            mask,
            (output.shape[1], output.shape[0])
        )

        mask_binary = mask > 0.5

        # Red overlay for caries
        overlay = output.copy()

        overlay[mask_binary] = (0, 0, 255)

        output = cv2.addWeighted(
            output,
            0.70,
            overlay,
            0.30,
            0
        )

        caries_count += 1

print(f"Caries regions detected: {caries_count}")

# ============================================================
# MODEL 3 - DENTAL FINDINGS SEGMENTATION
# ============================================================

print("\nRunning Model 3 - Dental Findings Segmentation...")

result3 = model3.predict(
    source=image,
    imgsz=512,
    conf=0.5,
    device=0,
    verbose=False
)[0]

finding_counts = {
    "Implant": 0,
    "Filling": 0,
    "Composite filling": 0,
    "Amalgam filling": 0,
    "Crown": 0
}

if result3.masks is not None:

    masks = result3.masks.data.cpu().numpy()

    classes = result3.boxes.cls.cpu().numpy().astype(int)

    for mask, cls in zip(masks, classes):

        mask = cv2.resize(
            mask,
            (output.shape[1], output.shape[0])
        )

        mask_binary = mask > 0.5

        overlay = output.copy()

        # Use different visualization colors
        if cls == 0:
            color = (255, 255, 0)       # Implant
        elif cls == 1:
            color = (0, 255, 0)         # Filling
        elif cls == 2:
            color = (0, 255, 255)       # Composite
        elif cls == 3:
            color = (255, 0, 255)       # Amalgam
        elif cls == 4:
            color = (255, 165, 0)       # Crown
        else:
            color = (255, 255, 255)

        overlay[mask_binary] = color

        output = cv2.addWeighted(
            output,
            0.75,
            overlay,
            0.25,
            0
        )

        if 0 <= cls < len(FINDING_CLASSES):
            finding_counts[FINDING_CLASSES[cls]] += 1

# ============================================================
# SAVE OUTPUT
# ============================================================

output_path = os.path.join(
    OUTPUT_DIR,
    "combined_result.jpg"
)

cv2.imwrite(output_path, output)

# ============================================================
# PRINT SUMMARY
# ============================================================

print("\n==============================================")
print("           PERLNEST INTEGRATION")
print("==============================================")

print(f"\nModel 1 - Teeth detected : {tooth_count}")
print(f"Model 2 - Caries regions : {caries_count}")

print("\nModel 3 findings:")

for name, count in finding_counts.items():
    print(f"  {name}: {count}")

print("\n==============================================")
print(f"Combined result saved to:")
print(output_path)
print("==============================================")
