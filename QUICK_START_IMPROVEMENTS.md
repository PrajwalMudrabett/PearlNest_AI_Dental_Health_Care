# Quick Start: Improving Model 3 Accuracy

## 🚀 Fastest Way to Improve (Choose One)

### Option 1: Use Improved Training Script (Recommended ⭐)

```bash
# Train with better defaults (larger model + enhanced augmentation)
python train_model3_improved.py train

# Expected improvement: +8-15% mAP@50
```

### Option 2: Just Use a Larger Model

```bash
# Use medium model instead of nano (easiest improvement)
python train_model3.py train --yolo-base yolov8m-seg.pt --epochs 150 --batch 8

# Expected improvement: +10-15% mAP@50
```

### Option 3: Apply Image Preprocessing

```bash
# Train with CLAHE preprocessing (better contrast)
python train_model3_improved.py train --preprocess clahe

# Expected improvement: +3-7% mAP@50
```

---

## 📊 Step-by-Step Improvement Plan

### Week 1: Quick Wins ⚡

#### Day 1-2: Larger Model

```bash
# Try YOLOv8 small first
python train_model3_improved.py train --yolo-base yolov8s-seg.pt

# If you have good GPU, try medium
python train_model3_improved.py train --yolo-base yolov8m-seg.pt --batch 8
```

#### Day 3-4: Better Augmentation

```bash
# The improved script already has better augmentation
# Just run it with default settings
python train_model3_improved.py train
```

#### Day 5-6: Longer Training

```bash
# Train for more epochs
python train_model3_improved.py train --epochs 200 --patience 50
```

#### Day 7: Evaluate & Compare

```bash
# Compare all your runs
python compare_model_architectures.py --compare-only
```

### Week 2: Fine-Tuning 🔧

#### Day 1-2: Image Preprocessing

```bash
# Try CLAHE
python train_model3_improved.py train --preprocess clahe

# Try CLAHE + Gamma
python train_model3_improved.py train --preprocess clahe_gamma
```

#### Day 3-4: Hyperparameter Tuning

```bash
# Quick hyperparameter search
python tune_hyperparameters.py --quick-test

# Or manual experimentation
python train_model3_improved.py train --lr 0.0005
python train_model3_improved.py train --lr 0.001
python train_model3_improved.py train --lr 0.005
```

#### Day 5-6: Batch Size Optimization

```bash
# Try different batch sizes
python train_model3_improved.py train --batch 8
python train_model3_improved.py train --batch 16
python train_model3_improved.py train --batch 32  # if GPU allows
```

#### Day 7: Best Configuration

```bash
# Combine best findings and train final model
python train_model3_improved.py train \
    --yolo-base yolov8m-seg.pt \
    --preprocess clahe \
    --epochs 200 \
    --batch 16 \
    --lr 0.001 \
    --patience 50
```

---

## 🎯 Expected Results by Strategy

| Strategy                  | Effort | Expected Improvement | Time      |
| ------------------------- | ------ | -------------------- | --------- |
| **Larger model (n→s)**    | Low    | +8-12% mAP           | 1 day     |
| **Larger model (n→m)**    | Low    | +12-18% mAP          | 1 day     |
| **Better augmentation**   | Low    | +3-5% mAP            | 1 day     |
| **Image preprocessing**   | Medium | +3-7% mAP            | 1 day     |
| **Longer training**       | Low    | +2-4% mAP            | 2-3 days  |
| **Hyperparameter tuning** | Medium | +2-6% mAP            | 2-3 days  |
| **All combined**          | Medium | +20-35% mAP          | 1-2 weeks |

### Realistic Targets:

- **Current**: mAP@50 = 66%, mAP@50-95 = 45%
- **After improvements**: mAP@50 = 75-85%, mAP@50-95 = 60-70%

---

## 💻 Command Reference

### Training Commands

```bash
# Basic improved training
python train_model3_improved.py train

# Custom configuration
python train_model3_improved.py train \
    --yolo-base yolov8m-seg.pt \
    --epochs 150 \
    --batch 16 \
    --lr 0.001 \
    --optimizer AdamW \
    --preprocess clahe

# Resume from checkpoint
python train_model3_improved.py train --resume
```

