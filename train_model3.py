from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import yaml

# ============================================================
# Pearl Nest — Model 3 Filling Segmentation Training Script
# ============================================================
# Dataset expected:
# dataset3_filling_only/
#   train/images, train/labels
#   valid/images, valid/labels
#   test/images, test/labels
#
# YOLO segmentation label format:
#   <class_id> <x1> <y1> <x2> <y2> ... <xn> <yn>
# Coordinates are normalized to 0..1. This dataset has one class:
#   0 -> Filling
#
# Usage:
#   python train_model3.py check
#   python train_model3.py train
#   python train_model3.py train --epochs 50 --batch 4
#   python train_model3.py train --resume
#   python train_model3.py validate
#   python train_model3.py predict --source dataset3_filling_only/test/images
# ============================================================

DATASET_DIR = Path("dataset3_filling_only")
DATA_YAML = DATASET_DIR / "data.yaml"
PROJECT_DIR = Path("runs/segment")
RUN_NAME = "model3-filling-segmentation"
PRETRAINED_WEIGHTS = "yolov8n-seg.pt"


def image_files(directory: Path) -> list[Path]:
    extensions = ("*.jpg", "*.jpeg", "*.png", "*.bmp", "*.webp")
    return sorted(p for pattern in extensions for p in directory.glob(pattern))


def generate_data_yaml(dataset_dir: Path, output_path: Path) -> None:
    """Write the correct paths for this dataset's train/valid/test structure."""
    data = {
        "path": str(dataset_dir.resolve()),
        "train": "train/images",
        "val": "valid/images",
        "test": "test/images",
        "nc": 1,
        "names": ["Filling"],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )
    print(f"Generated dataset configuration: {output_path.resolve()}")


def validate_dataset(dataset_dir: Path) -> dict:
    """Check split folders, image-label matching, and segmentation label values."""
    issues: list[str] = []
    stats: dict = {}

    for split in ("train", "valid", "test"):
        image_dir = dataset_dir / split / "images"
        label_dir = dataset_dir / split / "labels"
        if not image_dir.is_dir():
            issues.append(f"Missing directory: {image_dir}")
            continue
        if not label_dir.is_dir():
            issues.append(f"Missing directory: {label_dir}")
            continue

        images = image_files(image_dir)
        labels = sorted(label_dir.glob("*.txt"))
        image_stems = {p.stem for p in images}
        label_stems = {p.stem for p in labels}
        missing_labels = sorted(image_stems - label_stems)
        extra_labels = sorted(label_stems - image_stems)
        stats[split] = {
            "images": len(images),
            "labels": len(labels),
            "missing_labels": len(missing_labels),
            "extra_labels": len(extra_labels),
            "polygons": 0,
        }

        if not images:
            issues.append(f"{split}: no images found in {image_dir}")
        if missing_labels:
            issues.append(f"{split}: {len(missing_labels)} images have no matching label")
            for stem in missing_labels[:5]:
                issues.append(f"  -> missing label for {stem}")
        if extra_labels:
            issues.append(f"{split}: {len(extra_labels)} labels have no matching image")
            for stem in extra_labels[:5]:
                issues.append(f"  -> extra label {stem}.txt")

        for label_path in labels:
            for line_no, line in enumerate(label_path.read_text(encoding="utf-8").splitlines(), 1):
                if not line.strip():
                    continue
                parts = line.split()
                # Segmentation needs class ID plus at least 3 (x,y) points.
                if len(parts) < 7 or (len(parts) - 1) % 2 != 0:
                    issues.append(
                        f"{label_path}:{line_no}: expected class + at least 6 polygon coordinates; got {len(parts)} values"
                    )
                    continue
                try:
                    class_id = int(parts[0])
                    coords = [float(v) for v in parts[1:]]
                except ValueError:
                    issues.append(f"{label_path}:{line_no}: contains a non-numeric value")
                    continue
                if class_id != 0:
                    issues.append(f"{label_path}:{line_no}: class ID {class_id}; expected 0 (Filling)")
                bad = [v for v in coords if not 0.0 <= v <= 1.0]
                if bad:
                    issues.append(f"{label_path}:{line_no}: polygon coordinate outside 0..1 (example {bad[0]})")
                stats[split]["polygons"] += 1

    return {"issues": issues, "stats": stats}


