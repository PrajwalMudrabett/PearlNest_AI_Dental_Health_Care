# Pearl Nest — Model 1 Retraining Guide

## Step 1 — Get the Dataset from Your Friend

Ask your friend to copy the **entire `dataset1` folder** from their laptop. You need:

```
dataset1/
├── train/
│   ├── images/    ← training X-ray images (.jpg or .png)
│   └── labels/    ← YOLO label files (.txt)
└── val/
    ├── images/    ← validation X-ray images
    └── labels/    ← YOLO label files
```

Place this folder directly inside your project:
```
C:\Users\Ramaskandan\Downloads\PERLNEST_SHARE\dataset1\
```

> [!IMPORTANT]
> If your friend also has a `data.yaml` file, copy that too — but the training script will generate a new one automatically.

---

## Step 2 — Label Format

Each `.txt` label file must have one line per tooth, in **YOLO format**:

```
<class_id> <x_center> <y_center> <width> <height>
```

All coordinates are **normalized (0–1)** relative to image dimensions.

### Class ID → FDI Mapping (32 classes)

| ID | FDI | ID | FDI | ID | FDI | ID | FDI |
|----|-----|----|-----|----|-----|----|-----|
| 0  | 11  | 8  | 21  | 16 | 31  | 24 | 41  |
| 1  | 12  | 9  | 22  | 17 | 32  | 25 | 42  |
| 2  | 13  | 10 | 23  | 18 | 33  | 26 | 43  |
| 3  | 14  | 11 | 24  | 19 | 34  | 27 | 44  |
| 4  | 15  | 12 | 25  | 20 | 35  | 28 | 45  |
| 5  | 16  | 13 | 26  | 21 | 36  | 29 | 46  |
| 6  | 17  | 14 | 27  | 22 | 37  | 30 | 47  |
| 7  | 18  | 15 | 28  | 23 | 38  | 31 | 48  |

---

## Step 3 — Validate the Dataset

```powershell
python train_model1.py check
```

This will:
- Verify the folder structure exists
- Check that each image has a matching label
- Validate label format and class IDs
- Generate `dataset1/data.yaml`

---

## Step 4 — Train

### Option A: Transfer learning from existing model (recommended)
Uses the existing `best.pt` as starting weights — faster convergence:

```powershell
python train_model1.py train --epochs 100 --batch 16
```

### Option B: Train from scratch
If the existing model is too broken to build on:

```powershell
python train_model1.py train --from-scratch --epochs 150 --batch 16
```

### Option C: Resume interrupted training

```powershell
python train_model1.py train --resume
```

### GPU Memory Issues?
Reduce batch size:

```powershell
python train_model1.py train --epochs 100 --batch 8
```

Or use CPU (much slower):

```powershell
python train_model1.py train --epochs 100 --batch 4 --device cpu
```

---

## Step 5 — Validate & Compare

### Check metrics:
```powershell
python train_model1.py validate
```

### Compare old vs new model on a test image:
```powershell
python train_model1.py compare --test-image implant.jpg
```

This saves side-by-side predictions in `runs/diagnostics/model1_comparison/`.

---

## Step 6 — Use the New Model in Pearl Nest

Once you're happy with the results, update **one line** in [`perlnest_pipeline.py`](file:///c:/Users/Ramaskandan/Downloads/PERLNEST_SHARE/perlnest_pipeline.py):

```python
# Change this line (line 15):
MODEL1_PATH = r"runs\detect\train-3\weights\best.pt"

# To this:
MODEL1_PATH = r"runs\detect\train-model1-retrained\weights\best.pt"
```

> [!WARNING]
> The original model is automatically backed up to `runs\detect\train-3\weights\best_backup.pt` before training starts. You can always revert.

---

## Training Settings Explained

The script uses **dental X-ray specific** augmentation:

| Setting | Value | Why |
|---------|-------|-----|
| `flipud` | 0.0 | Never flip vertically — jaw anatomy is always up/down |
| `fliplr` | 0.5 | Horizontal flip OK — mirrors left/right symmetry |
| `hsv_h` | 0.005 | X-rays are grayscale, minimal hue shift |
| `degrees` | 5.0 | Teeth don't rotate much in panoramic X-rays |
| `cls` loss | 1.5 | Increased from default — penalizes wrong FDI numbers more |
| `mixup` | 0.0 | Disabled — mixing X-rays confuses tooth boundaries |
| `patience` | 20 | Early stopping if no improvement for 20 epochs |

---

## Quick Reference

```powershell
# Full workflow:
python train_model1.py check                            # 1. Validate dataset
python train_model1.py train --epochs 100 --batch 16    # 2. Train
python train_model1.py validate                         # 3. Check metrics
python train_model1.py compare --test-image implant.jpg # 4. Compare
```
