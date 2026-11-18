"""Practical 15: merge two images using weighted alpha blending."""
import cv2
from examples.practicals._common import sample_bgr, save
first = sample_bgr()
second = cv2.flip(first, 1)
save("15_blended_images.png", cv2.addWeighted(first, 0.65, second, 0.35, 0))
