import numpy as np
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from services.mri_service import _is_mri_image

def test_image(name, arr):
    result = _is_mri_image(arr)
    print(f"Testing {name}: {'PASSED' if result else 'REJECTED (Correct)'}")
    return result

# 1. Create a "Face-like" image (Bright background, colorful)
face_sim = np.random.rand(224, 224, 3).astype(np.float32)
# Faces are usually brighter and colorful
face_sim = face_sim * 0.8 + 0.2 

# 2. Create a "Real MRI-like" image (Grayscale, black border, bright center)
mri_sim = np.zeros((224, 224, 3), dtype=np.float32)
# Bright center
mri_sim[60:164, 60:164, :] = 0.4
# Grayscale (R=G=B)
mri_sim[:, :, 1] = mri_sim[:, :, 0]
mri_sim[:, :, 2] = mri_sim[:, :, 0]

print("--- MRI Validation Test ---")
test_image("Colorful Face Simulation", face_sim)
test_image("Grayscale MRI Simulation", mri_sim)

# 3. Test a non-square corner image
photo_sim = np.ones((224, 224, 3), dtype=np.float32) * 0.5 
test_image("Solid Gray Photo", photo_sim)
