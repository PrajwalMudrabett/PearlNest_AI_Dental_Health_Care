# Dental AI Multi-Model X-Ray Project — Handoff v1

## Goal

Build a multi-model AI system that accepts a panoramic dental X-ray/OPG and produces AI-assisted findings:

1. Tooth detection
2. FDI tooth numbering
3. Caries/cavity detection
4. Dental findings: Implant, Filling, Composite filling, Amalgam filling, Crown

This is an educational/research system, not a clinical diagnosis tool.

---

## Architecture

```text
Panoramic X-ray
      |
      +--> Model 1: Tooth Detection + FDI numbering
      |
      +--> Model 2: Caries Detection/Segmentation
      |
      +--> Model 3: Dental Findings
                 |-- Implant
                 |-- Filling
                 |-- Composite filling
                 |-- Amalgam filling
                 `-- Crown
      |
      v
Combined visual output + report
```

---

# Dataset 1 — Tooth Detection + FDI Numbering

## Status: Downloaded, cleaned, validated

Roboflow dataset:

- Teeth Detection and Numbering
- Version: v18
- Format: YOLOv8 Object Detection
- Total images: 2,528

### Split

| Split | Images | Labels |
|---|---:|---:|
| Train | 2,250 | 2,250 |
| Validation | 250 | 250 |
| Test | 28 | 28 |
| Total | 2,528 | 2,528 |

### Classes

32 FDI permanent teeth:

```text
11 12 13 14 15 16 17 18
21 22 23 24 25 26 27 28
31 32 33 34 35 36 37 38
41 42 43 44 45 46 47 48
```

### Structure

```text
dataset1/
├── train/
│   ├── images/
│   └── labels/
├── valid/
│   ├── images/
│   └── labels/
├── test/
│   ├── images/
│   └── labels/
└── data.yml
```

### YOLO label format

```text
class_id x_center y_center width height
```

Coordinates are normalized 0–1.

Class mapping comes from `data.yml`:

```text
0 -> 11
1 -> 12
...
31 -> 48
```

### Dataset cleaning

During validation, 8 malformed polygon-style annotation lines were found in the detection labels. They were converted into normal YOLO bounding boxes.

Post-cleaning validation:

```text
Train images:              2250
Validation images:          250
Test images:                 28
Missing labels:               0
Orphan labels:                0
Invalid annotation lines:     0
Invalid coordinates:          0
Classes:                     32
```

The original dataset should remain as a backup. Use the cleaned labels for training.

### Verified `data.yml`

```yaml
train: train/images
val: valid/images
test: test/images

nc: 32

names:
  - "11"
  - "12"
  - "13"
  - "14"
  - "15"
  - "16"
  - "17"
  - "18"
  - "21"
  - "22"
  - "23"
  - "24"
  - "25"
  - "26"
  - "27"
  - "28"
  - "31"
  - "32"
  - "33"
  - "34"
  - "35"
  - "36"
  - "37"
  - "38"
  - "41"
  - "42"
  - "43"
  - "44"
  - "45"
  - "46"
  - "47"
  - "48"
