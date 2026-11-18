"""Practical 6: rotate an image around its centre."""
import cv2
from examples.practicals._common import sample_bgr, save
image = sample_bgr()
height, width = image.shape[:2]
matrix = cv2.getRotationMatrix2D((width / 2, height / 2), 30, 1.0)
rotated = cv2.warpAffine(image, matrix, (width, height), flags=cv2.INTER_LINEAR)
save("06_rotated_image.png", rotated)
