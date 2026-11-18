"""Practical 8: negative, logarithmic, and gamma gray-level transforms."""
from examples.practicals._common import sample_gray, save
from src.dip.module1_representation import gray_negative, log_transform, gamma_transform
image = sample_gray()
save("08_negative.png", gray_negative(image))
save("08_log.png", log_transform(image))
save("08_gamma_bright.png", gamma_transform(image, gamma=0.6))
save("08_gamma_dark.png", gamma_transform(image, gamma=1.6))
