"""Module I: image presentation, colour, gray-level operations, and transforms."""
import cv2
import numpy as np

from src.dip.image_utils import to_uint8


def image_information(image):
    """Return basic representation and storage information for an image."""
    array = np.asarray(image)
    if array.size == 0:
        raise ValueError("Image must not be empty.")
    channels = 1 if array.ndim == 2 else array.shape[2]
    return {
        "height": int(array.shape[0]),
        "width": int(array.shape[1]),
        "channels": int(channels),
        "dtype": str(array.dtype),
        "bits_per_channel": int(array.dtype.itemsize * 8),
        "bits_per_pixel": int(array.dtype.itemsize * 8 * channels),
        "minimum": float(array.min()),
        "maximum": float(array.max()),
    }


def sample_and_quantize(image, sampling_step=2, levels=16):
    """Demonstrate spatial sampling and intensity quantization."""
    if sampling_step < 1:
        raise ValueError("sampling_step must be at least 1.")
    if not 2 <= levels <= 256:
        raise ValueError("levels must be between 2 and 256.")
    sampled = np.asarray(image)[::sampling_step, ::sampling_step]
    scaled = np.rint(to_uint8(sampled).astype(np.float32) * (levels - 1) / 255)
    return np.rint(scaled * 255 / (levels - 1)).astype(np.uint8)


def convert_colour_models(bgr):
    """Return HSV, HSI, YCbCr, and CMYK representations from a BGR image."""
    if bgr.ndim != 3 or bgr.shape[2] != 3:
        raise ValueError("Expected a three-channel BGR image.")
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
    ycbcr = ycrcb[:, :, [0, 2, 1]]

    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    numerator = 0.5 * ((r - g) + (r - b))
    denominator = np.sqrt((r - g) ** 2 + (r - b) * (g - b)) + 1e-8
    theta = np.arccos(np.clip(numerator / denominator, -1.0, 1.0))
    hue = np.where(b <= g, theta, 2 * np.pi - theta) / (2 * np.pi)
    saturation = 1 - (3 * np.minimum(np.minimum(r, g), b) / (r + g + b + 1e-8))
    intensity = (r + g + b) / 3
    hsi = np.stack([hue, saturation, intensity], axis=2)
    hsi = np.clip(hsi * 255, 0, 255).astype(np.uint8)

    key = 1 - np.max(rgb, axis=2)
    denominator = np.maximum(1 - key, 1e-8)
    c = (1 - r - key) / denominator
    m = (1 - g - key) / denominator
    y = (1 - b - key) / denominator
    cmyk = np.stack([c, m, y, key], axis=2)
    return {"hsv": hsv, "hsi": hsi, "ycbcr": ycbcr, "cmyk": cmyk}


def gray_negative(image):
    """Return the negative of an 8-bit image."""
    return 255 - to_uint8(image)


def log_transform(image, gain=255.0 / np.log1p(255)):
    """Apply logarithmic gray-level transformation."""
    array = to_uint8(image).astype(np.float32)
    return to_uint8(gain * np.log1p(array))


def gamma_transform(image, gamma=1.0, gain=1.0):
    """Apply power-law (gamma) transformation."""
    if gamma <= 0 or gain < 0:
        raise ValueError("gamma must be positive and gain non-negative.")
    array = to_uint8(image).astype(np.float32) / 255.0
    return to_uint8(gain * np.power(array, gamma) * 255.0)


def inverse_log_transform(image):
    """Apply a normalized inverse-log (exponential) gray-level mapping."""
    array = to_uint8(image).astype(np.float32) / 255.0
    numerator = np.expm1(array)
    denominator = np.expm1(1.0)
    return np.rint(255.0 * numerator / denominator).astype(np.uint8)


def piecewise_linear_transform(image, control_points=((0, 0), (255, 255))):
    """Map grayscale intensities by linear interpolation between control points.

    control_points is a sequence of (input_level, output_level) pairs.
    Input levels must be strictly increasing and all coordinates must be in 0..255.
    """
    points = np.asarray(control_points, dtype=np.float64)
    if points.ndim != 2 or points.shape[1] != 2 or points.shape[0] < 2:
        raise ValueError("control_points must contain at least two (input, output) pairs.")
    x_values, y_values = points[:, 0], points[:, 1]
    if np.any(np.diff(x_values) <= 0):
        raise ValueError("control-point input levels must be strictly increasing.")
    if np.any(points < 0) or np.any(points > 255):
        raise ValueError("control-point coordinates must be within 0..255.")
    array = to_uint8(image)
    mapped = np.interp(array.astype(np.float32), x_values, y_values)
    return np.rint(np.clip(mapped, 0, 255)).astype(np.uint8)


def gray_level_slicing(image, lower, upper, highlight=255, preserve_background=True):
    """Highlight an inclusive grayscale interval.

    If preserve_background is False, all pixels outside [lower, upper] become zero.
    """
    array = to_uint8(image)
    if array.ndim != 2:
        raise ValueError("gray_level_slicing expects a single-channel grayscale image.")
    if not 0 <= lower <= upper <= 255:
        raise ValueError("lower and upper must satisfy 0 <= lower <= upper <= 255.")
    if not 0 <= highlight <= 255:
        raise ValueError("highlight must be between 0 and 255.")
    background = array if preserve_background else np.zeros_like(array)
    mask = (array >= lower) & (array <= upper)
    return np.where(mask, highlight, background).astype(np.uint8)


