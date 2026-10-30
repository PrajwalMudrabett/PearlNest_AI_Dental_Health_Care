from pathlib import Path
import shutil
import random
from collections import Counter

# ============================================================
# PATHS
# ============================================================

SOURCE = Path("dataset3")
DEST = Path("dataset3_findings")

SOURCE_TRAIN_IMAGES = SOURCE / "train" / "images"
SOURCE_TRAIN_LABELS = SOURCE / "train" / "labels"

# ============================================================
# ORIGINAL -> NEW CLASS MAPPING
# ============================================================

# All implant classes -> 0
IMPLANT_CLASSES = {
    0, 1, 2, 4, 5, 6, 7, 8, 9, 10,
    13, 15, 16, 17, 18, 19, 21, 22, 23, 24,
    25, 26, 29, 30, 31
}

# Remaining target classes
CLASS_MAPPING = {
    3: 3,    # Amalgam filling
    12: 2,   # Composite filling
    14: 4,   # Crown
    20: 1    # Filling
}

# Final class names
CLASS_NAMES = [
    "Implant",
    "Filling",
    "Composite filling",
    "Amalgam filling",
    "Crown"
]

# Classes to remove
EXCLUDED_CLASSES = {
    11,  # Caries
    27,  # Mandible
    28   # Maxilla
}

# ============================================================
# REPRODUCIBLE SPLIT
# ============================================================

RANDOM_SEED = 42

TRAIN_RATIO = 0.80
VALID_RATIO = 0.10
TEST_RATIO = 0.10


# ============================================================
# CREATE DESTINATION DIRECTORIES
# ============================================================

for split in ["train", "valid", "test"]:
    (DEST / split / "images").mkdir(parents=True, exist_ok=True)
    (DEST / split / "labels").mkdir(parents=True, exist_ok=True)


# ============================================================
# FIND IMAGES
# ============================================================

image_extensions = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp"
}

images = [
    p for p in SOURCE_TRAIN_IMAGES.iterdir()
    if p.is_file() and p.suffix.lower() in image_extensions
]

images.sort()

print("=" * 70)
print("DATASET 3 FINDINGS CREATION")
print("=" * 70)

print(f"Source images found: {len(images)}")

if not images:
    raise RuntimeError("No images found in dataset3/train/images")


# ============================================================
# SHUFFLE AND SPLIT
# ============================================================

random.seed(RANDOM_SEED)
random.shuffle(images)

total = len(images)

train_end = int(total * TRAIN_RATIO)
valid_end = train_end + int(total * VALID_RATIO)

train_images = images[:train_end]
valid_images = images[train_end:valid_end]
test_images = images[valid_end:]

splits = {
    "train": train_images,
    "valid": valid_images,
    "test": test_images
}

print("\nSplit sizes:")
print(f"Train      : {len(train_images)}")
print(f"Validation : {len(valid_images)}")
print(f"Test       : {len(test_images)}")


# ============================================================
# PROCESS LABELS
# ============================================================

global_annotation_counts = Counter()
global_image_counts = Counter()

split_annotation_counts = {
    "train": Counter(),
    "valid": Counter(),
    "test": Counter()
}

split_image_counts = {
    "train": Counter(),
    "valid": Counter(),
    "test": Counter()
}

removed_annotation_counts = Counter()

total_source_annotations = 0
total_kept_annotations = 0
total_removed_annotations = 0

images_without_target_annotations = []


