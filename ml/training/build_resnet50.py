"""
ml/training/build_resnet50.py
─────────────────────────────────────────────────────────────
Builds, fine-tunes and saves a ResNet50-based Alzheimer's classifier.

Same dataset layout as build_vgg16.py.

Usage:
  python ml/training/build_resnet50.py --data_dir data --epochs 20 --output models/resnet50_alzheimer.h5
"""

import argparse
import os


def _build(data_dir: str, epochs: int, output_path: str, batch_size: int = 32):
    import tensorflow as tf
    from tensorflow.keras import layers, models, optimizers, callbacks
    from tensorflow.keras.applications import ResNet50
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    print("TensorFlow version:", tf.__version__)
    print("GPUs available:", len(tf.config.list_physical_devices("GPU")))

    IMG_SIZE    = (224, 224)
    NUM_CLASSES = 4

    # ── Data generators ────────────────────────────────────────────────────────
    # ResNet50 expects inputs pre-processed with its own preprocess_input,
    # but we normalise to [0,1] and let the model adapt — works well in practice.
    train_datagen = ImageDataGenerator(
        rescale           = 1.0 / 255,
        rotation_range    = 20,
        width_shift_range = 0.10,
        height_shift_range= 0.10,
        horizontal_flip   = True,
        vertical_flip     = False,
        zoom_range        = 0.15,
        shear_range       = 0.05,
        brightness_range  = [0.80, 1.20],
        fill_mode         = "nearest",
    )
    val_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        os.path.join(data_dir, "train"),
        target_size = IMG_SIZE,
        batch_size  = batch_size,
        class_mode  = "categorical",
        shuffle     = True,
        seed        = 42,
    )
    val_gen = val_datagen.flow_from_directory(
        os.path.join(data_dir, "test"),
        target_size = IMG_SIZE,
        batch_size  = batch_size,
        class_mode  = "categorical",
        shuffle     = False,
    )

    print("Class indices:", train_gen.class_indices)

    # ── Compute class weights to handle imbalance ──────────────────────────────
    # NonDemented >> others, so we weight minority classes higher
    total  = sum(train_gen.samples for _ in [1])  # total samples
    n_cls  = NUM_CLASSES
    counts = {v: 0 for v in train_gen.class_indices.values()}
    for cls, idx in train_gen.class_indices.items():
        cls_path = os.path.join(data_dir, "train", cls)
        if os.path.isdir(cls_path):
            counts[idx] = len(os.listdir(cls_path))

    total_samples = sum(counts.values())
    class_weights = {
        idx: total_samples / (n_cls * max(cnt, 1))
        for idx, cnt in counts.items()
    }
    print("Class weights:", class_weights)

    # ── Build model ────────────────────────────────────────────────────────────
    # Stage 1: Frozen base
    base = ResNet50(
        include_top = False,
        weights     = "imagenet",
        input_shape = (*IMG_SIZE, 3),
        pooling     = None,
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(*IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(512, activation="relu",
                     kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(256, activation="relu",
                     kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs, name="resnet50_alzheimer")

    model.compile(
        optimizer = optimizers.Adam(learning_rate=1e-3),
        loss      = "categorical_crossentropy",
        metrics   = ["accuracy"],
    )
    model.summary()

    cb1 = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=5, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-8),
    ]

    print("\n=== Stage 1: Training top layers (ResNet50 frozen) ===")
    model.fit(
        train_gen,
        validation_data = val_gen,
        epochs          = min(epochs, 10),
        class_weight    = class_weights,
        callbacks       = cb1,
    )

    # ── Stage 2: Unfreeze last ResNet block (conv5) ────────────────────────────
    # ResNet50 last block starts at roughly layer index 143
    for layer in base.layers:
        layer.trainable = False
    for layer in base.layers[143:]:
        layer.trainable = True

    model.compile(
        optimizer = optimizers.Adam(learning_rate=1e-5),
        loss      = "categorical_crossentropy",
        metrics   = ["accuracy"],
    )

    cb2 = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=7, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=3, min_lr=1e-9),
        callbacks.ModelCheckpoint(output_path, monitor="val_accuracy", save_best_only=True),
    ]

    print("\n=== Stage 2: Fine-tuning ResNet50 conv5 block ===")
    model.fit(
        train_gen,
        validation_data = val_gen,
        epochs          = epochs,
        class_weight    = class_weights,
        callbacks       = cb2,
    )

    # ── Evaluate ───────────────────────────────────────────────────────────────
    loss, acc = model.evaluate(val_gen)
    print(f"\n✅ ResNet50 Final Test Accuracy: {acc * 100:.2f}%")
    print(f"   Saved to: {output_path}")

    import json
    idx_path = output_path.replace(".h5", "_class_indices.json")
    with open(idx_path, "w") as f:
        json.dump(train_gen.class_indices, f, indent=2)
    print(f"   Class indices saved to: {idx_path}")

    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir",   default="data",                          help="Path to dataset root")
    parser.add_argument("--epochs",     default=20,  type=int,                   help="Max fine-tuning epochs")
    parser.add_argument("--batch_size", default=32,  type=int,                   help="Batch size")
    parser.add_argument("--output",     default="models/resnet50_alzheimer.h5",  help="Output .h5 path")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    _build(args.data_dir, args.epochs, args.output, args.batch_size)
