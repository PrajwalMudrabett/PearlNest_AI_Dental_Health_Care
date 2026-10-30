from pathlib import Path
from collections import Counter, defaultdict

DATASET = Path("dataset3")

CLASS_NAMES = [
    "3M ESPE Implant",
    "AGS Medikal Implant",
    "AMerOss Implant",
    "Amalgam filling",
    "Anthogyr Implant",
    "Bicon Implant",
    "BioHorizons Implant",
    "BioLife Implant",
    "Biomet 3i Implant",
    "Blue Sky Bio Implant",
    "Camlog Implant",
    "Caries",
    "Composite filling",
    "Cowellmedi Implant",
    "Crown",
    "DENTSPLY Implant",
    "Dentatus Implant",
    "Dentis Implant",
    "Dentium Implant",
    "Euroteknika Implant",
    "Filling",
    "Frontier Implant",
    "Hiossen Implant",
    "Implant",
    "Implant Direct",
    "Keystone Dental Implant",
    "MIS Implant",
    "Mandible",
    "Maxilla",
    "Megagen Implant",
    "Neodent Implant",
    "Neoss Implant"
]

SPLITS = ["train", "valid", "test"]

for split in SPLITS:

    label_dir = DATASET / split / "labels"

    annotation_counts = Counter()
    image_counts = Counter()

    total_images = 0
    total_lines = 0

    if not label_dir.exists():
        print(f"\n{split.upper()}: labels directory not found")
        continue

    for label_file in label_dir.glob("*.txt"):

        total_images += 1
        classes_in_image = set()

        with open(label_file, "r", encoding="utf-8") as f:

            for line in f:
                parts = line.strip().split()

                if not parts:
                    continue

                try:
                    class_id = int(parts[0])
                except ValueError:
                    continue

                if 0 <= class_id < len(CLASS_NAMES):
                    annotation_counts[class_id] += 1
                    classes_in_image.add(class_id)
                    total_lines += 1

        for class_id in classes_in_image:
            image_counts[class_id] += 1

    print("\n" + "=" * 70)
    print(f"{split.upper()}")
    print("=" * 70)

    print(f"Images: {total_images}")
    print(f"Annotations: {total_lines}")

    print("\nClass distribution:")
    print("-" * 70)

    for class_id, class_name in enumerate(CLASS_NAMES):

        annotations = annotation_counts[class_id]
        images = image_counts[class_id]

        print(
            f"{class_id:2d} | "
            f"{class_name:<25} | "
            f"annotations: {annotations:6d} | "
            f"images: {images:5d}"
        )

print("\n" + "=" * 70)
print("TARGET MODEL 3 CLASSES")
print("=" * 70)

TARGET_CLASSES = {
    3: "Amalgam filling",
    12: "Composite filling",
    14: "Crown",
    20: "Filling",
}

IMPLANT_CLASSES = [
    0, 1, 2, 4, 5, 6, 7, 8, 9, 10,
    13, 15, 16, 17, 18, 19, 21, 22, 23, 24,
    25, 26, 29, 30, 31
]

print("\nImplant classes:")
for class_id in IMPLANT_CLASSES:
    print(f"{class_id:2d} | {CLASS_NAMES[class_id]}")

print("\nOther target classes:")
for class_id, name in TARGET_CLASSES.items():
    print(f"{class_id:2d} | {name}")

print("\nExcluded classes:")
print("11 | Caries")
print("27 | Mandible")
print("28 | Maxilla")