def show_validation(result: dict) -> None:
    print("\n" + "=" * 60)
    print("MODEL 3 DATASET VALIDATION")
    print("=" * 60)
    for split, values in result["stats"].items():
        print(f"\n{split.upper()}:")
        for key, value in values.items():
            print(f"  {key.replace('_', ' ').title()}: {value}")
    if result["issues"]:
        print(f"\nISSUES FOUND: {len(result['issues'])}")
        for issue in result["issues"][:60]:
            print(f"  - {issue}")
        if len(result["issues"]) > 60:
            print(f"  ... and {len(result['issues']) - 60} more")
    else:
        print("\nOK: Dataset structure and segmentation labels look valid.")


def train(args: argparse.Namespace) -> None:
    from ultralytics import YOLO

    run_dir = PROJECT_DIR / RUN_NAME
    if args.resume:
        last_checkpoint = run_dir / "weights" / "last.pt"
        if not last_checkpoint.exists():
            print(f"ERROR: Cannot resume; checkpoint not found: {last_checkpoint.resolve()}")
            sys.exit(1)
        print(f"Resuming from: {last_checkpoint.resolve()}")
        model = YOLO(str(last_checkpoint))
        model.train(resume=True)
        return

    # Use a segmentation checkpoint. Model 1's detection weights are not compatible
    # with a segmentation head, so Model 3 starts from YOLOv8 segmentation pretrained weights.
    model = YOLO(args.yolo_base)
    train_args = {
        "data": str(DATA_YAML.resolve()),
        "epochs": args.epochs,
        "batch": args.batch,
        "imgsz": args.imgsz,
        "project": str(PROJECT_DIR),
        "name": RUN_NAME,
        "exist_ok": True,
        "patience": args.patience,
        "save_period": 10,
        "device": args.device,
        "workers": args.workers,
        "verbose": True,
        "plots": True,
        "save": True,
        # Conservative augmentation for dental radiographs.
        "hsv_h": 0.0,
        "hsv_s": 0.0,
        "hsv_v": 0.2,
        "degrees": 3.0,
        "translate": 0.05,
        "scale": 0.2,
        "flipud": 0.0,
        "fliplr": 0.5,
        "mosaic": 0.0,
        "mixup": 0.0,
    }
    if args.optimizer:
        train_args["optimizer"] = args.optimizer
    if args.lr is not None:
        train_args["lr0"] = args.lr

    print("\n" + "=" * 60)
    print("MODEL 3 — FILLING SEGMENTATION TRAINING")
    print("=" * 60)
    print(f"Dataset: {DATASET_DIR.resolve()}")
    print(f"Pretrained segmentation model: {args.yolo_base}")
    for key, value in train_args.items():
        print(f"  {key}: {value}")
    print("=" * 60)

    model.train(**train_args)
    best_path = run_dir / "weights" / "best.pt"
    print("\nTRAINING COMPLETE")
    print(f"Best weights: {best_path.resolve()}")
    print(f"Last weights: {(run_dir / 'weights' / 'last.pt').resolve()}")


def validate_model(args: argparse.Namespace) -> None:
    from ultralytics import YOLO

    weights = Path(args.weights)
    if not weights.exists():
        print(f"ERROR: Model weights not found: {weights.resolve()}")
        sys.exit(1)
    model = YOLO(str(weights))
    results = model.val(
        data=str(DATA_YAML.resolve()),
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        split=args.split,
        plots=True,
        verbose=True,
    )
    print("\nVALIDATION RESULTS")
    print("=" * 60)
    if hasattr(results, "seg") and results.seg is not None:
        print(f"Mask mAP@50:     {results.seg.map50:.4f}")
        print(f"Mask mAP@50-95:  {results.seg.map:.4f}")
    if hasattr(results, "box") and results.box is not None:
        print(f"Box mAP@50:      {results.box.map50:.4f}")
        print(f"Box mAP@50-95:   {results.box.map:.4f}")
        print(f"Precision:       {results.box.mp:.4f}")
        print(f"Recall:          {results.box.mr:.4f}")


