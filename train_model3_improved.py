from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import yaml

# ============================================================
# Pearl Nest — Model 3 IMPROVED Filling Segmentation Training
# ============================================================
# This version includes optimizations for better accuracy:
# - Larger default model (YOLOv8s-seg)
# - Enhanced augmentation
# - Better hyperparameters
# - Image preprocessing option
#
# Usage:
#   python train_model3_improved.py train
#   python train_model3_improved.py train --model yolov8m-seg.pt
#   python train_model3_improved.py train --preprocess clahe
# ============================================================

DATASET_DIR = Path("dataset3_filling_only")
DATA_YAML = DATASET_DIR / "data.yaml"
PROJECT_DIR = Path("runs/segment")
RUN_NAME = "model3-improved"
PRETRAINED_WEIGHTS = "yolov8s-seg.pt"  # Changed from nano to small


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
    print("MODEL 3 IMPROVED - DATASET VALIDATION")
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
        print("\n✓ Dataset structure and segmentation labels look valid.")


def preprocess_images(preprocess_type: str) -> None:
    """Apply preprocessing to improve X-ray image quality."""
    if preprocess_type == "none":
        return
    
    print(f"\n{'='*60}")
    print(f"PREPROCESSING: {preprocess_type.upper()}")
    print(f"{'='*60}")
    
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("ERROR: opencv-python required for preprocessing")
        print("Install: pip install opencv-python")
        sys.exit(1)
    
    preprocessed_dir = DATASET_DIR / "preprocessed" / preprocess_type
    
    for split in ("train", "valid", "test"):
        source_dir = DATASET_DIR / split / "images"
        dest_dir = preprocessed_dir / split / "images"
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        images = image_files(source_dir)
        print(f"Processing {split}: {len(images)} images...")
        
        for img_path in images:
            img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
            
            if preprocess_type == "clahe":
                # CLAHE - Contrast Limited Adaptive Histogram Equalization
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                img = clahe.apply(img)
            
            elif preprocess_type == "gamma":
                # Gamma correction
                gamma = 1.2
                img = np.power(img / 255.0, gamma) * 255.0
                img = img.astype(np.uint8)
            
            elif preprocess_type == "clahe_gamma":
                # Combined CLAHE + Gamma
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                img = clahe.apply(img)
                gamma = 1.2
                img = np.power(img / 255.0, gamma) * 255.0
                img = img.astype(np.uint8)
            
            cv2.imwrite(str(dest_dir / img_path.name), img)
        
        # Copy labels
        label_source = DATASET_DIR / split / "labels"
        label_dest = preprocessed_dir / split / "labels"
        if label_source.exists():
            shutil.copytree(label_source, label_dest, dirs_exist_ok=True)
    
    print(f"✓ Preprocessing complete: {preprocessed_dir}")
    return preprocessed_dir


