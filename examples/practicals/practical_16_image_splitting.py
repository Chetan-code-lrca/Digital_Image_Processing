"""Practical 16: split BGR channels and spatial quadrants."""
import cv2
from examples.practicals._common import sample_bgr, save
image = sample_bgr()
blue, green, red = cv2.split(image)
save("16_blue_channel.png", blue)
save("16_green_channel.png", green)
save("16_red_channel.png", red)
height, width = image.shape[:2]
for name, region in (
    ("top_left", image[:height // 2, :width // 2]),
    ("top_right", image[:height // 2, width // 2:]),
    ("bottom_left", image[height // 2:, :width // 2]),
    ("bottom_right", image[height // 2:, width // 2:]),
):
    save(f"16_{name}.png", region)
