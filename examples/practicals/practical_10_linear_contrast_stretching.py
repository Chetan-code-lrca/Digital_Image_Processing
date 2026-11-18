"""Practical 10: improve contrast using linear stretching."""
from examples.practicals._common import sample_gray, save
from src.dip.module2_enhancement import linear_contrast_stretch
save("10_linear_contrast_stretch.png", linear_contrast_stretch(sample_gray()))
