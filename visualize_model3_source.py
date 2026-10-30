
from pathlib import Path
import random
import cv2
import matplotlib.pyplot as plt
from collections import defaultdict

ROOT = Path("dataset3")
IMAGE_DIR = ROOT / "train" / "images"
LABEL_DIR = ROOT / "train" / "labels"

CLASS_NAMES = {
    3: "Amalgam filling",
    12: "Composite filling",
    14: "Crown",
    20: "Filling",
}

COLORS = {
    3: (255, 0, 0),
    12: (0, 200, 0),
    14: (0, 0, 255),
    20: (255, 165, 0),
}

random.seed(42)

label_files = sorted(LABEL_DIR.glob("*.txt"))
samples = random.sample(label_files, min(6, len(label_files)))

for label_path in samples:
    image_path = None

    # Find an image with the same filename stem.
    for ext in (".jpg", ".jpeg", ".png", ".bmp", ".webp"):
        candidate = IMAGE_DIR / (label_path.stem + ext)
        if candidate.exists():
            image_path = candidate
            break

    if image_path is None:
        print("Image not found:", label_path.name)
        continue

    image = cv2.imread(str(image_path))
    if image is None:
        print("Could not read:", image_path)
        continue

    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    height, width = image.shape[:2]

    fig, ax = plt.subplots(figsize=(12, 8))
    ax.imshow(image)

    for line in label_path.read_text().splitlines():
        parts = line.split()
        if len(parts) < 7:
            continue

        try:
            class_id = int(parts[0])
            coords = list(map(float, parts[1:]))
        except ValueError:
            continue

        if class_id not in CLASS_NAMES or len(coords) < 6:
            continue

        # YOLO segmentation coordinates are normalized x,y pairs.
        points = [
            (coords[i] * width, coords[i + 1] * height)
            for i in range(0, len(coords) - 1, 2)
        ]

        color = tuple(c / 255 for c in COLORS[class_id])
        polygon = plt.Polygon(
            points,
            closed=True,
            fill=False,
            edgecolor=color,
            linewidth=2,
        )
        ax.add_patch(polygon)

        ax.text(
            points[0][0],
            points[0][1],
            CLASS_NAMES[class_id],
            color="white",
            fontsize=8,
            bbox={"facecolor": color, "alpha": 0.8},
        )

    ax.set_title(label_path.name)
    ax.axis("off")
    plt.tight_layout()
    plt.show()
