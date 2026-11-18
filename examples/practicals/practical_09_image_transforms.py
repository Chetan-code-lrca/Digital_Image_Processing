"""Practical 9: visualize DFT, DCT, Walsh-Hadamard, and Haar transforms."""
import cv2
import numpy as np
from examples.practicals._common import sample_gray, save
from src.dip.module1_representation import dft_magnitude, dct_transform, walsh_hadamard_transform, haar_transform
gray = cv2.resize(sample_gray(), (128, 128), interpolation=cv2.INTER_AREA)
save("09_dft_magnitude.png", dft_magnitude(gray))
save("09_dct_coefficients.png", cv2.normalize(np.log1p(np.abs(dct_transform(gray))), None, 0, 255, cv2.NORM_MINMAX))
save("09_walsh_hadamard.png", cv2.normalize(np.log1p(np.abs(walsh_hadamard_transform(gray))), None, 0, 255, cv2.NORM_MINMAX))
save("09_haar_subbands.png", cv2.normalize(np.log1p(np.abs(haar_transform(gray))), None, 0, 255, cv2.NORM_MINMAX))
print("Log magnitude is used to make transform coefficients visible.")
