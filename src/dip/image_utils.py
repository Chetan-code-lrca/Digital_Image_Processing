"""Shared image loading, conversion, and saving helpers."""
from pathlib import Path

import cv2
import numpy as np


def load_bgr(path):
    """Load an image as BGR; raise a useful error if it cannot be read."""
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise FileNotFoundError(f"Could not read image: {path}")
    return image


def load_gray(path):
    """Load an image as an 8-bit grayscale array."""
    image = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise FileNotFoundError(f"Could not read image: {path}")
    return image


def to_uint8(image):
    """Convert an array to uint8 safely, scaling float arrays in [0, 1]."""
    array = np.asarray(image)
    if array.dtype == np.uint8:
        return array
    array = np.nan_to_num(array.astype(np.float32))
    if array.size and array.min() >= 0 and array.max() <= 1:
        array = array * 255.0
    return np.clip(array, 0, 255).astype(np.uint8)


def save_image(path, image):
    """Create parent folders and save an image with OpenCV."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(target), to_uint8(image)):
        raise OSError(f"Could not write image: {target}")
    return target
