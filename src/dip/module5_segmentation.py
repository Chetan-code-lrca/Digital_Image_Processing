"""Module V: pixel-based and region-based image segmentation."""
from collections import deque

import cv2
import numpy as np

from src.dip.image_utils import to_uint8


def global_threshold(image, threshold=127):
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(to_uint8(gray), threshold, 255, cv2.THRESH_BINARY)
    return mask


def otsu_threshold(image):
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    threshold, mask = cv2.threshold(to_uint8(gray), 0, 255,
                                    cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return float(threshold), mask


def multilevel_threshold(image, classes=3):
    """Return Multi-Otsu thresholds and a class-label image."""
    from skimage.filters import threshold_multiotsu

    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    array = to_uint8(gray)
    thresholds = threshold_multiotsu(array, classes=classes)
    labels = np.digitize(array, bins=thresholds)
    return thresholds, labels.astype(np.uint8)


def local_threshold(image, block_size=11, constant=2):
    """Adaptive mean thresholding for non-uniform illumination."""
    if block_size < 3 or block_size % 2 == 0:
        raise ValueError("block_size must be an odd integer of at least 3.")
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.adaptiveThreshold(to_uint8(gray), 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                 cv2.THRESH_BINARY, block_size, constant)


def extract_regions(binary_image, connectivity=8):
    """Label connected foreground regions and return labels, stats, centroids."""
    binary = to_uint8(binary_image)
    if binary.ndim != 2:
        raise ValueError("Region extraction expects a single-channel binary image.")
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(
        (binary > 0).astype(np.uint8), connectivity=connectivity
    )
    return count - 1, labels, stats[1:], centroids[1:]


def region_growing(image, seed, tolerance=12, connectivity=4):
    """Grow a connected region from (row, column) using seed-intensity tolerance."""
    array = to_uint8(image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))
    row, col = map(int, seed)
    rows, cols = array.shape
    if not (0 <= row < rows and 0 <= col < cols):
        raise ValueError("Seed point is outside the image.")
    if tolerance < 0 or connectivity not in (4, 8):
        raise ValueError("Invalid tolerance or connectivity.")
    seed_value = int(array[row, col])
    visited = np.zeros(array.shape, dtype=bool)
    mask = np.zeros(array.shape, dtype=np.uint8)
    queue = deque([(row, col)])
    visited[row, col] = True
    neighbours = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    if connectivity == 8:
        neighbours += [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    while queue:
        y, x = queue.popleft()
        if abs(int(array[y, x]) - seed_value) <= tolerance:
            mask[y, x] = 255
            for dy, dx in neighbours:
                ny, nx = y + dy, x + dx
                if 0 <= ny < rows and 0 <= nx < cols and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
    return mask


def kmeans_segmentation(image, clusters=3, max_iter=30):
    """Cluster grayscale or BGR pixels and return labels and segmented image."""
    array = to_uint8(image)
    if clusters < 2:
        raise ValueError("clusters must be at least 2.")
    original_shape = array.shape
    channels = 1 if array.ndim == 2 else array.shape[2]
    pixels = array.reshape(-1, channels).astype(np.float32)
    k = min(clusters, len(pixels))
    quantiles = np.linspace(0, 100, k + 2)[1:-1]
    if channels == 1:
        centres = np.percentile(pixels[:, 0], quantiles).reshape(k, 1)
    else:
        brightness = pixels.mean(axis=1)
        order = np.argsort(brightness)
        positions = np.linspace(0, len(order) - 1, k).astype(int)
        centres = pixels[order[positions]].copy()
    for _ in range(max_iter):
        distances = ((pixels[:, None, :] - centres[None, :, :]) ** 2).sum(axis=2)
        labels = distances.argmin(axis=1)
        updated = centres.copy()
        for index in range(k):
            members = pixels[labels == index]
            if len(members):
                updated[index] = members.mean(axis=0)
        if np.allclose(updated, centres):
            centres = updated
            break
        centres = updated
    segmented = centres[labels].reshape(original_shape)
    return labels.reshape(original_shape[:2]), to_uint8(segmented)


def _quadtree_leaves(array, y0, y1, x0, x1, variance_limit, min_size, leaves):
    region = array[y0:y1, x0:x1]
    if region.size == 0:
        return
    if region.var() <= variance_limit or min(y1 - y0, x1 - x0) <= min_size:
        leaves.append((y0, y1, x0, x1, float(region.mean())))
        return
    ym, xm = (y0 + y1) // 2, (x0 + x1) // 2
    y_parts = [(y0, ym), (ym, y1)] if ym > y0 else [(y0, y1)]
    x_parts = [(x0, xm), (xm, x1)] if xm > x0 else [(x0, x1)]
    if len(y_parts) == 1 and len(x_parts) == 1:
        leaves.append((y0, y1, x0, x1, float(region.mean())))
        return
    for ya, yb in y_parts:
        for xa, xb in x_parts:
            _quadtree_leaves(array, ya, yb, xa, xb, variance_limit, min_size, leaves)


def split_and_merge(image, variance_limit=100, merge_threshold=8, min_size=8):
    """Split heterogeneous regions into blocks, then merge adjacent similar leaves."""
    gray = to_uint8(image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))
    if variance_limit < 0 or merge_threshold < 0 or min_size < 1:
        raise ValueError("Thresholds must be non-negative and min_size positive.")
    rows, cols = gray.shape
    leaves = []
    _quadtree_leaves(gray, 0, rows, 0, cols, variance_limit, min_size, leaves)
    labels = np.zeros(gray.shape, dtype=np.int32)
    means = []
    for index, (y0, y1, x0, x1, mean) in enumerate(leaves, start=1):
        labels[y0:y1, x0:x1] = index
        means.append(mean)

    parent = list(range(len(leaves) + 1))

    def find(value):
        while parent[value] != value:
            parent[value] = parent[parent[value]]
            value = parent[value]
        return value

    def union(first, second):
        first, second = find(first), find(second)
        if first != second:
            parent[second] = first

    for left, right in ((labels[:, :-1], labels[:, 1:]),
                        (labels[:-1, :], labels[1:, :])):
        pairs = np.stack([left.ravel(), right.ravel()], axis=1)
        pairs = np.unique(pairs[pairs[:, 0] != pairs[:, 1]], axis=0)
        for first, second in pairs:
            if abs(means[int(first) - 1] - means[int(second) - 1]) <= merge_threshold:
                union(int(first), int(second))

    roots = {}
    merged = np.zeros_like(labels)
    for old in range(1, len(leaves) + 1):
        root = find(old)
        roots.setdefault(root, len(roots) + 1)
        merged[labels == old] = roots[root]
    return merged
