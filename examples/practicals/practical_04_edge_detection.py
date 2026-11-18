"""Practical 4: detect image edges with Canny."""
import cv2
from examples.practicals._common import sample_bgr, save
gray = cv2.cvtColor(sample_bgr(), cv2.COLOR_BGR2GRAY)
save("04_canny_edges.png", cv2.Canny(gray, 80, 160))
