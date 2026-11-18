"""Practical 7: convert an image into HSV, HSI, YCbCr, and CMYK."""
import numpy as np
from examples.practicals._common import sample_bgr, save
from src.dip.module1_representation import convert_colour_models
models = convert_colour_models(sample_bgr())
for name, values in models.items():
    array = np.asarray(values)
    if array.ndim == 3 and array.shape[2] == 4:
        for channel, label in enumerate(("C", "M", "Y", "K")):
            save(f"07_cmyk_{label.lower()}.png", array[:, :, channel] * 255)
    else:
        save(f"07_{name}.png", array)
print("Generated HSV, HSI, YCbCr, and CMYK channel outputs.")
