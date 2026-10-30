# 🚀 PERLNEST Application Startup Guide

## ✅ Pre-flight Check

Before starting, verify all models are configured correctly:

```bash
python verify_models.py
```

Expected output:

```
✓ Model 1 (Tooth Detection)
✓ Model 2 (Caries Segmentation)
✓ Model 3 (Findings Segmentation)
✓ All model files found and ready!
```

---

## 🎯 Quick Start (2 Commands)

### Terminal 1 - Backend API

```bash
python backend/api.py
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Then open: **http://localhost:5173**

---

## 📋 Detailed Startup Instructions

### Step 1: Start Backend (Flask API)

Open a terminal in the PERLNEST project root and run:

```bash
python backend/api.py
```

**Expected Output:**

```
Loading PERLNEST models...
All three models loaded successfully.
PERLNEST API starting at http://127.0.0.1:5000
 * Serving Flask app 'api'
 * Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

✅ Backend is ready when you see "PERLNEST API starting..."

---

### Step 2: Start Frontend (React + Vite)

Open a **NEW** terminal in the PERLNEST project root and run:

```bash
cd frontend
npm run dev
```

**Expected Output:**

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

✅ Frontend is ready - open **http://localhost:5173** in your browser

---

### Step 3: Verify Connection

In your browser at http://localhost:5173:

1. Check the **sidebar** (left side):
   - Should show a **green dot** next to "Flask API Online"
2. Check the **top bar**:
   - Should show "API Connected" with a green dot

✅ If both indicators are green, the system is fully operational!

---

## 🦷 Running Your First Analysis

### Quick Test with Demo Image

1. Go to **AI Studio** page (click "Launch Studio" or use sidebar)
2. Click **"Load Demo Radiograph"** button
3. Click **"Run Analysis"** button
4. Wait 2-5 seconds for processing
5. View results:
   - Annotated X-ray with detected teeth
   - Summary metrics (teeth, caries, fillings, etc.)
   - Tooth-wise findings table

### Upload Your Own X-Ray

1. Go to **AI Studio** page
2. Click the upload dropzone or drag & drop an image
3. Supported formats: JPG, JPEG, PNG (max 20 MB)
4. Adjust confidence sliders if needed:
   - **Model 1** (Tooth Detection): 0.25 (default)
   - **Model 2** (Caries): 0.25 (default)
   - **Model 3** (Findings): 0.50 (default)
5. Click **"Run Analysis"**
6. Download results:
   - Annotated X-ray (PNG)
   - Tooth-wise findings (CSV)

---

## 🛠️ Alternative: Streamlit UI

If you prefer the Streamlit interface:

```bash
streamlit run app.py
```

Then open: **http://localhost:8501**

---

## 🔧 Troubleshooting

### Backend won't start

**Error: "ModuleNotFoundError: No module named 'ultralytics'"**

```bash
pip install ultralytics
```

**Error: "ModuleNotFoundError: No module named 'flask'"**

```bash
pip install flask flask-cors
```

**Error: "Address already in use"**

- Port 5000 is occupied
- Kill the process or change port in `backend/api.py`

---

### Frontend won't start

**Error: "Cannot find module..."**

```bash
cd frontend
npm install
npm run dev
```

**Error: "Port 5173 already in use"**

```bash
# Vite will automatically try next available port (5174, 5175, etc.)
# Or kill the process using port 5173
```

---

### API shows offline

**Frontend says "API Offline" or "API Unreachable"**

1. Check backend is running on port 5000
2. Check backend logs for errors
3. Try accessing http://127.0.0.1:5000/api/health in browser
   - Should return: `{"service":"PERLNEST API","status":"ok"}`
4. Check firewall/antivirus isn't blocking port 5000

---

### Models won't load

**Error: "Model weights not found"**

```bash
# Run verification script
python verify_models.py

# If models are missing, check paths in perlnest_pipeline.py
```

**Error: "CUDA out of memory"**

- Models try to use GPU by default
- Add `device='cpu'` in model predictions if GPU memory is insufficient
- Or use smaller batch size

---

### Analysis fails

**Error during prediction**

1. Check image format (JPG/PNG only)
2. Check image isn't corrupted
3. Try different confidence thresholds
4. Check backend logs for detailed error

**Very slow analysis**

- First run is slower (model loading)
- Large images take longer
- CPU mode is slower than GPU
- Expected time: 2-10 seconds per image

---

## 📊 Performance Tips

### For Faster Inference:

1. Use GPU if available (10-30x faster)
2. Keep image sizes reasonable (< 2000px width)
3. Don't restart backend frequently (models stay loaded)

### For Better Accuracy:

1. Use high-quality panoramic X-rays
2. Adjust confidence thresholds:
   - Lower = more detections (more false positives)
   - Higher = fewer detections (more false negatives)
3. Model 3 can be improved (see `IMPROVE_MODEL3_ACCURACY.md`)

---

## 🎓 Explore the Application

### Pages to Visit:

1. **Overview** (`/`)
   - System introduction
   - Quick start guide
   - Feature overview

2. **AI Studio** (`/studio`)
   - Upload and analyze X-rays
   - Adjust inference parameters
   - View and download results

3. **Model Benchmarks** (`/benchmarks`)
   - View model performance metrics
   - Compare models
   - Understand evaluation methodology

4. **Architecture & Scope** (`/architecture`)
   - System architecture details
   - Technical specifications
   - Research context

---

## 🔄 Restarting the System

### To restart backend:

1. Press `Ctrl+C` in backend terminal
2. Run `python backend/api.py` again

### To restart frontend:

1. Press `Ctrl+C` in frontend terminal
2. Run `npm run dev` again

### Full restart:

```bash
# Stop both (Ctrl+C in each terminal)

# Restart backend
python backend/api.py

# Restart frontend (in new terminal)
cd frontend
npm run dev
```

---

## 📦 Dependencies Check

### Python (Backend):

```bash
pip install ultralytics flask flask-cors opencv-python numpy pandas pillow
```

### Node.js (Frontend):

```bash
cd frontend
npm install
```

---

## 🎯 Model Configuration Summary

Your system is currently using:

- **Model 1**: `runs\detect\runs\detect\train-model1-retrained\weights\best.pt`
- **Model 2**: `runs\segment\train-2\weights\best.pt`
- **Model 3**: `runs\segment\runs\segment\model3-filling-segmentation\weights\best.pt`

To change models, edit paths in `perlnest_pipeline.py` (lines 7-9).

---

## 📞 Getting Help

If you encounter issues not covered here:

1. Run `python verify_models.py` to check model paths
2. Check backend console for error messages
3. Check browser console (F12) for frontend errors
4. Verify all dependencies are installed
5. Ensure you're running from the correct directory

---

**Your PERLNEST system is ready! Start analyzing dental X-rays.** 🦷✨

For model improvement strategies, see: `IMPROVE_MODEL3_ACCURACY.md`
