"""
ml/training/build_vgg16.py
─────────────────────────────────────────────────────────────
Builds, fine-tunes and saves a VGG16-based Alzheimer's classifier.

Dataset expected layout (Kaggle Alzheimer's MRI Dataset):
  data/
    train/
      MildDemented/       (~896 images)
      ModerateDemented/   (~64 images)
      NonDemented/        (~2560 images)
      VeryMildDemented/   (~1792 images)
    test/
      MildDemented/
      ModerateDemented/
      NonDemented/
      VeryMildDemented/

Usage:
  python ml/training/build_vgg16.py --data_dir data --epochs 20 --output models/vgg16_alzheimer.h5
"""

import argparse
import os
import numpy as np

# ── Defer TF import so the file is importable without GPU ─────────────────────
def _build(data_dir: str, epochs: int, output_path: str, batch_size: int = 32):
    import tensorflow as tf
    from tensorflow.keras import layers, models, optimizers, callbacks
    from tensorflow.keras.applications import VGG16
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    print("TensorFlow version:", tf.__version__)
    print("GPUs available:", len(tf.config.list_physical_devices("GPU")))

    IMG_SIZE   = (224, 224)
    NUM_CLASSES = 4

    # ── Data generators ────────────────────────────────────────────────────────
    train_datagen = ImageDataGenerator(
        rescale          = 1.0 / 255,
        rotation_range   = 15,
        width_shift_range= 0.10,
        height_shift_range=0.10,
        horizontal_flip  = True,
        zoom_range       = 0.10,
        brightness_range = [0.85, 1.15],
        fill_mode        = "nearest",
    )

    val_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        os.path.join(data_dir, "train"),
        target_size  = IMG_SIZE,
        batch_size   = batch_size,
        class_mode   = "categorical",
        shuffle      = True,
        seed         = 42,
    )

    val_gen = val_datagen.flow_from_directory(
        os.path.join(data_dir, "test"),
        target_size  = IMG_SIZE,
        batch_size   = batch_size,
        class_mode   = "categorical",
        shuffle      = False,
    )

    print("Class indices:", train_gen.class_indices)

    # ── Build model ────────────────────────────────────────────────────────────
    # Stage 1: Train only the new top layers (feature extractor frozen)
    base = VGG16(
        include_top = False,
        weights     = "imagenet",
        input_shape = (*IMG_SIZE, 3),
    )
    base.trainable = False   # freeze all conv layers initially

    model = models.Sequential([
        base,
        layers.GlobalAveragePooling2D(),
        layers.Dense(512, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(256, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(NUM_CLASSES, activation="softmax"),
    ], name="vgg16_alzheimer")

    model.compile(
        optimizer = optimizers.Adam(learning_rate=1e-3),
        loss      = "categorical_crossentropy",
        metrics   = ["accuracy"],
    )
    model.summary()

    # Callbacks
    cb = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=5, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7),
        callbacks.ModelCheckpoint(output_path.replace(".h5", "_stage1.h5"),
                                  monitor="val_accuracy", save_best_only=True),
    ]

    print("\n=== Stage 1: Training top layers (base frozen) ===")
    history1 = model.fit(
        train_gen,
        validation_data  = val_gen,
        epochs           = min(epochs, 10),
        callbacks        = cb,
    )

    # Stage 2: Fine-tune last 4 conv blocks of VGG16
    base.trainable = True
    # Freeze everything except last 8 layers (block4 + block5)
    for layer in base.layers[:-8]:
        layer.trainable = False

    model.compile(
        optimizer = optimizers.Adam(learning_rate=1e-5),   # much lower LR
        loss      = "categorical_crossentropy",
        metrics   = ["accuracy"],
    )

    cb2 = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=7, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=3, min_lr=1e-8),
        callbacks.ModelCheckpoint(output_path,
                                  monitor="val_accuracy", save_best_only=True),
    ]

    print("\n=== Stage 2: Fine-tuning last 8 layers of VGG16 ===")
    history2 = model.fit(
        train_gen,
        validation_data  = val_gen,
        epochs           = epochs,
        callbacks        = cb2,
    )

    # ── Evaluate ───────────────────────────────────────────────────────────────
    loss, acc = model.evaluate(val_gen)
    print(f"\n✅ VGG16 Final Test Accuracy: {acc * 100:.2f}%")
    print(f"   Saved to: {output_path}")

    # Save class indices for inference
    import json
    idx_path = output_path.replace(".h5", "_class_indices.json")
    with open(idx_path, "w") as f:
        json.dump(train_gen.class_indices, f, indent=2)
    print(f"   Class indices saved to: {idx_path}")

    return model, history1, history2


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir",   default="data",                       help="Path to dataset root")
    parser.add_argument("--epochs",     default=20,  type=int,                help="Max fine-tuning epochs")
    parser.add_argument("--batch_size", default=32,  type=int,                help="Batch size")
    parser.add_argument("--output",     default="models/vgg16_alzheimer.h5",  help="Output .h5 path")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    _build(args.data_dir, args.epochs, args.output, args.batch_size)
