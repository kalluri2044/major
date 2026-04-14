"""
ml/training/evaluate.py
─────────────────────────────────────────────────────────────
Evaluates VGG16, ResNet50, and the ensemble on the test set.
Prints per-class precision / recall / F1 and overall accuracy.
Saves a confusion-matrix PNG.

Usage:
  python ml/training/evaluate.py \
      --data_dir data \
      --vgg16   models/vgg16_alzheimer.h5 \
      --resnet50 models/resnet50_alzheimer.h5
"""

import argparse
import os
import json
import numpy as np


def evaluate(data_dir: str, vgg16_path: str, resnet50_path: str, batch_size: int = 32):
    import tensorflow as tf
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from sklearn.metrics import classification_report, confusion_matrix
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    IMG_SIZE = (224, 224)
    LABELS   = ["MildDemented", "ModerateDemented", "NonDemented", "VeryMildDemented"]

    datagen = ImageDataGenerator(rescale=1.0 / 255)
    gen = datagen.flow_from_directory(
        os.path.join(data_dir, "test"),
        target_size = IMG_SIZE,
        batch_size  = batch_size,
        class_mode  = "categorical",
        shuffle     = False,
    )

    true_labels = gen.classes   # integer class indices

    # ── Load models ────────────────────────────────────────────────────────────
    print("Loading VGG16 …")
    vgg16   = tf.keras.models.load_model(vgg16_path)
    print("Loading ResNet50 …")
    resnet  = tf.keras.models.load_model(resnet50_path)

    # ── Predictions ────────────────────────────────────────────────────────────
    print("Running VGG16 inference …")
    vgg_probs  = vgg16.predict(gen, verbose=1)

    gen.reset()
    print("Running ResNet50 inference …")
    res_probs  = resnet.predict(gen, verbose=1)

    # Ensemble (soft voting)
    ens_probs  = 0.45 * vgg_probs + 0.55 * res_probs

    vgg_preds  = np.argmax(vgg_probs,  axis=1)
    res_preds  = np.argmax(res_probs,  axis=1)
    ens_preds  = np.argmax(ens_probs,  axis=1)

    # ── Reports ────────────────────────────────────────────────────────────────
    def _report(name, preds):
        print(f"\n{'='*50}")
        print(f"  {name}")
        print(f"{'='*50}")
        acc = (preds == true_labels).mean() * 100
        print(f"  Accuracy: {acc:.2f}%\n")
        print(classification_report(true_labels, preds, target_names=LABELS))
        return acc

    vgg_acc = _report("VGG16",          vgg_preds)
    res_acc = _report("ResNet50",        res_preds)
    ens_acc = _report("Ensemble (0.45v+0.55r)", ens_preds)

    # ── Summary table ──────────────────────────────────────────────────────────
    print("\n┌──────────────────────────────┬───────────┐")
    print("│ Model                        │ Accuracy  │")
    print("├──────────────────────────────┼───────────┤")
    print(f"│ VGG16                        │ {vgg_acc:7.2f}%  │")
    print(f"│ ResNet50                     │ {res_acc:7.2f}%  │")
    print(f"│ Ensemble                     │ {ens_acc:7.2f}%  │")
    print("└──────────────────────────────┴───────────┘")

    # ── Confusion matrices ─────────────────────────────────────────────────────
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    for ax, preds, title in [
        (axes[0], vgg_preds,  f"VGG16 ({vgg_acc:.1f}%)"),
        (axes[1], res_preds,  f"ResNet50 ({res_acc:.1f}%)"),
        (axes[2], ens_preds,  f"Ensemble ({ens_acc:.1f}%)"),
    ]:
        cm = confusion_matrix(true_labels, preds)
        sns.heatmap(cm, annot=True, fmt="d", ax=ax,
                    xticklabels=LABELS, yticklabels=LABELS,
                    cmap="Blues", cbar=False)
        ax.set_title(title, fontsize=13, fontweight="bold")
        ax.set_xlabel("Predicted", fontsize=10)
        ax.set_ylabel("True", fontsize=10)
        ax.tick_params(axis="x", rotation=30)

    plt.tight_layout()
    out_path = "models/confusion_matrices.png"
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    print(f"\n✅ Confusion matrices saved to: {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir",   default="data")
    parser.add_argument("--vgg16",      default="models/vgg16_alzheimer.h5")
    parser.add_argument("--resnet50",   default="models/resnet50_alzheimer.h5")
    parser.add_argument("--batch_size", default=32, type=int)
    args = parser.parse_args()
    evaluate(args.data_dir, args.vgg16, args.resnet50, args.batch_size)
