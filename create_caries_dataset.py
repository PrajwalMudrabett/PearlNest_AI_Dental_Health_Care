from pathlib import Path
import shutil

SOURCE = Path("dataset2")
DEST = Path("dataset2_caries")

SPLITS = ["train", "valid", "test"]

# Original Dataset 2 class ID for Caries
CARIES_CLASS_ID = 13

# New dataset will have only one class:
# 0 = Caries


def process_split(split):
    src_images = SOURCE / split / "images"
    src_labels = SOURCE / split / "labels"

    dst_images = DEST / split / "images"
    dst_labels = DEST / split / "labels"

    dst_images.mkdir(parents=True, exist_ok=True)
    dst_labels.mkdir(parents=True, exist_ok=True)

    total_images = 0
    images_with_caries = 0
    caries_annotations = 0

    for image_path in src_images.iterdir():

        if not image_path.is_file():
            continue

        total_images += 1

        label_path = src_labels / f"{image_path.stem}.txt"

        caries_lines = []

        if label_path.exists():

            with open(label_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            for line in lines:
                parts = line.strip().split()

                if not parts:
                    continue

                try:
                    class_id = int(parts[0])
                except ValueError:
                    continue

                if class_id == CARIES_CLASS_ID:
                    # Change original class 13 -> new class 0
                    parts[0] = "0"
                    caries_lines.append(" ".join(parts))

        # Copy image
        shutil.copy2(
            image_path,
            dst_images / image_path.name
        )

        # Write only Caries annotations
        with open(
            dst_labels / f"{image_path.stem}.txt",
            "w",
            encoding="utf-8"
        ) as f:

            if caries_lines:
                f.write("\n".join(caries_lines) + "\n")

        if caries_lines:
            images_with_caries += 1
            caries_annotations += len(caries_lines)

    print(f"\n{split.upper()}")
    print("-" * 40)
    print(f"Total images       : {total_images}")
    print(f"Images with caries : {images_with_caries}")
    print(f"Caries annotations : {caries_annotations}")
    print(f"Negative images    : {total_images - images_with_caries}")


print("Creating Caries-only Dataset 2...")
print("=" * 50)

for split in SPLITS:
    process_split(split)

print("\nDataset creation completed.")