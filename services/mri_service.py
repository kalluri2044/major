"""
services/mri_service.py
─────────────────────────────────────────────────────────────
Singleton loader for VGG16 + ResNet50 models.
Exposes predict_mri() used by mri_routes.py.

Model files are loaded once on first call and cached in memory.
"""

import os
import json
import numpy as np
from utils.image_utils import (
    preprocess_bytes, to_model_input,
    CLASS_LABELS, DISPLAY_LABELS, MRI_RISK_MAP
)

# ── Paths (resolved relative to backend/ directory) ───────────────────────────
_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VGG16_PATH   = os.path.join(_BASE, "models", "vgg16_alzheimer.h5")
RESNET_PATH  = os.path.join(_BASE, "models", "resnet50_alzheimer.h5")
IDX_PATH_VGG = VGG16_PATH.replace(".h5",  "_class_indices.json")
IDX_PATH_RES = RESNET_PATH.replace(".h5", "_class_indices.json")

# ── Ensemble weights ───────────────────────────────────────────────────────────
VGG16_WEIGHT   = 0.45
RESNET50_WEIGHT = 0.55

# ── Module-level cache ─────────────────────────────────────────────────────────
_vgg16_model   = None
_resnet_model  = None
_class_indices = None   # {class_name: int_index}

MODELS_AVAILABLE = os.path.exists(VGG16_PATH) and os.path.exists(RESNET_PATH)


def _load_models():
    """Load both models from disk (called once on first prediction)."""
    global _vgg16_model, _resnet_model, _class_indices

    if _vgg16_model is not None:
        return  # already loaded

    if not MODELS_AVAILABLE:
        raise FileNotFoundError(
            "Trained model files not found. "
            "Run ml/training/build_vgg16.py and ml/training/build_resnet50.py first. "
            f"Expected:\n  {VGG16_PATH}\n  {RESNET_PATH}"
        )

    import tensorflow as tf
    print("🔄 Loading VGG16 model …")
    _vgg16_model  = tf.keras.models.load_model(VGG16_PATH)
    print("🔄 Loading ResNet50 model …")
    _resnet_model = tf.keras.models.load_model(RESNET_PATH)
    print("✅ Both models loaded.")

    # Load class index mapping saved during training
    if os.path.exists(IDX_PATH_VGG):
        with open(IDX_PATH_VGG) as f:
            raw = json.load(f)   # {"MildDemented": 0, ...}
        # Invert: {0: "MildDemented", ...}
        _class_indices = {v: k for k, v in raw.items()}
    else:
        # Fall back to alphabetical (ImageDataGenerator default)
        _class_indices = {i: lbl for i, lbl in enumerate(sorted(CLASS_LABELS))}


def _mock_prediction():
    """
    Returns a plausible dummy prediction when model files are absent.
    Used during development / frontend testing before training is done.
    """
    import random
    stage  = random.choice(CLASS_LABELS)
    conf   = round(random.uniform(0.60, 0.92), 4)
    return {
        "vgg16_prediction":    DISPLAY_LABELS[stage],
        "vgg16_confidence":    round(conf - 0.05, 4),
        "resnet50_prediction": DISPLAY_LABELS[stage],
        "resnet50_confidence": round(conf + 0.02, 4),
        "ensemble_stage":      stage,
        "ensemble_stage_display": DISPLAY_LABELS[stage],
        "ensemble_confidence": conf,
        "mri_risk_score":      MRI_RISK_MAP[stage],
        "all_probabilities": {
            DISPLAY_LABELS[l]: round(1/4, 4) for l in CLASS_LABELS
        },
        "mock": True,   # flag so frontend can show a disclaimer
    }


def predict_mri(file_bytes: bytes, filename: str = "", active_model: str = "ensemble") -> dict:
    """
    Main inference function called by mri_routes.py.

    Parameters
    ----------
    file_bytes   : raw bytes of the uploaded MRI file
    filename     : original filename (used for format detection)
    active_model : 'vgg16' | 'resnet50' | 'ensemble'  (from ModelConfig)

    Returns
    -------
    dict with keys matching MRIScan model fields
    """
    # Development fallback when models aren't trained yet
    if not MODELS_AVAILABLE:
        return _mock_prediction()

    _load_models()

    # Preprocess image → (1, 224, 224, 3)
    arr   = preprocess_bytes(file_bytes, filename)
    inp   = to_model_input(arr)   # (1, 224, 224, 3)

    # ── VGG16 inference ────────────────────────────────────────────────────────
    vgg_probs  = _vgg16_model.predict(inp,  verbose=0)[0]   # shape (4,)
    vgg_idx    = int(np.argmax(vgg_probs))
    vgg_stage  = _class_indices[vgg_idx]
    vgg_conf   = float(vgg_probs[vgg_idx])

    # ── ResNet50 inference ─────────────────────────────────────────────────────
    res_probs  = _resnet_model.predict(inp, verbose=0)[0]
    res_idx    = int(np.argmax(res_probs))
    res_stage  = _class_indices[res_idx]
    res_conf   = float(res_probs[res_idx])

    # ── Ensemble (soft voting) ─────────────────────────────────────────────────
    ens_probs  = VGG16_WEIGHT * vgg_probs + RESNET50_WEIGHT * res_probs
    ens_idx    = int(np.argmax(ens_probs))
    ens_stage  = _class_indices[ens_idx]
    ens_conf   = float(ens_probs[ens_idx])

    # ── Select stage based on admin config ────────────────────────────────────
    if active_model == "vgg16":
        final_stage = vgg_stage
        final_conf  = vgg_conf
    elif active_model == "resnet50":
        final_stage = res_stage
        final_conf  = res_conf
    else:
        final_stage = ens_stage
        final_conf  = ens_conf

    # Build per-class probability dict for transparency
    all_probs = {
        DISPLAY_LABELS[_class_indices[i]]: round(float(ens_probs[i]), 4)
        for i in range(len(ens_probs))
    }

    return {
        "vgg16_prediction":       DISPLAY_LABELS[vgg_stage],
        "vgg16_confidence":       round(vgg_conf, 4),
        "resnet50_prediction":    DISPLAY_LABELS[res_stage],
        "resnet50_confidence":    round(res_conf, 4),
        "ensemble_stage":         final_stage,
        "ensemble_stage_display": DISPLAY_LABELS[final_stage],
        "ensemble_confidence":    round(final_conf, 4),
        "mri_risk_score":         MRI_RISK_MAP[final_stage],
        "all_probabilities":      all_probs,
        "mock":                   False,
    }
