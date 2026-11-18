"""Utilities shared by the 16 syllabus practical scripts."""
from pathlib import Path
import cv2
import numpy as np
from examples.sample_image import ensure_sample_image
from src.dip.image_utils import load_bgr, save_image

ROOT = Path(__file__).resolve().parents[2]
OUTPUTS = ROOT / "outputs" / "practicals"

def sample_bgr():
    return load_bgr(ensure_sample_image())

def sample_gray():
    return cv2.cvtColor(sample_bgr(), cv2.COLOR_BGR2GRAY)

def save(name, image):
    path = OUTPUTS / name
    save_image(path, image)
    print(f"Saved: {path.relative_to(ROOT)}")
    return path

def display_histogram(image, filename="05_histogram.png"):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.figure(figsize=(8, 4))
    plt.hist(np.asarray(image).ravel(), bins=256, range=(0, 256), color="gray")
    plt.title("Grayscale image histogram")
    plt.xlabel("Pixel intensity")
    plt.ylabel("Frequency")
    plt.tight_layout()
    path = OUTPUTS / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(path, dpi=140)
    plt.close()
    print(f"Saved: {path.relative_to(ROOT)}")
