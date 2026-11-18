"""Module II: image enhancement, spatial filters, texture matrix, and homomorphic filtering."""
import cv2
import numpy as np

from src.dip.image_utils import to_uint8


def linear_contrast_stretch(image, low_percentile=1, high_percentile=99):
    """Stretch selected intensity percentiles to the full 0-255 range."""
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    array = to_uint8(gray).astype(np.float32)
    low, high = np.percentile(array, [low_percentile, high_percentile])
    if high <= low:
        return np.zeros_like(array, dtype=np.uint8)
    return np.clip((array - low) * 255.0 / (high - low), 0, 255).astype(np.uint8)


def nonlinear_contrast_stretch(image, gamma=0.8):
    """Apply a gamma curve as a nonlinear contrast/brightness transform."""
    if gamma <= 0:
        raise ValueError("gamma must be positive.")
    array = to_uint8(image).astype(np.float32) / 255.0
    return np.rint(np.power(array, gamma) * 255).astype(np.uint8)


def glcm_features(image, distances=(1,), angles=(0, 45, 90, 135), levels=16):
    """Compute basic GLCM texture features for requested distances and angles."""
    if not 2 <= levels <= 256:
        raise ValueError("levels must be between 2 and 256.")
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    quantized = np.floor(to_uint8(gray).astype(np.float32) * levels / 256).astype(int)
    results = {}
    offsets = {0: (0, 1), 45: (-1, 1), 90: (-1, 0), 135: (-1, -1)}
    rows, cols = quantized.shape
    i_values, j_values = np.indices((levels, levels))
    for distance in distances:
        if distance < 1:
            raise ValueError("GLCM distances must be positive.")
        for angle in angles:
            if angle not in offsets:
                raise ValueError("angles must be selected from 0, 45, 90, 135.")
            dy, dx = offsets[angle]
            dy, dx = dy * distance, dx * distance
            y0, y1 = max(0, -dy), min(rows, rows - dy)
            x0, x1 = max(0, -dx), min(cols, cols - dx)
            first = quantized[y0:y1, x0:x1]
            second = quantized[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
            matrix = np.zeros((levels, levels), dtype=np.float64)
            np.add.at(matrix, (first.ravel(), second.ravel()), 1)
            matrix += matrix.T
            if matrix.sum():
                matrix /= matrix.sum()
            contrast = np.sum((i_values - j_values) ** 2 * matrix)
            dissimilarity = np.sum(np.abs(i_values - j_values) * matrix)
            homogeneity = np.sum(matrix / (1 + np.abs(i_values - j_values)))
            energy = np.sum(matrix ** 2)
            px = matrix.sum(axis=1)
            py = matrix.sum(axis=0)
            mean_x = np.sum(np.arange(levels) * px)
            mean_y = np.sum(np.arange(levels) * py)
            std_x = np.sqrt(np.sum((np.arange(levels) - mean_x) ** 2 * px))
            std_y = np.sqrt(np.sum((np.arange(levels) - mean_y) ** 2 * py))
            covariance = np.sum((i_values - mean_x) * (j_values - mean_y) * matrix)
            correlation = covariance / (std_x * std_y) if std_x * std_y else 1.0
            results[(distance, angle)] = {
                "contrast": float(contrast),
                "dissimilarity": float(dissimilarity),
                "homogeneity": float(homogeneity),
                "energy": float(energy),
                "correlation": float(correlation),
            }
    return results


def mean_filter(image, kernel_size=3):
    return cv2.blur(to_uint8(image), (kernel_size, kernel_size))


def gaussian_filter(image, kernel_size=5, sigma=0):
    return cv2.GaussianBlur(to_uint8(image), (kernel_size, kernel_size), sigma)


def median_filter(image, kernel_size=3):
    return cv2.medianBlur(to_uint8(image), kernel_size)


def order_statistic_filter(image, kernel_size=3, statistic="median"):
    """Apply a min, max, median, or midpoint order-statistic filter."""
    array = to_uint8(image)
    if kernel_size < 3 or kernel_size % 2 == 0:
        raise ValueError("kernel_size must be an odd integer of at least 3.")
    if statistic == "min":
        return cv2.erode(array, np.ones((kernel_size, kernel_size), np.uint8))
    if statistic == "max":
        return cv2.dilate(array, np.ones((kernel_size, kernel_size), np.uint8))
    if statistic == "median":
        return cv2.medianBlur(array, kernel_size)
    if statistic == "midpoint":
        low = cv2.erode(array, np.ones((kernel_size, kernel_size), np.uint8))
        high = cv2.dilate(array, np.ones((kernel_size, kernel_size), np.uint8))
        return ((low.astype(np.uint16) + high.astype(np.uint16)) // 2).astype(np.uint8)
    raise ValueError("statistic must be min, max, median, or midpoint.")


def image_averaging(images):
    """Average multiple same-sized images to reduce independent random noise."""
    arrays = [np.asarray(image, dtype=np.float32) for image in images]
    if not arrays:
        raise ValueError("At least one image is required.")
    if any(array.shape != arrays[0].shape for array in arrays):
        raise ValueError("All images must have identical shapes.")
    return to_uint8(np.mean(arrays, axis=0))


def bilateral_smoothing(image, diameter=9, sigma_colour=75, sigma_space=75):
    """Edge-preserving smoothing using a bilateral filter."""
    return cv2.bilateralFilter(to_uint8(image), diameter, sigma_colour, sigma_space)


def low_pass_filter(image, cutoff=30):
    """Ideal circular low-pass filter in the Fourier domain."""
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    array = to_uint8(gray).astype(np.float32)
    rows, cols = array.shape
    spectrum = np.fft.fftshift(np.fft.fft2(array))
    y, x = np.ogrid[:rows, :cols]
    distance = np.sqrt((y - rows / 2) ** 2 + (x - cols / 2) ** 2)
    filtered = spectrum * (distance <= cutoff)
    result = np.abs(np.fft.ifft2(np.fft.ifftshift(filtered)))
    return to_uint8(result)


def high_pass_filter(image, cutoff=30):
    """Ideal circular high-pass filter in the Fourier domain."""
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    array = to_uint8(gray).astype(np.float32)
    rows, cols = array.shape
    spectrum = np.fft.fftshift(np.fft.fft2(array))
    y, x = np.ogrid[:rows, :cols]
    distance = np.sqrt((y - rows / 2) ** 2 + (x - cols / 2) ** 2)
    filtered = spectrum * (distance > cutoff)
    result = np.abs(np.fft.ifft2(np.fft.ifftshift(filtered)))
    return to_uint8(cv2.normalize(result, None, 0, 255, cv2.NORM_MINMAX))


def sharpen_image(image, amount=1.0):
    """Sharpen using unsharp masking."""
    array = to_uint8(image)
    blurred = cv2.GaussianBlur(array, (0, 0), 1.5)
    return to_uint8(cv2.addWeighted(array, 1.0 + amount, blurred, -amount, 0))


def laplacian_sharpen(image, amount=0.7):
    """Sharpen an image using its Laplacian response."""
    array = to_uint8(image)
    laplacian = cv2.Laplacian(array, cv2.CV_32F, ksize=3)
    return to_uint8(array.astype(np.float32) - amount * laplacian)


def homomorphic_filter(image, gamma_low=0.5, gamma_high=1.5, cutoff=30, sharpness=1.0):
    """Reduce slow illumination variation and enhance reflectance in log-frequency space."""
    if not 0 < gamma_low <= gamma_high or cutoff <= 0 or sharpness <= 0:
        raise ValueError("Invalid homomorphic filter parameters.")
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    log_image = np.log1p(to_uint8(gray).astype(np.float32))
    rows, cols = log_image.shape
    spectrum = np.fft.fftshift(np.fft.fft2(log_image))
    y, x = np.ogrid[:rows, :cols]
    distance_squared = (y - rows / 2) ** 2 + (x - cols / 2) ** 2
    high_pass = (gamma_high - gamma_low) * (
        1 - np.exp(-sharpness * distance_squared / (cutoff ** 2))
    ) + gamma_low
    restored_log = np.real(np.fft.ifft2(np.fft.ifftshift(spectrum * high_pass)))
    return to_uint8(np.expm1(restored_log))
