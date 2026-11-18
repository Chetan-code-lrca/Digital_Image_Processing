"""Practical 8: negative, logarithmic, and gamma gray-level transforms."""
from examples.practicals._common import sample_gray, save
from src.dip.module1_representation import (
    gray_negative, log_transform, inverse_log_transform, gamma_transform,
    piecewise_linear_transform, gray_level_slicing,
)
image = sample_gray()
save("08_negative.png", gray_negative(image))
save("08_log.png", log_transform(image))
save("08_inverse_log.png", inverse_log_transform(image))
save("08_gamma_bright.png", gamma_transform(image, gamma=0.6))
save("08_gamma_dark.png", gamma_transform(image, gamma=1.6))
save("08_piecewise.png", piecewise_linear_transform(image, ((0, 0), (64, 32), (192, 224), (255, 255))))
save("08_gray_level_slice.png", gray_level_slicing(image, 80, 160, preserve_background=False))