def predict(args: argparse.Namespace) -> None:
    from ultralytics import YOLO

    weights = Path(args.weights)
    if not weights.exists():
        print(f"ERROR: Model weights not found: {weights.resolve()}")
        sys.exit(1)
    source = Path(args.source)
    if not source.exists():
        print(f"ERROR: Prediction source not found: {source.resolve()}")
        sys.exit(1)
    model = YOLO(str(weights))
    results = model.predict(
        source=str(source),
        imgsz=args.imgsz,
        conf=args.conf,
        device=args.device,
        save=True,
        project="runs/diagnostics/model3",
        name="filling_predictions",
        exist_ok=True,
    )
    print(f"Prediction results saved under: {Path('runs/diagnostics/model3/filling_predictions').resolve()}")
    print(f"Images processed: {len(results)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pearl Nest — train and evaluate Model 3 (Filling segmentation)"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("check", help="Validate dataset structure and segmentation labels")

    train_parser = subparsers.add_parser("train", help="Train Model 3")
    train_parser.add_argument("--epochs", type=int, default=100)
    train_parser.add_argument("--batch", type=int, default=8)
    train_parser.add_argument("--imgsz", type=int, default=896)
    train_parser.add_argument("--device", default="0", help="GPU index, or 'cpu'")
    train_parser.add_argument("--workers", type=int, default=4)
    train_parser.add_argument("--patience", type=int, default=20)
    train_parser.add_argument("--yolo-base", default=PRETRAINED_WEIGHTS)
    train_parser.add_argument("--resume", action="store_true")
    train_parser.add_argument("--optimizer", default=None)
    train_parser.add_argument("--lr", type=float, default=None)

    val_parser = subparsers.add_parser("validate", help="Evaluate trained segmentation model")
    val_parser.add_argument("--weights", default=str(PROJECT_DIR / RUN_NAME / "weights" / "best.pt"))
    val_parser.add_argument("--imgsz", type=int, default=896)
    val_parser.add_argument("--batch", type=int, default=8)
    val_parser.add_argument("--device", default="0")
    val_parser.add_argument("--split", choices=("val", "test"), default="test")

    pred_parser = subparsers.add_parser("predict", help="Predict filling masks on an image or folder")
    pred_parser.add_argument("--weights", default=str(PROJECT_DIR / RUN_NAME / "weights" / "best.pt"))
    pred_parser.add_argument("--source", default=str(DATASET_DIR / "test" / "images"))
    pred_parser.add_argument("--imgsz", type=int, default=896)
    pred_parser.add_argument("--conf", type=float, default=0.25)
    pred_parser.add_argument("--device", default="0")

    args = parser.parse_args()
    if not DATASET_DIR.is_dir():
        print(f"ERROR: Dataset folder not found: {DATASET_DIR.resolve()}")
        print("Make sure dataset3_filling_only is in the project root.")
        sys.exit(1)

    if args.command == "check":
        result = validate_dataset(DATASET_DIR)
        show_validation(result)
        generate_data_yaml(DATASET_DIR, DATA_YAML)
        if result["issues"]:
            sys.exit(1)
        print("\nReady to train: python train_model3.py train")
    elif args.command == "train":
        generate_data_yaml(DATASET_DIR, DATA_YAML)
        result = validate_dataset(DATASET_DIR)
        show_validation(result)
        if result["issues"]:
            answer = input("Dataset issues were found. Continue anyway? (y/n): ").strip().lower()
            if answer != "y":
                sys.exit(1)
        # Save a backup of the current best checkpoint before overwriting this run.
        best_path = PROJECT_DIR / RUN_NAME / "weights" / "best.pt"
        backup_path = best_path.with_name("best_backup.pt")
        if best_path.exists() and not backup_path.exists() and not args.resume:
            shutil.copy2(best_path, backup_path)
            print(f"Backed up previous best weights to: {backup_path.resolve()}")
        train(args)
    elif args.command == "validate":
        generate_data_yaml(DATASET_DIR, DATA_YAML)
        validate_model(args)
    elif args.command == "predict":
        predict(args)


if __name__ == "__main__":
    main()
