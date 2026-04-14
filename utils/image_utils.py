"""
image_utils.py
─────────────────────────────────────────────────────────────
MRI image preprocessing utilities used by both:
  • ml/training/train.py   (training-time augmentation)
  • services/mri_service.py (inference-time preprocessing)

Supported input formats:
  • JPEG / PNG  (2-D slice already exported)
  • DICOM       (.dcm)  — requires pydicom
  • NIfTI       (.nii / .nii.gz) — requires nibabel

Output: normalized numpy array  (224, 224, 3)  float32  [0, 1]
"""

import os
import numpy as np
from PIL import Image
import io

# Optional heavy imports — only loaded when needed
def _load_pydicom():
    try:
        import pydicom
        return pydicom
    except ImportError:
        raise ImportError("pydicom not installed. Run: pip install pydicom")

def _load_nibabel():
    try:
        import nibabel as nib
        return nib
    except ImportError:
        raise ImportError("nibabel not installed. Run: pip install nibabel")

# ── Target dimensions for both VGG16 and ResNet50 ─────────────────────────────
TARGET_SIZE = (224, 224)

# ── Class labels (must match training label encoding) ─────────────────────────
CLASS_LABELS = [
    "MildDemented",
    "ModerateDemented",
    "NonDemented",
    "VeryMildDemented"
]

# Human-readable display names (for reports / UI)
DISPLAY_LABELS = {
    "MildDemented":     "Mild Demented",
    "ModerateDemented": "Moderate Demented",
    "NonDemented":      "Non-Demented",
    "VeryMildDemented": "Very Mild Demented",
}

# MRI stage → AD risk score (0-100) used in fusion calculation
MRI_RISK_MAP = {
    "NonDemented":      10.0,
    "VeryMildDemented": 35.0,
    "MildDemented":     65.0,
    "ModerateDemented": 90.0,
}


# ─────────────────────────────────────────────────────────────────────────────
# Core preprocessing pipeline
# ─────────────────────────────────────────────────────────────────────────────

def preprocess_pil(pil_image: Image.Image) -> np.ndarray:
    """
    Takes a PIL Image, returns a (224, 224, 3) float32 numpy array
    with pixel values in [0, 1].
    """
    # 1. Convert to RGB (handles grayscale, RGBA, palette modes)
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    # 2. Resize to 224×224 using high-quality Lanczos resampling
    pil_image = pil_image.resize(TARGET_SIZE, Image.LANCZOS)

    # 3. To numpy
    arr = np.array(pil_image, dtype=np.float32)

    # 4. Normalize to [0, 1]
    arr = arr / 255.0

    return arr   # shape (224, 224, 3)


def preprocess_bytes(file_bytes: bytes, filename: str = "") -> np.ndarray:
    """
    Accepts raw file bytes + optional filename hint for format detection.
    Returns (224, 224, 3) float32 array.
    """
    ext = os.path.splitext(filename.lower())[1] if filename else ""

    # ── DICOM ─────────────────────────────────────────────────────────────────
    if ext == ".dcm":
        pydicom = _load_pydicom()
        ds      = pydicom.dcmread(io.BytesIO(file_bytes))
        arr     = ds.pixel_array.astype(np.float32)

        # Apply DICOM rescale if present
        slope     = getattr(ds, "RescaleSlope",     1.0)
        intercept = getattr(ds, "RescaleIntercept", 0.0)
        arr       = arr * float(slope) + float(intercept)

        # Normalize to 0-255 range
        arr_min, arr_max = arr.min(), arr.max()
        if arr_max > arr_min:
            arr = (arr - arr_min) / (arr_max - arr_min) * 255.0
        arr = arr.astype(np.uint8)

        # If 3D volume (z, h, w) → pick middle slice
        if arr.ndim == 3 and arr.shape[0] > 3:
            mid = arr.shape[0] // 2
            arr = arr[mid]

        pil = Image.fromarray(arr)
        return preprocess_pil(pil)

    # ── NIfTI ──────────────────────────────────────────────────────────────────
    if ext in (".nii", ".gz"):
        import tempfile, gzip
        nib = _load_nibabel()

        # Write to temp file because nibabel needs a path
        suffix = ".nii.gz" if ext == ".gz" else ".nii"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            img  = nib.load(tmp_path)
            data = img.get_fdata()
        finally:
            os.unlink(tmp_path)

        # data shape: (W, H, Z) or (W, H, Z, T) — pick mid axial slice
        if data.ndim == 4:
            data = data[..., data.shape[3] // 2]

        mid   = data.shape[2] // 2
        slice_ = data[:, :, mid].astype(np.float32)

        # Normalize
        s_min, s_max = slice_.min(), slice_.max()
        if s_max > s_min:
            slice_ = (slice_ - s_min) / (s_max - s_min) * 255.0
        slice_ = slice_.astype(np.uint8)

        pil = Image.fromarray(slice_)
        return preprocess_pil(pil)

    # ── Standard image (JPEG, PNG, BMP, TIFF) ─────────────────────────────────
    pil = Image.open(io.BytesIO(file_bytes))
    return preprocess_pil(pil)


def preprocess_path(file_path: str) -> np.ndarray:
    """Load from disk path and preprocess."""
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    return preprocess_bytes(file_bytes, filename=os.path.basename(file_path))


def to_model_input(arr: np.ndarray) -> np.ndarray:
    """
    Add batch dimension: (224, 224, 3) → (1, 224, 224, 3)
    Ready to pass into model.predict()
    """
    return np.expand_dims(arr, axis=0)


# ─────────────────────────────────────────────────────────────────────────────
# Difference map (for longitudinal comparison)
# ─────────────────────────────────────────────────────────────────────────────

def compute_diff_map(arr1: np.ndarray, arr2: np.ndarray) -> np.ndarray:
    """
    Pixel-wise absolute difference between two preprocessed MRI arrays.
    D(x, y) = |Mt(x,y) - Mt-1(x,y)|
    Returns array of same shape (224, 224, 3), values in [0, 1].
    """
    return np.abs(arr1.astype(np.float32) - arr2.astype(np.float32))


def diff_map_to_png_bytes(diff: np.ndarray) -> bytes:
    """Convert a diff map array to PNG bytes for storage / display."""
    scaled = (diff * 255).clip(0, 255).astype(np.uint8)
    pil    = Image.fromarray(scaled)
    buf    = io.BytesIO()
    pil.save(buf, format="PNG")
    return buf.getvalue()


def mean_diff_score(diff: np.ndarray) -> float:
    """Single scalar summarising overall structural change (0-100)."""
    return float(diff.mean() * 100)
