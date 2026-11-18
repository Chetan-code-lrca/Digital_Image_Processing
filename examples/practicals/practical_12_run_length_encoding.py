"""Practical 12: lossless run-length encoding and decoding."""
import numpy as np
from examples.practicals._common import sample_gray, save
from src.dip.module4_compression import run_length_encode, run_length_decode
image = sample_gray()
runs = run_length_encode(image)
decoded = run_length_decode(runs, shape=image.shape, dtype=np.uint8)
save("12_rle_round_trip.png", decoded)
print("Run count:", len(runs))
print("Exact reconstruction:", bool(np.array_equal(image, decoded)))