def convert_label(label_path, output_label_path, split):
    global total_source_annotations
    global total_kept_annotations
    global total_removed_annotations

    kept_lines = []
    classes_in_image = set()

    if not label_path.exists():
        return False

    with open(label_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for line_number, line in enumerate(lines, start=1):

        line = line.strip()

        if not line:
            continue

        parts = line.split()

        if len(parts) < 7:
            print(
                f"WARNING: Possible invalid segmentation line "
                f"in {label_path} line {line_number}"
            )
            continue

        try:
            original_class = int(parts[0])
        except ValueError:
            print(
                f"WARNING: Invalid class ID in "
                f"{label_path} line {line_number}"
            )
            continue

        total_source_annotations += 1

        # ----------------------------------------------------
        # Implant classes -> class 0
        # ----------------------------------------------------

        if original_class in IMPLANT_CLASSES:
            new_class = 0

        # ----------------------------------------------------
        # Target classes -> mapped class
        # ----------------------------------------------------

        elif original_class in CLASS_MAPPING:
            new_class = CLASS_MAPPING[original_class]

        # ----------------------------------------------------
        # Excluded classes
        # ----------------------------------------------------

        elif original_class in EXCLUDED_CLASSES:
            removed_annotation_counts[original_class] += 1
            total_removed_annotations += 1
            continue

        else:
            print(
                f"WARNING: Unknown class {original_class} "
                f"in {label_path}"
            )
            total_removed_annotations += 1
            continue

        # ----------------------------------------------------
        # Preserve polygon coordinates exactly
        # ----------------------------------------------------

        parts[0] = str(new_class)

        kept_lines.append(" ".join(parts))

        classes_in_image.add(new_class)

        global_annotation_counts[new_class] += 1
        split_annotation_counts[split][new_class] += 1

        total_kept_annotations += 1

    # Write converted label
    with open(output_label_path, "w", encoding="utf-8") as f:
        if kept_lines:
            f.write("\n".join(kept_lines) + "\n")

    # Count images containing each class
    for class_id in classes_in_image:
        global_image_counts[class_id] += 1
        split_image_counts[split][class_id] += 1

    return bool(kept_lines)


# ============================================================
# COPY + CONVERT DATA
# ============================================================

for split, split_images in splits.items():

    print("\n" + "-" * 70)
    print(f"PROCESSING {split.upper()}")
    print("-" * 70)

    for index, image_path in enumerate(split_images, start=1):

        label_path = SOURCE_TRAIN_LABELS / f"{image_path.stem}.txt"

        destination_image = DEST / split / "images" / image_path.name
        destination_label = DEST / split / "labels" / f"{image_path.stem}.txt"

        # Copy image
        shutil.copy2(image_path, destination_image)

        has_target = convert_label(
            label_path,
            destination_label,
            split
        )

        if not has_target:
            images_without_target_annotations.append(
                (split, image_path.name)
            )

        if index % 100 == 0 or index == len(split_images):
            print(
                f"Processed {index}/{len(split_images)} images",
                end="\r"
            )

    print()


# ============================================================
# CREATE DATA.YAML
# ============================================================

yaml_content = """path: C:/Users/Prajwal/Desktop/MajorProject/PERLNEST/dataset3_findings

train: train/images
val: valid/images
test: test/images

nc: 5

names:
  - Implant
  - Filling
  - Composite filling
  - Amalgam filling
  - Crown
"""

with open(DEST / "data.yaml", "w", encoding="utf-8") as f:
    f.write(yaml_content)


# ============================================================
# VALIDATION SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("DATASET 3 FINDINGS SUMMARY")
print("=" * 70)

print(f"Source images              : {total}")
print(f"Train images               : {len(train_images)}")
print(f"Validation images          : {len(valid_images)}")
print(f"Test images                : {len(test_images)}")

print(f"\nSource annotations         : {total_source_annotations}")
print(f"Kept annotations           : {total_kept_annotations}")
print(f"Removed annotations        : {total_removed_annotations}")

print("\nFinal class distribution:")
print("-" * 70)

for class_id, class_name in enumerate(CLASS_NAMES):

    annotations = global_annotation_counts[class_id]
    images_count = global_image_counts[class_id]

    print(
        f"{class_id} | "
        f"{class_name:<20} | "
        f"annotations: {annotations:6d} | "
        f"images: {images_count:5d}"
    )


# ============================================================
# SPLIT DISTRIBUTION
# ============================================================

print("\n")
print("=" * 70)
print("SPLIT DISTRIBUTION")
print("=" * 70)

for split in ["train", "valid", "test"]:

    print(f"\n{split.upper()}")
    print("-" * 70)

    for class_id, class_name in enumerate(CLASS_NAMES):

        annotations = split_annotation_counts[split][class_id]
        images_count = split_image_counts[split][class_id]

        print(
            f"{class_id} | "
            f"{class_name:<20} | "
            f"annotations: {annotations:6d} | "
            f"images: {images_count:5d}"
        )


# ============================================================
# EXCLUDED CLASS COUNTS
# ============================================================

print("\n")
print("=" * 70)
print("REMOVED ORIGINAL CLASSES")
print("=" * 70)

original_class_names = {
    11: "Caries",
    27: "Mandible",
    28: "Maxilla"
}

for class_id, class_name in original_class_names.items():

    print(
        f"{class_id} | "
        f"{class_name:<10} | "
        f"removed annotations: "
        f"{removed_annotation_counts[class_id]}"
    )


# ============================================================
# IMAGES WITHOUT TARGET ANNOTATIONS
# ============================================================

print("\n")
print("=" * 70)
print("IMAGES WITHOUT TARGET ANNOTATIONS")
print("=" * 70)

print(
    f"Images with no remaining target annotations: "
    f"{len(images_without_target_annotations)}"
)

if images_without_target_annotations:

    print("\nFirst 20 examples:")

    for split, filename in images_without_target_annotations[:20]:
        print(f"{split}: {filename}")


print("\n")
print("=" * 70)
print("DATASET CREATION COMPLETED")
print("=" * 70)

print(f"\nOutput directory:")
print(DEST.resolve())

print("\nIMPORTANT:")
print("Original dataset3 was NOT modified.")
print("The new dataset contains 5 classes.")
print("Segmentation polygon coordinates were preserved.")