```

README files are optional. Do not delete `data.yml`.

---

# Dataset 2 — Caries + Dental Findings

## Status: Downloaded and selected

Approximate size:

```text
8,947 images
```

Downloaded as:

```text
COCO Segmentation
```

Task:

```text
Instance Segmentation
```

License shown on dataset page:

```text
CC BY 4.0
```

### Relevant classes

Caries:

```text
Caries
```

Confirmed by user:

```text ~5,962 images containing Caries
```

Dental findings:

```text
Filling
Composite filling
Amalgam filling
Crown
```

User confirmed 1,000+ images for each relevant class.

Implant manufacturer/type classes include:

```text
Keystone Dental Implant
Implant Direct
Frontier Implant
Euroteknika Implant
Dentium Implant
Dentis Implant
Biomet 3i Implant
Blue Sky Bio Implant
Camlog Implant
Cowellmedi Implant
DENTSPLY Implant
Dentatus Implant
BioLife Implant
BioHorizons Implant
Bicon Implant
Anthogyr Implant
AMerOss Implant
AGS Medikal Implant
Neoss Implant
3M ESPE Implant
Hiossen Implant
MIS Implant
Megagen Implant
Neodent Implant
```

For the first project version, merge all implant manufacturer classes into:

```text
Implant
```

Do not modify the raw Dataset 2 yet. First inspect the COCO JSON.

---

# Models

## Model 1 — Tooth Detector

Dataset:

```text
Dataset 1
```

Task:

```text
Object Detection
```

Classes:

```text
32 FDI tooth numbers
```

Recommended first model:

```text
YOLOv8n
```

Use transfer learning from pretrained weights.

Status:

```text
Dataset ready
Environment ready
Training not yet completed
```

---

## Model 2 — Caries

Dataset:

```text
Dataset 2
```

Target:

```text
Caries
```

Initially preserve segmentation annotations.

Do not train only on positive images. Include appropriate negative images.

---

## Model 3 — Dental Findings

Dataset:

```text
Dataset 2
```

Initial classes:

```text
0 -> Implant
1 -> Filling
2 -> Composite filling
3 -> Amalgam filling
4 -> Crown
```

All manufacturer-specific implant classes should be mapped to `Implant`.

---

# Environment Already Configured

Original laptop:

```text
Windows 10
Python 3.11.8
CPU: Intel Core i5-12450H
RAM: 15.7 GB
GPU: NVIDIA GeForce GTX 1650
VRAM: 4 GB
NVIDIA Driver: 592.82
Driver-reported CUDA: 13.1
```

Installed and verified:

```text
Ultralytics 8.4.127
NumPy 1.26.4
PyTorch 2.5.1+cu121
Torchvision 0.20.1+cu121
```

GPU test succeeded:

```text
PyTorch: 2.5.1+cu121
CUDA available: True
GPU: NVIDIA GeForce GTX 1650
```

Ultralytics reports:

```text
CUDA:0
NVIDIA GeForce GTX 1650
4096 MiB
```

---

# Important NumPy Fix

Initial environment had NumPy 2.2.6 and produced a NumPy 1.x binary compatibility warning.

Fixed with:

```powershell
python -m pip install numpy==1.26.4
```

If the same error appears on another machine, use the same command and verify:

```powershell
python -c "import numpy; print(numpy.__version__)"
```

Expected:

```text
1.26.4
```

---

# CUDA / GPU Troubleshooting

## Check NVIDIA GPU

```powershell
nvidia-smi
```

If it shows the NVIDIA GPU, Windows/driver detection is working.

The CUDA version shown by `nvidia-smi` is the driver's supported CUDA level; PyTorch can use a compatible bundled CUDA runtime such as cu121.

## Check PyTorch CUDA

```powershell
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
```

Expected:

```text
CUDA available: True
GPU: NVIDIA GeForce GTX 1650
```

## If PyTorch says `+cpu`

Remove CPU-only PyTorch:

```powershell
python -m pip uninstall torch torchvision torchaudio -y
```

Then install a compatible CUDA build. The original machine successfully used:

```powershell
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

Do not mix incompatible torch/torchvision versions.

## If `nvidia-smi` is not recognized

Check Device Manager → Display adapters.

Possible causes:

- NVIDIA driver missing
- Driver broken
- PATH issue
- Machine has no NVIDIA GPU

## If CUDA Out Of Memory

The original GTX 1650 has 4 GB VRAM.

Start with:

```text
imgsz=640
batch=4
```

If needed:

```text
batch=2
```

then:

```text
batch=1
```

You can reduce image size to 512 if necessary.

---

# Current Training Step

Environment and Dataset 1 are ready.

Run the first **1-epoch sanity test**:

```powershell
yolo detect train data=dataset1/data.yml model=yolov8n.pt epochs=1 imgsz=640 batch=4 device=0 workers=2
```

This is only a pipeline test.

It verifies:

```text
data.yml
 -> images
 -> labels
 -> 32 classes
 -> YOLO
 -> CUDA
 -> GPU
 -> training
```

If GPU memory fails:

```powershell
yolo detect train data=dataset1/data.yml model=yolov8n.pt epochs=1 imgsz=640 batch=2 device=0 workers=2
```

If still failing:

```powershell
yolo detect train data=dataset1/data.yml model=yolov8n.pt epochs=1 imgsz=512 batch=2 device=0 workers=2
```

Paste the complete terminal output into the next project conversation.

---

# Full Model 1 Training

After the 1-epoch sanity test succeeds:

### GTX 1650 starting point

```powershell
yolo detect train data=dataset1/data.yml model=yolov8n.pt epochs=50 imgsz=640 batch=2 device=0 workers=2 patience=15
```

A stronger GPU can use a larger batch size based on VRAM.

Do not copy a batch size blindly between GPUs.

---

# Model 1 Evaluation

Validation:

```powershell
yolo detect val model=runs/detect/train/weights/best.pt data=dataset1/data.yml device=0
```

Prediction on test images:

```powershell
yolo detect predict model=runs/detect/train/weights/best.pt source=dataset1/test/images device=0 conf=0.25 save=True
```

Inspect:

- Precision
- Recall
- mAP50
- mAP50-95
- Per-class metrics
- Confusion matrix
- PR curve
- Visual predictions

A high overall mAP is not enough; verify that FDI labels are not systematically swapped.

---

# Model Checkpoints

After training:

```text
runs/detect/train/
└── weights/
    ├── best.pt
    └── last.pt
```

Use:

```text
best.pt
```

for normal inference.

Keep:

```text
last.pt
```

for possible training continuation.

---

# Friend With a Higher-End GPU

The friend can train the same model on a stronger NVIDIA GPU.

They need:

- Compatible Python
- CUDA-enabled PyTorch
- Ultralytics
- Same cleaned Dataset 1
- Same `data.yml`
- Same class order

