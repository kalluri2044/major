"""
ml/training/train_simple_cnn.py
─────────────────────────────────────────────────────────────
Optimized 7-Layer CNN Training Script for Alzheimer's Stage Prediction.
Designed for fast training on Google Colab (T4 GPU).

Architecture:
- 2x Conv2D + MaxPooling (Feature Extraction)
- Flatten
- 1x Dense (Hidden Layer)
- 1x Dense (Softmax Output - 4 stages)
"""

import tensorflow as tf
from tensorflow.keras import layers, models, preprocessing
import numpy as np
import os
import json

# 1. PARAMETERS
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
CLASSES = ["MildDemented", "ModerateDemented", "NonDemented", "VeryMildDemented"]

def build_simple_cnn():
    """Builds a lightweight 7-layer CNN architecture."""
    model = models.Sequential([
        # Layer 1 & 2: First Convolutional Block
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3)),
        layers.MaxPooling2D((2, 2)),
        
        # Layer 3 & 4: Second Convolutional Block
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # Layer 5: Flatten
        layers.Flatten(),
        
        # Layer 6: Hidden Dense Layer
        layers.Dense(128, activation='relu'),
        
        # Layer 7: Output Layer (4 Stages)
        layers.Dense(len(CLASSES), activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def train_model(data_dir, epochs=10):
    """
    Standard training loop. 
    In Colab, 'data_dir' should be the path to your unzipped dataset.
    """
    datagen = preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )

    train_generator = datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    val_generator = datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )

    # Save class indices for inference
    with open('cnn_alzheimer_class_indices.json', 'w') as f:
        json.dump(train_generator.class_indices, f)

    model = build_simple_cnn()
    model.summary()

    print("\n🚀 Starting Training on GPU...")
    model.fit(
        train_generator,
        epochs=epochs,
        validation_data=val_generator
    )

    # Save final model
    model.save('cnn_alzheimer.h5')
    print("\n✅ SUCCESS: Model saved as 'cnn_alzheimer.h5'")

if __name__ == "__main__":
    # To run in Colab:
    # 1. Upload dataset zip
    # 2. un-comment line below and provide path
    # train_model('/path/to/extracted/dataset', epochs=10)
    print("Script ready. Copy this to Colab to train your model.")
