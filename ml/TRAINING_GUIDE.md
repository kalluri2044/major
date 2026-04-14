# Phase 2 — ML Training Guide

## Step 1: Download the Dataset

1. Go to: https://www.kaggle.com/datasets/tourist55/alzheimers-dataset-4-class-of-images
2. Download and extract the zip
3. Place it so your structure looks like:

```
backend/
└── data/
    ├── train/
    │   ├── MildDemented/        (~896 images)
    │   ├── ModerateDemented/    (~64 images)
    │   ├── NonDemented/         (~2560 images)
    │   └── VeryMildDemented/    (~1792 images)
    └── test/
        ├── MildDemented/
        ├── ModerateDemented/
        ├── NonDemented/
        └── VeryMildDemented/
```

---

## Step 2: Install ML Dependencies

```bash
cd backend
pip install -r requirements.txt
```

> **GPU users:** Install tensorflow-gpu instead of tensorflow for 5-10x faster training.

---

## Step 3: Train VGG16

```bash
cd backend
python ml/training/build_vgg16.py \
    --data_dir data \
    --epochs 20 \
    --batch_size 32 \
    --output models/vgg16_alzheimer.h5
```

Expected output file: `backend/models/vgg16_alzheimer.h5`
Expected accuracy: ~88-92%
Training time: ~30 min (GPU) / ~2-3 hrs (CPU)

---

## Step 4: Train ResNet50

```bash
python ml/training/build_resnet50.py \
    --data_dir data \
    --epochs 20 \
    --batch_size 32 \
    --output models/resnet50_alzheimer.h5
```

Expected output file: `backend/models/resnet50_alzheimer.h5`
Expected accuracy: ~90-94%

---

## Step 5: Evaluate Ensemble

```bash
python ml/training/evaluate.py \
    --data_dir data \
    --vgg16   models/vgg16_alzheimer.h5 \
    --resnet50 models/resnet50_alzheimer.h5
```

This prints per-class metrics and saves `models/confusion_matrices.png`.

Expected ensemble accuracy: **~94-96%**

---

## Step 6: Verify Flask Integration

Start Flask and test inference:

```bash
python app.py

# In another terminal:
curl -X POST http://localhost:5000/api/mri/upload \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "mri_file=@/path/to/test_mri.jpg" \
  -F "session_id=1"
```

---

## Using the Notebook (Alternative)

```bash
cd backend
jupyter notebook ml/notebooks/training_walkthrough.ipynb
```

The notebook walks through all steps with visualizations.

---

## Without GPU (CPU-only tips)

- Reduce batch_size to 16
- Use fewer epochs (10 is often enough for fine-tuning)
- Use EfficientNetB0 instead — much faster on CPU:
  Change `from tensorflow.keras.applications import VGG16` to `EfficientNetB0`

---

## Model Files Required by Flask

```
backend/models/
├── vgg16_alzheimer.h5                 ← trained VGG16
├── vgg16_alzheimer_class_indices.json ← class label mapping
├── resnet50_alzheimer.h5              ← trained ResNet50
└── resnet50_alzheimer_class_indices.json
```

If these files don't exist, the Flask API automatically returns **mock/demo predictions**
so frontend development can continue without trained models.