### Validation Commands

```bash
# Validate on test set
python train_model3_improved.py validate

# Validate specific model
python train_model3_improved.py validate \
    --weights runs/segment/model3-improved/weights/best.pt \
    --split test
```

### Prediction Commands

```bash
# Predict on test images
python train_model3_improved.py predict

# Predict on custom images
python train_model3_improved.py predict \
    --source path/to/images \
    --conf 0.3
```

### Comparison & Tuning

```bash
# Compare different runs
python compare_model_architectures.py --compare-only

# Quick architecture comparison
python compare_model_architectures.py --quick

# Hyperparameter tuning
python tune_hyperparameters.py --iterations 50
python tune_hyperparameters.py --method manual --quick-test
```

---

## 🔍 Monitoring Training

### Watch Training Progress

```bash
# Training logs show:
# - Loss curves (lower is better)
# - mAP metrics (higher is better)
# - Precision/Recall (balance is important)

# Look for:
✓ Steady decrease in loss
✓ Increasing mAP
✓ No overfitting (val loss not increasing)
✗ Plateau early (increase epochs or change LR)
✗ Val loss increasing (reduce augmentation or add regularization)
```

### View Results

```bash
# Results are saved in:
runs/segment/model3-improved/

# Key files:
- results.csv          # Training metrics
- results.png          # Metric plots
- confusion_matrix.png # Class predictions
- weights/best.pt      # Best model checkpoint
- weights/last.pt      # Last epoch checkpoint
```

---

## 🐛 Troubleshooting

### Out of Memory

```bash
# Reduce batch size
--batch 4

# Use smaller model
--yolo-base yolov8n-seg.pt

# Reduce image size
--imgsz 640
```

### Training Too Slow

```bash
# Use smaller model
--yolo-base yolov8n-seg.pt

# Reduce workers if CPU bottleneck
--workers 4

# Train on CPU (very slow, not recommended)
--device cpu
```

### Poor Performance

```bash
# Check dataset first
python train_model3_improved.py check

# Try preprocessing
--preprocess clahe

# Use larger model
--yolo-base yolov8m-seg.pt

# Train longer
--epochs 200 --patience 50
```

### Training Stops Early

```bash
# Increase patience
--patience 50

# Check if converged (might be optimal)
# Review results.png to see if metrics plateaued
```

---

## 📈 Measuring Success

### Key Metrics to Track:

1. **mAP@50** - Main metric (IoU threshold 50%)
   - Target: 75-85% (currently 66%)

2. **mAP@50-95** - Stricter metric (average IoU 50-95%)
   - Target: 60-70% (currently 45%)

3. **Precision** - Accuracy of detections
   - Target: 70-80% (currently 57%)
   - Low precision = many false positives

4. **Recall** - Coverage of true fillings
   - Target: 75-85% (currently 72%)
   - Low recall = missing fillings

### Balance Matters:

- High precision + low recall = too conservative
- Low precision + high recall = too aggressive
- Adjust confidence threshold to balance

---

## 🎓 Next Steps After Improvements

Once you achieve good accuracy:

1. **Deploy the model**

   ```bash
   # Export to ONNX for production
   python -c "from ultralytics import YOLO; YOLO('runs/segment/model3-improved/weights/best.pt').export(format='onnx')"
   ```

2. **Integrate with pipeline**
   - Update `perlnest_pipeline.py` to use new model
   - Test on real dental cases

3. **Continuous improvement**
   - Collect difficult cases
   - Add to training set
   - Retrain periodically

---

## 📚 Additional Resources

- **Main guide**: `IMPROVE_MODEL3_ACCURACY.md`
- **YOLO docs**: https://docs.ultralytics.com
- **Training tips**: https://docs.ultralytics.com/guides/hyperparameter-tuning/

---

**Remember**: Start simple, measure everything, iterate!

Good luck! 🚀
