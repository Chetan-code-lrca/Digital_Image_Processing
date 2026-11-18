"""Practical 2: resize an image with interpolation."""
import cv2
from examples.practicals._common import sample_bgr, save
image = sample_bgr()
resized = cv2.resize(image, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
save("02_resized_image.png", resized)
print("Original:", image.shape, "Resized:", resized.shape)
