from pathlib import Path
from collections import Counter
import yaml

GT = Path(r"dataset1\test\labels")
PR = Path(r"runs\detect\predict-2\labels")
DATA = Path(r"dataset1\data.yaml")
IOU_THRESHOLD = 0.50


# Read FDI class names from data.yaml
with open(DATA, "r", encoding="utf-8") as f:
    data = yaml.safe_load(f)

names = data["names"]

if isinstance(names, dict):
    names = [names[i] for i in range(len(names))]


def read_box(line):
    p = line.split()
    return (
        int(p[0]),
        float(p[1]),
        float(p[2]),
        float(p[3]),
        float(p[4])
    )


def label(class_id):
    return str(names[class_id])


def iou(a, b):
    _, x, y, w, h = a
    _, X, Y, W, H = b

    ax1 = x - w / 2
    ay1 = y - h / 2
    ax2 = x + w / 2
    ay2 = y + h / 2

    bx1 = X - W / 2
    by1 = Y - H / 2
    bx2 = X + W / 2
    by2 = Y + H / 2

    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)

    iw = max(0, ix2 - ix1)
    ih = max(0, iy2 - iy1)

    intersection = iw * ih

    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)

    union = area_a + area_b - intersection

    return intersection / union if union else 0


wrong = Counter()
missed = Counter()

total = 0
correct = 0


for gt_file in GT.glob("*.txt"):

    gt = [
        read_box(line)
        for line in gt_file.read_text().splitlines()
        if line.strip()
    ]

    pred_file = PR / gt_file.name

    if pred_file.exists():
        predictions = [
            read_box(line)
            for line in pred_file.read_text().splitlines()
            if line.strip()
        ]
    else:
        predictions = []

    total += len(gt)

    matches = []

    for i, g in enumerate(gt):
        for j, p in enumerate(predictions):

            score = iou(g, p)

            if score >= IOU_THRESHOLD:
                matches.append((score, i, j))

    matches.sort(reverse=True)

    used_gt = set()
    used_pred = set()

    for score, i, j in matches:

        if i in used_gt or j in used_pred:
            continue

        used_gt.add(i)
        used_pred.add(j)

        actual_id = gt[i][0]
        predicted_id = predictions[j][0]

        actual_fdi = label(actual_id)
        predicted_fdi = label(predicted_id)

        if actual_id == predicted_id:
            correct += 1
        else:
            wrong[(actual_fdi, predicted_fdi)] += 1

    for i, g in enumerate(gt):

        if i not in used_gt:
            missed[label(g[0])] += 1


print()
print("========== REAL FDI ERROR ANALYSIS ==========")

print()
print("Class mapping:")
for i, name in enumerate(names):
    print(f"Class {i:2d} = FDI {name}")

print()
print("Wrong FDI predictions:")

if wrong:
    for (actual, predicted), count in wrong.most_common():
        print(
            f"Actual FDI {actual} -> Predicted FDI {predicted}: {count}"
        )
else:
    print("None")

print()
print("Missed teeth:")

if missed:
    for fdi, count in missed.most_common():
        print(f"FDI {fdi}: {count}")
else:
    print("None")

print()
print("Total ground-truth teeth:", total)
print("Correct FDI predictions:", correct)
print("Incorrect FDI predictions:", sum(wrong.values()))
print("Missed teeth:", sum(missed.values()))
print(f"FDI accuracy: {100 * correct / total:.2f}%")

print()
print("============================================")