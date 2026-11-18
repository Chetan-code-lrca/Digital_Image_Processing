"""Practical 1: convert an RGB/BGR image to grayscale."""
import cv2
from examples.practicals._common import sample_bgr, save
image = sample_bgr()
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
save("01_rgb_to_grayscale.png", gray)
print("Grayscale shape:", gray.shape)
