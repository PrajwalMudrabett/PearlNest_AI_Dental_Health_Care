
from pathlib import Path

import cv2
import matplotlib.pyplot as plt
from matplotlib.patches import Patch

ROOT = Path("dataset3/train")
IMAGE_NAME = "cate2-00035_jpg.rf.J4Rrf4hYJDbInR1zuVwu.jpg"

CLASS_NAMES = {
    3: "Amalgam filling",
    12: "Composite filling",
    14: "Crown",
    20: "Filling",
}

COLORS = {
    3: (255, 0, 0),
    12: (0, 200, 0),
    14: (0, 165, 255),
    20: (255, 0, 255),
}

image_path = ROOT / "images" / IMAGE_NAME
label_path = ROOT / "labels" / f"{Path(IMAGE_NAME).stem}.txt"

image = cv2.imread(str(image_path))
if image is None:
    raise FileNotFoundError(image_path)

image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
overlay = image.copy()
height, width = image.shape[:2]

for line in label_path.read_text().splitlines():
    values = line.split()
    if not values:
        continue

    class_id = int(values[0])
    if class_id not in CLASS_NAMES:
        continue

    coords = list(map(float, values[1:]))
    points = [
        [round(coords[i] * width), round(coords[i + 1] * height)]
        for i in range(0, len(coords), 2)
    ]

    polygon = __import__("numpy").array(points, dtype="int32")
    color = COLORS[class_id]

    cv2.fillPoly(overlay, [polygon], color)
    cv2.polylines(overlay, [polygon], True, (255, 255, 255), 2)

blended = cv2.addWeighted(image, 0.65, overlay, 0.35, 0)

fig, axes = plt.subplots(1, 2, figsize=(16, 8))
axes[0].imshow(image, cmap="gray")
axes[0].set_title("Original X-ray")
axes[1].imshow(blended)
axes[1].set_title("Restoration annotation overlay")

for ax in axes:
    ax.axis("off")

legend = [
    Patch(facecolor=tuple(c / 255 for c in COLORS[k]),
          label=CLASS_NAMES[k])
    for k in CLASS_NAMES
]
axes[1].legend(handles=legend, loc="lower center",
               bbox_to_anchor=(0.5, -0.08), ncol=2)

plt.tight_layout()
plt.savefig("model3_single_image_audit.png", dpi=180,
            bbox_inches="tight")
plt.show()

print("Saved: model3_single_image_audit.png")
