"""
Hyperparameter tuning script for Model 3 using Ultralytics built-in tuner.

This uses Ray Tune for efficient hyperparameter search.

Install requirements:
    pip install ray[tune]

Usage:
    python tune_hyperparameters.py --iterations 50
    python tune_hyperparameters.py --iterations 10 --quick-test
"""

import argparse
from pathlib import Path


def tune_hyperparameters(
    model_path: str = "yolov8s-seg.pt",
    data_yaml: str = "dataset3_filling_only/data.yaml",
    iterations: int = 50,
    epochs_per_iteration: int = 30,
) -> None:
    """
    Run hyperparameter tuning using YOLO's built-in tuner.
    
    Args:
        model_path: Path to base YOLO model
        data_yaml: Path to dataset configuration
        iterations: Number of tuning iterations
        epochs_per_iteration: Training epochs per trial
    """
    try:
        from ultralytics import YOLO
    except ImportError:
        print("ERROR: ultralytics not installed")
        print("Install: pip install ultralytics")
        return
    
    print(f"\n{'='*70}")
    print("HYPERPARAMETER TUNING FOR MODEL 3")
    print(f"{'='*70}\n")
    print(f"Model: {model_path}")
    print(f"Dataset: {data_yaml}")
    print(f"Iterations: {iterations}")
    print(f"Epochs per trial: {epochs_per_iteration}")
    print(f"{'='*70}\n")
    
    model = YOLO(model_path)
    
    # Define search space (optional - YOLO has good defaults)
    # You can customize this based on what you want to tune
    search_space = {
        # Learning rate
        "lr0": (1e-5, 1e-1),
        "lrf": (0.01, 1.0),
        
        # Momentum and weight decay
        "momentum": (0.6, 0.98),
        "weight_decay": (0.0, 0.001),
        
        # Data augmentation
        "hsv_v": (0.0, 0.6),
        "degrees": (0.0, 45.0),
        "translate": (0.0, 0.2),
        "scale": (0.0, 0.9),
        "shear": (0.0, 10.0),
        "perspective": (0.0, 0.001),
        "flipud": (0.0, 1.0),
        "fliplr": (0.0, 1.0),
        "mosaic": (0.0, 1.0),
        "mixup": (0.0, 1.0),
        "copy_paste": (0.0, 1.0),
        
        # Batch and image size
        "batch": [8, 16, 32],
        # "imgsz": [640, 736, 896, 1024],  # Uncomment to tune image size
    }
    
    # Run tuning
    result = model.tune(
        data=data_yaml,
        epochs=epochs_per_iteration,
        iterations=iterations,
        optimizer="AdamW",
        plots=True,
        save=True,
        val=True,
        # space=search_space,  # Uncomment to use custom search space
    )
    
    print(f"\n{'='*70}")
    print("TUNING COMPLETE")
    print(f"{'='*70}\n")
    print(f"Best hyperparameters saved to: {result}")
    print("\nTo train with best hyperparameters:")
    print("  1. Check the tune results directory")
    print("  2. Use the best hyperparameters in train_model3_improved.py")


def manual_grid_search(quick: bool = False) -> None:
    """
    Simple grid search over key hyperparameters.
    Useful when Ray Tune is not available.
    """
    import subprocess
    from itertools import product
    
    print(f"\n{'='*70}")
    print("MANUAL GRID SEARCH")
    print(f"{'='*70}\n")
    
    # Define parameter grid
    learning_rates = [0.0005, 0.001, 0.005] if not quick else [0.001]
    batch_sizes = [8, 16] if not quick else [16]
    optimizers = ["AdamW", "SGD"] if not quick else ["AdamW"]
    
    results = []
    
    for lr, batch, optimizer in product(learning_rates, batch_sizes, optimizers):
        config_name = f"lr{lr}_batch{batch}_{optimizer}"
        print(f"\nTesting: {config_name}")
        
        cmd = [
            "python",
            "train_model3_improved.py",
            "train",
            "--epochs", "50" if not quick else "20",
            "--batch", str(batch),
            "--lr", str(lr),
            "--optimizer", optimizer,
            "--patience", "15",
        ]
        
        try:
            subprocess.run(cmd, check=True)
            results.append({"config": config_name, "status": "success"})
        except subprocess.CalledProcessError as e:
            print(f"ERROR: {e}")
            results.append({"config": config_name, "status": "failed"})
    
    # Print summary
    print(f"\n{'='*70}")
    print("GRID SEARCH SUMMARY")
    print(f"{'='*70}\n")
    
    for result in results:
        status = "✓" if result["status"] == "success" else "✗"
        print(f"{status} {result['config']}")
    
    print("\nRun comparison script to see results:")
    print("  python compare_model_architectures.py --compare-only")


def main():
    parser = argparse.ArgumentParser(description="Tune Model 3 hyperparameters")
    parser.add_argument(
        "--method",
        choices=["auto", "manual"],
        default="auto",
        help="Tuning method (auto=Ray Tune, manual=grid search)",
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=50,
        help="Number of tuning iterations (auto mode)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=30,
        help="Epochs per iteration (auto mode)",
    )
    parser.add_argument(
        "--model",
        default="yolov8s-seg.pt",
        help="Base YOLO model",
    )
    parser.add_argument(
        "--quick-test",
        action="store_true",
        help="Quick test mode (fewer iterations/configs)",
    )
    
    args = parser.parse_args()
    
    if args.method == "auto":
        iterations = 10 if args.quick_test else args.iterations
        epochs = 15 if args.quick_test else args.epochs
        
        tune_hyperparameters(
            model_path=args.model,
            data_yaml="dataset3_filling_only/data.yaml",
            iterations=iterations,
            epochs_per_iteration=epochs,
        )
    else:
        manual_grid_search(quick=args.quick_test)


if __name__ == "__main__":
    main()
