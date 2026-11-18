"""Practical 11: low-pass smoothing and high-pass detail filtering."""
import cv2
from examples.practicals._common import sample_gray, save
from src.dip.module2_enhancement import low_pass_filter, high_pass_filter
image = sample_gray()
save("11_low_pass.png", low_pass_filter(image, cutoff=24))
save("11_high_pass.png", cv2.normalize(high_pass_filter(image, cutoff=24), None, 0, 255, cv2.NORM_MINMAX))
