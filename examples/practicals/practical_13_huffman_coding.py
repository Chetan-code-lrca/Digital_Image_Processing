"""Practical 13: lossless Huffman coding of grayscale pixel values."""
import numpy as np
from examples.practicals._common import sample_gray, save
from src.dip.module4_compression import huffman_encode, huffman_decode
image = sample_gray()
codes, bitstream = huffman_encode(image)
decoded = huffman_decode(bitstream, codes).astype(np.uint8).reshape(image.shape)
save("13_huffman_round_trip.png", decoded)
print("Number of symbols:", len(codes))
print("Encoded bit count:", len(bitstream))
print("Exact reconstruction:", bool(np.array_equal(image, decoded)))
