"""Practical 3: smooth an image with a Gaussian blur."""
from examples.practicals._common import sample_bgr, save
from src.dip.module2_enhancement import gaussian_filter
image = sample_bgr()
save("03_gaussian_blur.png", gaussian_filter(image, kernel_size=5, sigma=1.2))
