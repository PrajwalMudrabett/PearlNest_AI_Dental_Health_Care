"""
Quick script to compare different YOLO architectures and configurations
for Model 3 filling segmentation.

Usage:
    python compare_model_architectures.py --quick
    python compare_model_architectures.py --full
"""

import argparse
from pathlib import Path
import subprocess
import json
from datetime import datetime


CONFIGS = {
    "baseline": {
        "model": "yolov8n-seg.pt",
        "epochs": 50,
        "batch": 8,
        "lr": 0.01,
        "augmentation": "conservative",
        "description": "Original configuration (nano model)",
    },
    "improved_small": {
        "model": "yolov8s-seg.pt",
        "epochs": 100,
        "batch": 16,
        "lr": 0.001,
        "augmentation": "enhanced",
        "description": "Small model with enhanced augmentation",
    },
    "improved_medium": {
        "model": "yolov8m-seg.pt",
        "epochs": 150,
        "batch": 8,
        "lr": 0.001,
        "augmentation": "enhanced",
        "description": "Medium model (best accuracy)",
    },
    "yolo11_small": {
        "model": "yolo11s-seg.pt",
        "epochs": 100,
        "batch": 16,
        "lr": 0.001,
        "augmentation": "enhanced",
        "description": "YOLO11 small (latest architecture)",
    },
}


def run_training(config_name: str, config: dict, quick: bool = False) -> dict:
    """Run training with specified configuration."""
    print(f"\n{'='*70}")
    print(f"Training: {config_name}")
    print(f"Description: {config['description']}")
    print(f"{'='*70}\n")
    
    epochs = config["epochs"] if not quick else 20
    
    cmd = [
        "python",
        "train_model3_improved.py" if config["augmentation"] == "enhanced" else "train_model3.py",
        "train",
        "--yolo-base", config["model"],
        "--epochs", str(epochs),
        "--batch", str(config["batch"]),
        "--lr", str(config["lr"]),
        "--optimizer", "AdamW",
    ]
    
    print(f"Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        return {"status": "success", "config": config_name}
    except subprocess.CalledProcessError as e:
        print(f"ERROR training {config_name}: {e}")
        return {"status": "failed", "config": config_name, "error": str(e)}


def compare_results(results_dir: Path = Path("runs/segment")) -> None:
    """Compare results from different training runs."""
    print(f"\n{'='*70}")
    print("COMPARISON OF TRAINING RESULTS")
    print(f"{'='*70}\n")
    
    runs = list(results_dir.glob("*/results.csv"))
    
    if not runs:
        print("No training results found.")
        return
    
    comparison = []
    
    for run_csv in runs:
        try:
            # Read last line of results
            with open(run_csv, "r") as f:
                lines = f.readlines()
                if len(lines) < 2:
                    continue
                
                headers = lines[0].strip().split(",")
                last_epoch = lines[-1].strip().split(",")
                
                # Extract key metrics
                metrics = dict(zip(headers, last_epoch))
                
                comparison.append({
                    "run": run_csv.parent.name,
                    "mask_map50": float(metrics.get("metrics/mAP50(M)", 0)),
                    "mask_map50_95": float(metrics.get("metrics/mAP50-95(M)", 0)),
                    "precision": float(metrics.get("metrics/precision(M)", 0)),
                    "recall": float(metrics.get("metrics/recall(M)", 0)),
                    "epochs": int(metrics.get("epoch", 0)),
                })
        except Exception as e:
            print(f"Error reading {run_csv}: {e}")
    
    # Sort by mask_map50
    comparison.sort(key=lambda x: x["mask_map50"], reverse=True)
    
    # Print comparison table
    print(f"{'Run':<25} {'mAP@50':<10} {'mAP@50-95':<12} {'Precision':<12} {'Recall':<10} {'Epochs':<8}")
    print("-" * 95)
    
    for result in comparison:
        print(
            f"{result['run']:<25} "
            f"{result['mask_map50']:<10.4f} "
            f"{result['mask_map50_95']:<12.4f} "
            f"{result['precision']:<12.4f} "
            f"{result['recall']:<10.4f} "
            f"{result['epochs']:<8}"
        )
    
    # Save to JSON
    output_file = Path("model_comparison.json")
    with open(output_file, "w") as f:
        json.dump(
            {
                "timestamp": datetime.now().isoformat(),
                "results": comparison,
            },
            f,
            indent=2,
        )
    print(f"\n✓ Detailed comparison saved to: {output_file.resolve()}")


def main():
    parser = argparse.ArgumentParser(description="Compare Model 3 architectures")
    parser.add_argument("--quick", action="store_true", help="Quick test (20 epochs each)")
    parser.add_argument("--full", action="store_true", help="Full training for all configs")
    parser.add_argument(
        "--configs",
        nargs="+",
        choices=list(CONFIGS.keys()),
        help="Specific configs to run",
    )
    parser.add_argument("--compare-only", action="store_true", help="Only show comparison, no training")
    
    args = parser.parse_args()
    
    if args.compare_only:
        compare_results()
        return
    
    if not args.quick and not args.full and not args.configs:
        print("Please specify --quick, --full, or --configs")
        parser.print_help()
        return
    
    # Determine which configs to run
    if args.configs:
        configs_to_run = {k: CONFIGS[k] for k in args.configs}
    else:
        configs_to_run = CONFIGS
    
    # Run training for each config
    results = []
    for config_name, config in configs_to_run.items():
        result = run_training(config_name, config, quick=args.quick)
        results.append(result)
    
    # Show summary
    print(f"\n{'='*70}")
    print("TRAINING SUMMARY")
    print(f"{'='*70}\n")
    
    for result in results:
        status = "✓" if result["status"] == "success" else "✗"
        print(f"{status} {result['config']}: {result['status']}")
    
    # Compare results
    print("\nGenerating comparison...")
    compare_results()


if __name__ == "__main__":
    main()
