
from pathlib import Path
from collections import Counter

SOURCE = Path("dataset3/train/labels")
DEST = Path("dataset3_findings")

IMPLANT_CLASSES = {
    0, 1, 2, 4, 5, 6, 7, 8, 9, 10,
    13, 15, 16, 17, 18, 19, 21, 22, 23, 24,
    25, 26, 29, 30, 31
}
CLASS_MAPPING = {3: 3, 12: 2, 14: 4, 20: 1}
EXCLUDED = {11, 27, 28}

def read_labels(path):
    if not path.exists():
        return []
    return [
        line.split()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

def expected_conversion(lines):
    result = []
    for parts in lines:
        if len(parts) < 7:
            continue
        try:
            old_id = int(parts[0])
        except ValueError:
            continue

        if old_id in IMPLANT_CLASSES:
            new_id = 0
        elif old_id in CLASS_MAPPING:
            new_id = CLASS_MAPPING[old_id]
        elif old_id in EXCLUDED:
            continue
        else:
            continue

        # Compare class and coordinates numerically, allowing
        # harmless differences in decimal formatting.
        coords = tuple(round(float(x), 7) for x in parts[1:])
        result.append((new_id, coords))
    return Counter(result)

checked = 0
missing = []
mismatches = []

for src in sorted(SOURCE.glob("*.txt")):
    expected = expected_conversion(read_labels(src))
    dst = None

    for split in ("train", "valid", "test"):
        candidate = DEST / split / "labels" / src.name
        if candidate.exists():
            dst = candidate
            break

    checked += 1

    if dst is None:
        missing.append(src.name)
        continue

    actual = []
    for parts in read_labels(dst):
        try:
            class_id = int(parts[0])
            coords = tuple(round(float(x), 7) for x in parts[1:])
            actual.append((class_id, coords))
        except (ValueError, IndexError):
            continue

    if expected != Counter(actual):
        mismatches.append(src.name)

print("Source files checked:", checked)
print("Missing from all destination splits:", len(missing))
print("Annotation mismatches:", len(mismatches))
for name in mismatches[:10]:
    print("MISMATCH:", name)