def threshold_image(image, threshold=127):
    """Convert an image to a binary image using a global threshold."""
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, result = cv2.threshold(to_uint8(gray), threshold, 255, cv2.THRESH_BINARY)
    return result


def histogram_equalization(image):
    """Equalize grayscale intensity or the luminance channel of a BGR image."""
    if image.ndim == 2:
        return cv2.equalizeHist(to_uint8(image))
    ycrcb = cv2.cvtColor(to_uint8(image), cv2.COLOR_BGR2YCrCb)
    ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
    return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)


def histogram_specification(source, reference):
    """Match a grayscale source histogram to a reference image histogram."""
    src = to_uint8(source if source.ndim == 2 else cv2.cvtColor(source, cv2.COLOR_BGR2GRAY))
    ref = to_uint8(reference if reference.ndim == 2 else cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY))
    src_hist = np.bincount(src.ravel(), minlength=256).astype(np.float64)
    ref_hist = np.bincount(ref.ravel(), minlength=256).astype(np.float64)
    src_cdf = np.cumsum(src_hist) / src.size
    ref_cdf = np.cumsum(ref_hist) / ref.size
    lookup = np.interp(src_cdf, ref_cdf, np.arange(256))
    return np.clip(lookup[src], 0, 255).astype(np.uint8)


def multi_image_operations(first, second):
    """Return common arithmetic and logical operations for same-sized images."""
    a, b = to_uint8(first), to_uint8(second)
    if a.shape != b.shape:
        raise ValueError("Input images must have identical shapes.")
    return {
        "addition": cv2.add(a, b),
        "subtraction": cv2.subtract(a, b),
        "absolute_difference": cv2.absdiff(a, b),
        "average": cv2.addWeighted(a, 0.5, b, 0.5, 0),
        "and": cv2.bitwise_and(a, b),
        "or": cv2.bitwise_or(a, b),
        "xor": cv2.bitwise_xor(a, b),
        "not_first": cv2.bitwise_not(a),
    }


def dft_magnitude(image):
    """Return a normalized, shifted DFT magnitude spectrum."""
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    spectrum = np.fft.fftshift(np.fft.fft2(to_uint8(gray)))
    magnitude = 20 * np.log(np.abs(spectrum) + 1)
    return to_uint8(cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX))


def dct_transform(image):
    """Compute a 2-D discrete cosine transform of a grayscale image."""
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.dct(to_uint8(gray).astype(np.float32))


def dct_inverse(coefficients):
    """Reconstruct an image from 2-D DCT coefficients."""
    return to_uint8(cv2.idct(np.asarray(coefficients, dtype=np.float32)))


def _hadamard(order):
    if order < 1 or order & (order - 1):
        raise ValueError("Hadamard dimensions must be powers of two.")
    matrix = np.array([[1.0]])
    while matrix.shape[0] < order:
        matrix = np.block([[matrix, matrix], [matrix, -matrix]])
    return matrix / np.sqrt(order)


def walsh_hadamard_transform(image):
    """Apply a normalized 2-D Walsh-Hadamard transform."""
    array = np.asarray(image, dtype=np.float32)
    if array.ndim != 2:
        raise ValueError("Walsh-Hadamard transform expects a grayscale image.")
    h, w = array.shape
    return _hadamard(h) @ array @ _hadamard(w).T


def haar_transform(image):
    """Compute a one-level 2-D Haar transform (LL/LH/HL/HH sub-bands)."""
    array = np.asarray(image, dtype=np.float32)
    if array.ndim != 2 or array.shape[0] % 2 or array.shape[1] % 2:
        raise ValueError("Haar transform expects a 2-D image with even dimensions.")
    root2 = np.sqrt(2.0)
    row_low = (array[:, 0::2] + array[:, 1::2]) / root2
    row_high = (array[:, 0::2] - array[:, 1::2]) / root2
    row_coefficients = np.concatenate([row_low, row_high], axis=1)
    col_low = (row_coefficients[0::2, :] + row_coefficients[1::2, :]) / root2
    col_high = (row_coefficients[0::2, :] - row_coefficients[1::2, :]) / root2
    return np.concatenate([col_low, col_high], axis=0)


def klt_transform(image, components=None):
    """Apply a row-sample Karhunen-Loeve transform using covariance eigenvectors."""
    array = np.asarray(image, dtype=np.float64)
    if array.ndim != 2:
        raise ValueError("KLT expects a 2-D grayscale image.")
    centered = array - array.mean(axis=0, keepdims=True)
    covariance = np.atleast_2d(np.cov(centered, rowvar=False))
    eigenvalues, eigenvectors = np.linalg.eigh(covariance)
    order = np.argsort(eigenvalues)[::-1]
    eigenvalues, eigenvectors = eigenvalues[order], eigenvectors[:, order]
    if components is not None:
        if not 1 <= components <= eigenvectors.shape[1]:
            raise ValueError("components must be between 1 and image width.")
        eigenvectors = eigenvectors[:, :components]
        eigenvalues = eigenvalues[:components]
    return centered @ eigenvectors, eigenvalues


def svd_low_rank(image, rank=20):
    """Reconstruct a grayscale image using only its largest rank singular values."""
    array = np.asarray(image, dtype=np.float64)
    if array.ndim != 2:
        raise ValueError("SVD expects a 2-D grayscale image.")
    if rank < 1:
        raise ValueError("rank must be positive.")
    u, singular_values, vt = np.linalg.svd(array, full_matrices=False)
    k = min(rank, len(singular_values))
    reconstructed = (u[:, :k] * singular_values[:k]) @ vt[:k, :]
    return to_uint8(reconstructed)
