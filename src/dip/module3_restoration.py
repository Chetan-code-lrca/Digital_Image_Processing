"""Module III: quantitative and model-based image restoration."""
import cv2
import numpy as np

from src.dip.image_utils import to_uint8
from src.dip.module2_enhancement import homomorphic_filter


def mean_squared_error(original, restored):
    """Mean squared error for same-shaped arrays."""
    a, b = np.asarray(original, dtype=np.float64), np.asarray(restored, dtype=np.float64)
    if a.shape != b.shape:
        raise ValueError("Images must have identical shapes.")
    return float(np.mean((a - b) ** 2))


def root_mean_squared_error(original, restored):
    return float(np.sqrt(mean_squared_error(original, restored)))


def least_squares_line(x_values, y_values):
    """Fit y = slope*x + intercept by the least-squares method."""
    x = np.asarray(x_values, dtype=np.float64).ravel()
    y = np.asarray(y_values, dtype=np.float64).ravel()
    if x.size != y.size or x.size < 2:
        raise ValueError("x and y must have the same length of at least two.")
    design = np.column_stack([x, np.ones_like(x)])
    slope, intercept = np.linalg.lstsq(design, y, rcond=None)[0]
    return float(slope), float(intercept)


def svd_restore(degraded, rank=40, singular_value_threshold=0.0):
    """Denoise/reconstruct a grayscale image with truncated or thresholded SVD."""
    array = np.asarray(degraded, dtype=np.float64)
    if array.ndim != 2:
        raise ValueError("SVD restoration expects a grayscale 2-D image.")
    if rank < 1 or singular_value_threshold < 0:
        raise ValueError("rank must be positive and threshold non-negative.")
    u, values, vt = np.linalg.svd(array, full_matrices=False)
    k = min(rank, values.size)
    kept = np.maximum(values[:k] - singular_value_threshold, 0)
    return to_uint8((u[:, :k] * kept) @ vt[:k, :])


def _psf_to_otf(psf, shape):
    kernel = np.asarray(psf, dtype=np.float64)
    padded = np.zeros(shape, dtype=np.float64)
    kh, kw = kernel.shape
    if kh > shape[0] or kw > shape[1]:
        raise ValueError("PSF kernel cannot be larger than the image.")
    padded[:kh, :kw] = kernel
    padded = np.roll(padded, -(kh // 2), axis=0)
    padded = np.roll(padded, -(kw // 2), axis=1)
    return np.fft.fft2(padded)


def _regularized_frequency_restore(degraded, psf, regularization):
    gray = degraded if degraded.ndim == 2 else cv2.cvtColor(degraded, cv2.COLOR_BGR2GRAY)
    image = to_uint8(gray).astype(np.float64)
    if regularization < 0:
        raise ValueError("regularization must be non-negative.")
    psf = np.asarray(psf, dtype=np.float64)
    if psf.ndim != 2 or psf.sum() == 0:
        raise ValueError("PSF must be a non-empty 2-D kernel with non-zero sum.")
    psf = psf / psf.sum()
    transfer = _psf_to_otf(psf, image.shape)
    laplacian = _psf_to_otf(
        np.array([[0, -1, 0], [-1, 4, -1], [0, -1, 0]], dtype=np.float64),
        image.shape,
    )
    observation = np.fft.fft2(image)
    denominator = np.abs(transfer) ** 2 + regularization * np.abs(laplacian) ** 2
    estimate = np.conj(transfer) * observation / np.maximum(denominator, 1e-10)
    return to_uint8(np.real(np.fft.ifft2(estimate)))


def least_squares_restore(degraded, psf, regularization=0.01):
    """Regularized least-squares restoration for a known point-spread function."""
    return _regularized_frequency_restore(degraded, psf, regularization)


def map_restore(degraded, psf, noise_variance=1.0, prior_variance=100.0):
    """MAP restoration with a Gaussian noise model and smoothness prior."""
    if noise_variance < 0 or prior_variance <= 0:
        raise ValueError("noise_variance must be non-negative and prior_variance positive.")
    regularization = noise_variance / prior_variance
    return _regularized_frequency_restore(degraded, psf, regularization)


def homomorphic_restore(image, **kwargs):
    """Restore uneven illumination with the homomorphic filtering model."""
    return homomorphic_filter(image, **kwargs)


def apply_lens_distortion(image, k1=0.0, k2=0.0, p1=0.0, p2=0.0):
    """Remap an image using a normalized radial/tangential lens-distortion model.

    Coefficients are illustrative model parameters; their practical ranges
    depend on camera calibration and coordinate normalization.
    """
    array = to_uint8(image)
    rows, cols = array.shape[:2]
    cx, cy = (cols - 1) / 2.0, (rows - 1) / 2.0
    scale = float(max(rows, cols))
    y, x = np.indices((rows, cols), dtype=np.float32)
    xn, yn = (x - cx) / scale, (y - cy) / scale
    r2 = xn * xn + yn * yn
    radial = 1 + k1 * r2 + k2 * r2 * r2
    x_distorted = xn * radial + 2 * p1 * xn * yn + p2 * (r2 + 2 * xn * xn)
    y_distorted = yn * radial + p1 * (r2 + 2 * yn * yn) + 2 * p2 * xn * yn
    map_x = (x_distorted * scale + cx).astype(np.float32)
    map_y = (y_distorted * scale + cy).astype(np.float32)
    return cv2.remap(array, map_x, map_y, interpolation=cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_REFLECT)
