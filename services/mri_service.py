"""
services/mri_service.py
─────────────────────────────────────────────────────────────
Simplified 7-Layer CNN Inference Service.
Removed VGG16/ResNet50 ensemble to speed up training/inference.
"""

import os
import json
import numpy as np

try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing import image
    TF_AVAILABLE = True
except ImportError:
    print("[ML] WARNING: TensorFlow not found. Running in MOCK/DEMO mode.")
    TF_AVAILABLE = False

from utils.image_utils import (
    preprocess_bytes, to_model_input,
    CLASS_LABELS, DISPLAY_LABELS, MRI_RISK_MAP
)

# ── Paths ──────────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(_BASE, "models", "cnn_alzheimer.h5")
IDX_PATH   = MODEL_PATH.replace(".h5", "_class_indices.json")

# ── Global Cache ───────────────────────────────────────────────────────────
_cnn_model = None
_class_indices = None

MODELS_AVAILABLE = os.path.exists(MODEL_PATH)


def _is_mri_image(arr: np.ndarray) -> bool:
    """Strict sanity check for cranial MRI characteristics."""
    if arr.shape[-1] == 3:
        color_variance = np.std(arr, axis=-1).mean()
        if color_variance > 0.015: return False
            
    edge_mask = np.ones((224, 224), dtype=bool)
    edge_mask[25:-25, 25:-25] = False 
    edge_brightness = arr[edge_mask].mean()
    if edge_brightness > 0.12: return False
        
    center_area = arr[60:-60, 60:-60]
    center_brightness = center_area.mean()
    if center_brightness < edge_brightness * 1.5: return False

    black_pixels = np.sum(arr < 0.08) / arr.size
    if black_pixels < 0.30: return False

    return True


def _load_model():
    global _cnn_model, _class_indices
    if _cnn_model is not None: return

    if not TF_AVAILABLE or not MODELS_AVAILABLE:
        print(f"[ML] WARNING: TensorFlow or Model not found. Running in Mock Mode for Demo.")
        return

    print("🔄 Loading Simple CNN model …")
    _cnn_model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ CNN model loaded.")

    if os.path.exists(IDX_PATH):
        with open(IDX_PATH) as f:
            raw = json.load(f)
        _class_indices = {v: k for k, v in raw.items()}
    else:
        _class_indices = {i: lbl for i, lbl in enumerate(sorted(CLASS_LABELS))}


def _mock_prediction():
    import random
    stage = random.choice(CLASS_LABELS)
    conf = round(random.uniform(0.75, 0.95), 4)
    return {
        "vgg16_prediction": DISPLAY_LABELS[stage],
        "vgg16_confidence": conf,
        "resnet50_prediction": DISPLAY_LABELS[stage],
        "resnet50_confidence": conf,
        "ensemble_stage": stage,
        "ensemble_stage_display": DISPLAY_LABELS[stage],
        "ensemble_confidence": conf,
        "mri_risk_score": MRI_RISK_MAP[stage],
        "all_probabilities": {DISPLAY_LABELS[l]: 0.25 for l in CLASS_LABELS},
        "mock": True
    }


def predict_mri(file_bytes: bytes, filename: str = "", active_model: str = "ensemble") -> dict:
    # 1. Preprocess
    arr = preprocess_bytes(file_bytes, filename)
    
    # 2. MRI Validation
    if not _is_mri_image(arr):
        raise ValueError("The uploaded image does not appear to be a valid cranial MRI scan.")

    # 3. Model Logic
    if not TF_AVAILABLE or not MODELS_AVAILABLE:
        return _mock_prediction()

    _load_model()
    inp = to_model_input(arr)
    
    # Run Inference
    probs = _cnn_model.predict(inp, verbose=0)[0]
    idx = int(np.argmax(probs))
    stage = _class_indices[idx]
    conf = float(probs[idx])

    all_probs = {
        DISPLAY_LABELS[_class_indices[i]]: round(float(probs[i]), 4)
        for i in range(len(probs))
    }

    # Map same result to all fields for UI compatibility
    return {
        "vgg16_prediction": DISPLAY_LABELS[stage],
        "vgg16_confidence": round(conf, 4),
        "resnet50_prediction": DISPLAY_LABELS[stage],
        "resnet50_confidence": round(conf, 4),
        "ensemble_stage": stage,
        "ensemble_stage_display": DISPLAY_LABELS[stage],
        "ensemble_confidence": round(conf, 4),
        "mri_risk_score": MRI_RISK_MAP[stage],
        "all_probabilities": all_probs,
        "mock": False
    }
