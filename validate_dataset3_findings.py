from pathlib import Path
from collections import Counter

DATASET = Path("dataset3_findings")

SPLITS = ["train", "valid", "test"]

CLASS_NAMES = [
    "Implant",
    "Filling",
    "Composite filling",
    "Amalgam filling",
    "Crown"
]

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp"
}

total_images = 0
total_labels = 0
total_annotations = 0
total_invalid = 0

global_counts = Counter()

print("=" * 70)
print("DATASET 3 FINDINGS VALIDATION")
print("=" * 70)

for split in SPLITS:

    image_dir = DATASET / split / "images"
    label_dir = DATASET / split / "labels"

    images = [
        p for p in image_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]

    labels = list(label_dir.glob("*.txt"))

    image_stems = {p.stem for p in images}
    label_stems = {p.stem for p in labels}

    missing_labels = image_stems - label_stems
    orphan_labels = label_stems - image_stems

    split_counts = Counter()

    invalid_lines = 0
    split_annotations = 0

    for label_file in labels:

        with open(label_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        for line_number, line in enumerate(lines, start=1):

            parts = line.strip().split()

            if not parts:
                continue

            # Segmentation label must have:
            # class + at least 3 (x,y) points
            if len(parts) < 7:
                invalid_lines += 1
                continue

            try:
                class_id = int(parts[0])
            except ValueError:
                invalid_lines += 1
                continue

            if class_id not in range(5):
                invalid_lines += 1
                continue

            coordinates = parts[1:]

            # Must have an even number of coordinates
            if len(coordinates) % 2 != 0:
                invalid_lines += 1
                continue

            valid_polygon = True

            for value in coordinates:
                try:
                    value = float(value)

                    if not 0 <= value <= 1:
                        valid_polygon = False
                        break

                except ValueError:
                    valid_polygon = False
                    break

            if not valid_polygon:
                invalid_lines += 1
                continue

            split_counts[class_id] += 1
            global_counts[class_id] += 1

            split_annotations += 1

    print("\n" + "-" * 70)
    print(split.upper())
    print("-" * 70)

    print(f"Images              : {len(images)}")
    print(f"Labels              : {len(labels)}")
    print(f"Missing labels      : {len(missing_labels)}")
    print(f"Orphan labels       : {len(orphan_labels)}")
    print(f"Annotations         : {split_annotations}")
    print(f"Invalid annotations : {invalid_lines}")

    print("\nClass distribution:")

    for class_id, class_name in enumerate(CLASS_NAMES):
        print(
            f"{class_id} | "
            f"{class_name:<20} | "
            f"{split_counts[class_id]:6d}"
        )

    total_images += len(images)
    total_labels += len(labels)
    total_annotations += split_annotations
    total_invalid += invalid_lines


print("\n")
print("=" * 70)
print("OVERALL VALIDATION")
print("=" * 70)

print(f"Total images              : {total_images}")
print(f"Total labels              : {total_labels}")
print(f"Total annotations         : {total_annotations}")
print(f"Total invalid annotations : {total_invalid}")

print("\nOverall class distribution:")

for class_id, class_name in enumerate(CLASS_NAMES):
    print(
        f"{class_id} | "
        f"{class_name:<20} | "
        f"{global_counts[class_id]:6d}"
    )

print("\n" + "=" * 70)

if total_invalid == 0 and total_images == total_labels:
    print("VALIDATION PASSED")
else:
    print("VALIDATION FAILED — inspect the results above")

print("=" * 70)