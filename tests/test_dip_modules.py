import cv2
import numpy as np
import pytest

from src.dip.module1_representation import (
    convert_colour_models, sample_and_quantize, gray_negative,
    log_transform, inverse_log_transform, gamma_transform,
    piecewise_linear_transform, gray_level_slicing,
    histogram_equalization, dct_transform, dct_inverse,
    walsh_hadamard_transform, haar_transform, svd_low_rank,
)
from src.dip.module2_enhancement import (
    linear_contrast_stretch, glcm_features, median_filter,
    bilateral_smoothing, low_pass_filter, high_pass_filter,
)
from src.dip.module3_restoration import (
    mean_squared_error, root_mean_squared_error, peak_signal_to_noise_ratio, least_squares_line,
    least_squares_restore, map_restore, apply_lens_distortion,
)
from src.dip.module4_compression import (
    run_length_encode, run_length_decode, huffman_encode, huffman_decode,
    lzw_encode, lzw_decode, arithmetic_encode, arithmetic_decode,
    jpeg_encode, jpeg_decode, vector_quantize,
)
from src.dip.module5_segmentation import (
    otsu_threshold, multilevel_threshold, local_threshold, extract_regions,
    region_growing, kmeans_segmentation, region_split, region_merge, split_and_merge,
)


@pytest.fixture
def gray():
    return np.tile(np.arange(64, dtype=np.uint8), (64, 1))


@pytest.fixture
def colour(gray):
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)


def test_representation_and_colour_models(colour):
    models = convert_colour_models(colour)
    assert {"hsv", "hsi", "ycbcr", "cmyk"} == set(models)
    assert models["hsv"].shape == colour.shape
    assert models["hsi"].shape == colour.shape
    assert models["ycbcr"].shape == colour.shape
    assert models["cmyk"].shape == (*colour.shape[:2], 4)


def test_sampling_quantization_and_negative(gray):
    result = sample_and_quantize(gray, sampling_step=2, levels=8)
    assert result.shape == (32, 32)
    assert len(np.unique(result)) <= 8
    assert np.array_equal(gray_negative(gray), 255 - gray)


def test_gray_level_transformations(gray):
    assert log_transform(gray).shape == gray.shape
    assert inverse_log_transform(gray).shape == gray.shape
    assert gamma_transform(gray, gamma=0.7).shape == gray.shape
    piecewise = piecewise_linear_transform(
        gray, control_points=((0, 0), (64, 32), (255, 255))
    )
    assert piecewise.shape == gray.shape
    sliced = gray_level_slicing(gray, 16, 31, preserve_background=False)
    assert set(np.unique(sliced)).issubset({0, 255})
    assert np.all(sliced[:, 16:32] == 255)


def test_histogram_equalization_and_dct_roundtrip(gray):
    equalized = histogram_equalization(gray)
    restored = dct_inverse(dct_transform(gray))
    assert equalized.shape == gray.shape
    assert np.max(np.abs(restored.astype(int) - gray.astype(int))) <= 1


def test_walsh_hadamard_is_orthonormal(gray):
    transformed = walsh_hadamard_transform(gray)
    restored = walsh_hadamard_transform(transformed)
    assert transformed.shape == gray.shape
    assert np.allclose(restored, gray, atol=1e-4)


def test_haar_and_svd_shapes(gray):
    assert haar_transform(gray).shape == gray.shape
    assert svd_low_rank(gray, rank=8).shape == gray.shape


def test_enhancement_filters_and_glcm(gray):
    stretched = linear_contrast_stretch(gray)
    assert stretched.shape == gray.shape
    assert median_filter(gray).shape == gray.shape
    assert bilateral_smoothing(gray).shape == gray.shape
    assert low_pass_filter(gray).shape == gray.shape
    assert high_pass_filter(gray).shape == gray.shape
    features = glcm_features(gray, distances=(1,), angles=(0, 90), levels=8)
    assert set(features) == {(1, 0), (1, 90)}
    assert all("contrast" in item and "homogeneity" in item for item in features.values())


def test_restoration_metrics_and_line_fit(gray):
    assert mean_squared_error(gray, gray) == 0
    assert root_mean_squared_error(gray, gray) == 0
    assert np.isinf(peak_signal_to_noise_ratio(gray, gray))
    assert peak_signal_to_noise_ratio(gray, gray + 1) == pytest.approx(48.13, abs=0.02)
    slope, intercept = least_squares_line([0, 1, 2], [1, 3, 5])
    assert slope == pytest.approx(2)
    assert intercept == pytest.approx(1)


def test_least_squares_map_and_identity_distortion(gray):
    psf = np.ones((3, 3), dtype=np.float32)
    restored = least_squares_restore(gray, psf, regularization=0.05)
    map_result = map_restore(gray, psf, noise_variance=0.1, prior_variance=10)
    identity = apply_lens_distortion(gray, 0, 0, 0, 0)
    assert restored.shape == gray.shape
    assert map_result.shape == gray.shape
    assert np.array_equal(identity, gray)


def test_rle_huffman_lzw_and_arithmetic_roundtrips():
    values = np.array([1, 1, 1, 2, 3, 3, 0, 255, 0], dtype=np.uint8)
    assert np.array_equal(run_length_decode(run_length_encode(values)), values)
    codes, bits = huffman_encode(values)
    assert np.array_equal(huffman_decode(bits, codes), values)
    assert np.array_equal(lzw_decode(lzw_encode(values)), values)
    arithmetic = arithmetic_encode(values)
    assert np.array_equal(arithmetic_decode(arithmetic), values)


def test_jpeg_and_vector_quantization(gray):
    jpeg_image = jpeg_decode(jpeg_encode(gray, quality=85))
    quantized, codebook, indices = vector_quantize(gray, block_size=4, codebook_size=8)
    assert jpeg_image.shape == gray.shape
    assert quantized.shape == gray.shape
    assert codebook.shape[0] <= 8
    assert indices.shape == (16, 16)


def test_thresholding_and_regions(gray):
    threshold, otsu = otsu_threshold(gray)
    assert 0 <= threshold <= 255
    assert otsu.shape == gray.shape
    local = local_threshold(gray, block_size=11)
    assert local.shape == gray.shape
    count, labels, stats, centroids = extract_regions(otsu)
    assert count >= 1
    assert labels.shape == gray.shape
    assert stats.shape[1] == 5


def test_multilevel_threshold_region_growing_kmeans_split_merge(gray):
    thresholds, labels = multilevel_threshold(gray, classes=3)
    assert len(thresholds) == 2
    assert labels.shape == gray.shape
    grown = region_growing(gray, seed=(10, 10), tolerance=5)
    assert grown.shape == gray.shape
    clusters, segmented = kmeans_segmentation(gray, clusters=3)
    assert segmented.shape == gray.shape
    assert len(np.unique(clusters)) <= 3
    split_labels = region_split(gray, variance_limit=30, min_size=4)
    merged_labels = region_merge(gray, split_labels, merge_threshold=4)
    split_merged = split_and_merge(gray, variance_limit=30, merge_threshold=4, min_size=4)
    assert split_labels.shape == gray.shape
    assert merged_labels.shape == gray.shape
    assert split_merged.shape == gray.shape
    assert len(np.unique(split_merged)) >= 1