Training hardware does not have to match inference hardware.

Ask the friend to return:

```text
best.pt
results.csv
results.png
confusion_matrix.png
validation/test prediction images
training command
Ultralytics version
PyTorch version
dataset version
image size
epochs
batch size
```

The most important artifact is:

```text
best.pt
```

---

# Testing Friend's Model Locally

Place the model at:

```text
DentalAI/
└── models/
    └── tooth_detector/
        └── best.pt
```

Test on GPU:

```powershell
yolo detect predict model=models/tooth_detector/best.pt source=path/to/xray.jpg device=0
```

If local GPU inference has problems:

```powershell
yolo detect predict model=models/tooth_detector/best.pt source=path/to/xray.jpg device=cpu
```

Inference generally requires much less VRAM than training.

Check class names:

```python
from ultralytics import YOLO

model = YOLO("best.pt")
print(model.names)
```

They must match the 32-class FDI order.

---

# Dataset 2 Next Phase

After Model 1 works:

1. Locate COCO JSON.
2. Inspect `categories`.
3. Inspect `images`.
4. Inspect `annotations`.
5. Count annotations per class.
6. Verify Caries segmentation polygons.
7. Verify Implant annotations.
8. Verify Filling/Composite/Amalgam/Crown annotations.
9. Create processed copies.
10. Create Model 2 Caries dataset.
11. Create Model 3 Dental Findings dataset.

Do not delete classes from the raw Dataset 2.

---

# Final Integration

Eventually use:

```python
from ultralytics import YOLO

tooth_model = YOLO("models/tooth_detector/best.pt")
caries_model = YOLO("models/caries/best.pt")
finding_model = YOLO("models/dental_findings/best.pt")
```

Pipeline:

```text
X-ray
 |
 +--> Tooth model
 |
 +--> Caries model
 |
 +--> Dental findings model
 |
 v
Combined predictions
 |
 v
Visualization + report
```

A later feature can associate a caries region with the nearest/overlapping detected tooth. Treat this as an engineering association, not a clinical guarantee.

---

# Suggested Project Structure

```text
DentalAI/
├── data/
│   ├── raw/
│   │   ├── dataset1/
│   │   └── dataset2/
│   └── processed/
│       ├── tooth/
│       ├── caries/
│       └── findings/
├── models/
│   ├── tooth_detector/
│   │   └── best.pt
│   ├── caries/
│   │   └── best.pt
│   └── dental_findings/
│       └── best.pt
├── src/
│   ├── preprocessing/
│   ├── inference/
│   ├── visualization/
│   └── reporting/
├── app/
│   └── streamlit_app.py
├── notebooks/
├── configs/
├── requirements.txt
├── README.md
└── PROJECT_HANDOFF.md
```

---

# Complete Roadmap

```text
[x] Dataset 1 collected
[x] Dataset 1 downloaded
[x] Dataset 1 cleaned
[x] Dataset 1 validated
[x] Dataset 1 data.yml verified

[x] Dataset 2 collected
[x] Dataset 2 downloaded
[x] Caries identified
[x] Implant classes identified
[x] Filling classes identified
[x] Crown identified

[x] Python installed
[x] Ultralytics installed
[x] NumPy compatibility fixed
[x] CUDA-enabled PyTorch installed
[x] GTX 1650 detected
[x] CUDA available = True

[ ] Run 1-epoch Model 1 sanity test
[ ] Inspect sanity output
[ ] Train Model 1
[ ] Evaluate Model 1
[ ] Visually verify Model 1
[ ] Inspect Dataset 2 COCO annotations
[ ] Prepare Caries dataset
[ ] Train Model 2
[ ] Prepare Dental Findings dataset
[ ] Train Model 3
[ ] Integrate models
[ ] Build Streamlit app
[ ] End-to-end testing
[ ] Final documentation
```

---

# Immediate Next Action

Run:

```powershell
yolo detect train data=dataset1/data.yml model=yolov8n.pt epochs=1 imgsz=640 batch=4 device=0 workers=2
```

If it runs out of GPU memory, use batch 2, then batch 1.

**Do not judge model quality from one epoch. It is only a pipeline test.**

Paste the complete terminal output into the next conversation/message.

---

# Versioning

This is:

```text
PROJECT_HANDOFF_v1.md
```

Create `PROJECT_HANDOFF_v2.md`, `v3`, etc. when there is a major change in:

- Scope
- Dataset
- Dataset version
- Classes
- Model architecture
- Training strategy
- Integration
- Application design

Keep previous versions for history.

---

# Files to Give the Friend

Give the friend:

```text
PROJECT_HANDOFF_v1.md
Cleaned Dataset 1
Original Dataset 2
```

For Model 1, the critical dataset is:

```text
dataset1/
├── train/
├── valid/
├── test/
└── data.yml
```

The friend should preserve the exact class order.

---

## END OF HANDOFF