def train(args: argparse.Namespace) -> None:
    from ultralytics import YOLO

    # Handle preprocessing
    dataset_path = DATASET_DIR
    if args.preprocess != "none":
        preprocessed_path = preprocess_images(args.preprocess)
        dataset_path = preprocessed_path
        data_yaml = preprocessed_path / "data.yaml"
        generate_data_yaml(preprocessed_path, data_yaml)
    else:
        data_yaml = DATA_YAML

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

    model = YOLO(args.yolo_base)
    
    # IMPROVED TRAINING ARGUMENTS
    train_args = {
        "data": str(data_yaml.resolve()),
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
        
        # ENHANCED AUGMENTATION for better generalization
        "hsv_h": 0.0,           # No hue (grayscale)
        "hsv_s": 0.0,           # No saturation
        "hsv_v": 0.4,           # Increased from 0.2
        "degrees": 15.0,        # Increased rotation from 3.0
        "translate": 0.1,       # Increased from 0.05
        "scale": 0.5,           # Increased from 0.2
        "shear": 2.0,           # Added shear
        "perspective": 0.0001,  # Added perspective
        "flipud": 0.0,          # No vertical flip
        "fliplr": 0.5,          # Keep horizontal flip
        "mosaic": 1.0,          # Enable mosaic (was 0.0)
        "mixup": 0.1,           # Enable mixup (was 0.0)
        "copy_paste": 0.3,      # Enable copy-paste augmentation
        
        # Regularization
        "dropout": 0.0,         # Can add if overfitting
    }
    
    if args.optimizer:
        train_args["optimizer"] = args.optimizer
    if args.lr is not None:
        train_args["lr0"] = args.lr
    if args.weight_decay is not None:
        train_args["weight_decay"] = args.weight_decay
    if args.warmup_epochs is not None:
        train_args["warmup_epochs"] = args.warmup_epochs

    print("\n" + "=" * 60)
    print("MODEL 3 IMPROVED — FILLING SEGMENTATION TRAINING")
    print("=" * 60)
    print(f"Dataset: {dataset_path.resolve()}")
    print(f"Model: {args.yolo_base}")
    print(f"Preprocessing: {args.preprocess}")
    print("\nKey Parameters:")
    for key in ["epochs", "batch", "imgsz", "optimizer", "lr0", "patience"]:
        if key in train_args:
            print(f"  {key}: {train_args[key]}")
    print("\nAugmentation Settings:")
    aug_keys = ["degrees", "translate", "scale", "mosaic", "mixup", "copy_paste"]
    for key in aug_keys:
        if key in train_args:
            print(f"  {key}: {train_args[key]}")
    print("=" * 60)

    model.train(**train_args)
    
    best_path = run_dir / "weights" / "best.pt"
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"Best weights: {best_path.resolve()}")
    print(f"Last weights: {(run_dir / 'weights' / 'last.pt').resolve()}")
    print("\nNext steps:")
    print(f"  1. Validate: python {Path(__file__).name} validate")
    print(f"  2. Predict: python {Path(__file__).name} predict")


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
    
    print("\n" + "=" * 60)
    print("VALIDATION RESULTS")
    print("=" * 60)
    if hasattr(results, "seg") and results.seg is not None:
        print(f"Mask mAP@50:     {results.seg.map50:.4f}")
        print(f"Mask mAP@50-95:  {results.seg.map:.4f}")
    if hasattr(results, "box") and results.box is not None:
        print(f"Box mAP@50:      {results.box.map50:.4f}")
        print(f"Box mAP@50-95:   {results.box.map:.4f}")
        print(f"Precision:       {results.box.mp:.4f}")
        print(f"Recall:          {results.box.mr:.4f}")
    print("=" * 60)


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
        name="improved_predictions",
        exist_ok=True,
    )
    print(f"✓ Prediction results saved: {Path('runs/diagnostics/model3/improved_predictions').resolve()}")
    print(f"✓ Images processed: {len(results)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pearl Nest — IMPROVED Model 3 Training (Filling segmentation)"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("check", help="Validate dataset structure and labels")

    # TRAIN COMMAND
    train_parser = subparsers.add_parser("train", help="Train improved Model 3")
    train_parser.add_argument("--epochs", type=int, default=150, help="Training epochs (increased from 100)")
    train_parser.add_argument("--batch", type=int, default=16, help="Batch size (increased from 8)")
    train_parser.add_argument("--imgsz", type=int, default=896, help="Image size")
    train_parser.add_argument("--device", default="0", help="GPU index or 'cpu'")
    train_parser.add_argument("--workers", type=int, default=8, help="Data loader workers")
    train_parser.add_argument("--patience", type=int, default=30, help="Early stopping patience (increased from 20)")
    train_parser.add_argument("--yolo-base", default=PRETRAINED_WEIGHTS, help="Base YOLO model (yolov8s-seg.pt default)")
    train_parser.add_argument("--resume", action="store_true", help="Resume from last checkpoint")
    train_parser.add_argument("--optimizer", default="AdamW", help="Optimizer (AdamW, SGD, Adam)")
    train_parser.add_argument("--lr", type=float, default=0.001, help="Initial learning rate")
    train_parser.add_argument("--weight-decay", type=float, default=0.0005, help="Weight decay")
    train_parser.add_argument("--warmup-epochs", type=int, default=5, help="Warmup epochs")
    train_parser.add_argument(
        "--preprocess",
        choices=["none", "clahe", "gamma", "clahe_gamma"],
        default="none",
        help="Image preprocessing type",
    )

    # VALIDATE COMMAND
    val_parser = subparsers.add_parser("validate", help="Evaluate trained model")
    val_parser.add_argument("--weights", default=str(PROJECT_DIR / RUN_NAME / "weights" / "best.pt"))
    val_parser.add_argument("--imgsz", type=int, default=896)
    val_parser.add_argument("--batch", type=int, default=16)
    val_parser.add_argument("--device", default="0")
    val_parser.add_argument("--split", choices=("val", "test"), default="test")

    # PREDICT COMMAND
    pred_parser = subparsers.add_parser("predict", help="Predict filling masks")
    pred_parser.add_argument("--weights", default=str(PROJECT_DIR / RUN_NAME / "weights" / "best.pt"))
    pred_parser.add_argument("--source", default=str(DATASET_DIR / "test" / "images"))
    pred_parser.add_argument("--imgsz", type=int, default=896)
    pred_parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold")
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
        print(f"\n✓ Ready to train: python {Path(__file__).name} train")
        
    elif args.command == "train":
        generate_data_yaml(DATASET_DIR, DATA_YAML)
        result = validate_dataset(DATASET_DIR)
        show_validation(result)
        if result["issues"]:
            answer = input("Dataset issues found. Continue? (y/n): ").strip().lower()
            if answer != "y":
                sys.exit(1)
        
        # Backup previous best weights
        best_path = PROJECT_DIR / RUN_NAME / "weights" / "best.pt"
        backup_path = best_path.with_name("best_backup.pt")
        if best_path.exists() and not backup_path.exists() and not args.resume:
            shutil.copy2(best_path, backup_path)
            print(f"✓ Backed up previous weights: {backup_path.resolve()}")
        
        train(args)
        
    elif args.command == "validate":
        generate_data_yaml(DATASET_DIR, DATA_YAML)
        validate_model(args)
        
    elif args.command == "predict":
        predict(args)


if __name__ == "__main__":
    main()
