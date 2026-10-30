
from pathlib import Path
from collections import Counter

LABEL_DIRS = [
    Path("dataset3_findings/train/labels"),
    Path("dataset3_findings/valid/labels"),
    Path("dataset3_findings/test/labels"),
]

CLASS_NAMES = {
    0: "Implant",
    1: "Filling",
    2: "Composite filling",
    3: "Amalgam filling",
    4: "Crown",
}

for label_dir in LABEL_DIRS:
    print(f"\n{'=' * 55}")
    print(f"Folder: {label_dir}")
    print(f"{'=' * 55}")

    if not label_dir.exists():
        print("Folder not found!")
        continue

    counts = Counter()
    files = list(label_dir.glob("*.txt"))
    malformed = 0

    for file in files:
        for line in file.read_text(encoding="utf-8").splitlines():
            parts = line.split()
            if not parts:
                continue

            try:
                class_id = int(parts[0])
            except ValueError:
                malformed += 1
                continue

            if class_id not in CLASS_NAMES:
                malformed += 1
                continue

            counts[class_id] += 1

    print(f"Label files: {len(files)}")
    print(f"Malformed/unknown-class lines: {malformed}")

    for class_id, name in CLASS_NAMES.items():
        print(f"{class_id} - {name}: {counts[class_id]} polygons")

    print(f"Total polygons: {sum(counts.values())}")
