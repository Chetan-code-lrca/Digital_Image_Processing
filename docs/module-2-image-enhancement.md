# Module II — Image Enhancement

**Syllabus coverage:** contrast intensification; linear and non-linear stretching; histogram specification; modifying the gray-level co-occurrence matrix; smoothing; image averaging; mean and order-statistic filters; edge-preserving smoothing; low-pass filtering; sharpening; high-pass filtering; homomorphic filtering.

## Topic-to-code map

| Syllabus topic | Implementation |
|---|---|
| Linear contrast stretching | linear_contrast_stretch |
| Non-linear stretching | nonlinear_contrast_stretch |
| Histogram specification | histogram_specification in Module I |
| Gray-Level Co-occurrence Matrix (GLCM) | glcm_features |
| Smoothing / mean filter | mean_filter |
| Gaussian smoothing | gaussian_filter |
| Median / order-statistic filter | median_filter, order_statistic_filter |
| Image averaging | image_averaging |
| Edge-preserving smoothing | bilateral_smoothing |
| Low-pass filtering | low_pass_filter |
| Image sharpening | sharpen_image, laplacian_sharpen |
| High-pass filtering | high_pass_filter |
| Homomorphic filtering | homomorphic_filter |

## Key ideas

- Enhancement improves visual appearance or makes features easier to analyze; it does not guarantee recovery of the original scene.
- Mean and Gaussian filters smooth intensity variation. Median and other order-statistic filters are useful for impulse-noise cases.
- Bilateral filtering uses both spatial distance and intensity similarity to reduce smoothing across strong edges.
- A low-pass filter attenuates high-frequency detail; a high-pass filter attenuates slowly varying components and emphasizes detail.
- Homomorphic filtering uses a log transform to separate the multiplicative illumination and reflectance model into additive components.

## Run the related practicals

~~~bash
python -m examples.practicals.practical_03_image_blurring
python -m examples.practicals.practical_05_image_histogram
python -m examples.practicals.practical_10_linear_contrast_stretching
python -m examples.practicals.practical_11_frequency_domain_filtering
~~~

See [flowcharts](flowcharts.md) for the module workflow.
