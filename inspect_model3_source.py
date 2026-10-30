
from pathlib import Path
from collections import Counter

ROOT = Path("dataset3")
LABEL_DIR = ROOT / "train" / "labels"

CLASS_NAMES = {
    0: "3M ESPE Implant",
    1: "AGS Medikal Implant",
    2: "AMerOss Implant",
    3: "Amalgam filling",
    11: "Caries",
    12: "Composite filling",
    14: "Crown",
    20: "Filling",
    27: "Mandible",
    28: "Maxilla",
}

target_classes = {3, 12, 14, 20}
files = sorted(LABEL_DIR.glob("*.txt"))

print(f"Source label files: {len(files)}")

for path in files[:10]:
    counts = Counter()

    for line in path.read_text().splitlines():
        parts = line.split()
        if not parts:
            continue

        try:
            class_id = int(parts[0])
            if class_id in target_classes:
                counts[class_id] += 1
        except ValueError:
            print(f"Malformed line: {path.name}: {line}")

    print(f"\n{path.name}")
    for class_id in sorted(target_classes):
        print(
            f"  {CLASS_NAMES[class_id]} "
            f"(ID {class_id}): {counts[class_id]}"
        )
