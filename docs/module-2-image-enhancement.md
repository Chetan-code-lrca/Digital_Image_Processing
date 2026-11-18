# Module II — Image Enhancement

> **Course alignment — CSE2571C:** Contrast intensification; linear and non-linear stretching; histogram specification; modifying the gray-level co-occurrence matrix; smoothing; image averaging; mean and order-statistic filters; edge-preserving smoothing; low-pass filtering; sharpening; high-pass filtering; homomorphic filtering.

Image enhancement changes pixel values to make important information easier to see or use. It can improve an image for a human observer or prepare it for later processing such as segmentation and feature extraction.

Enhancement is not the same as restoration: enhancement seeks a useful appearance, while restoration attempts to estimate an original image using a degradation model.

## Learning outcomes

You should be able to choose an enhancement method based on the image problem, derive the main intensity and texture equations, compare spatial and frequency filtering, and explain the trade-off between noise reduction and detail preservation.

## 1. Enhancement workflow

~~~mermaid
flowchart TD
    A[Input image] --> B[Inspect intensity histogram and visible defects]
    B --> C{Primary problem?}
    C -->|Low contrast| D[Stretching / equalization / specification]
    C -->|Uneven lighting| E[Homomorphic filtering]
    C -->|Random or impulse noise| F[Mean / Gaussian / median filter]
    C -->|Noise near boundaries| G[Bilateral / edge-preserving smoothing]
    C -->|Weak edges and details| H[High-pass / sharpening]
    D --> I[Compare output and histogram]
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J[Validate detail, noise and downstream task]
~~~

A good workflow is: inspect first, choose a method that addresses the visible issue, adjust parameters, and compare the result against the original. Do not apply every filter in sequence without a reason.

## 2. Contrast intensification

Contrast intensification is the overall objective of making intensity differences more visible. Linear stretching, gamma correction, equalization and histogram specification are different ways to achieve it.

### 2.1 Linear contrast stretching

Suppose the useful input intensity interval is [r_min, r_max] and the output range is [0, L-1]. A simple linear mapping is:

~~~text
s = (r - r_min) × (L - 1) / (r_max - r_min)
~~~

Clip s to [0, L-1]. For an 8-bit image, L=256.

**Worked example**

An image uses intensities mainly between 80 and 160. Map that interval to 0–255.

| Input r | Calculation | Output s |
|---:|---|---:|
| 80 | Lower endpoint | 0 |
| 100 | 20 × 255 / 80 | 64 |
| 120 | 40 × 255 / 80 | 128 |
| 140 | 60 × 255 / 80 | 191 |
| 160 | Upper endpoint | 255 |

The differences between intensities are expanded. Values outside the chosen range are clipped.

**Percentile stretching:** using minimum and maximum values can be sensitive to a few extreme pixels. The repository's implementation uses lower and upper percentiles by default, so isolated outliers are less likely to set the entire range.

### 2.2 Non-linear stretching

A non-linear mapping changes different intensity ranges by different amounts.

| Method | Mapping idea | Typical effect |
|---|---|---|
| Logarithmic | s = c log(1+r) | Expands dark values; compresses bright values |
| Inverse-log | Exponential mapping | Expands brighter values more strongly |
| Gamma / power law | s = c r^γ | Flexible brightening/darkening |
| Piecewise-linear | Different linear rule per interval | Targeted control over selected tonal ranges |

For normalized r in [0,1], gamma correction is often written s=r^γ:

- γ < 1 brightens the image.
- γ = 1 leaves it unchanged.
- γ > 1 darkens the image.

The values of c and the normalization convention must be chosen so that the output stays in the valid intensity range.

### 2.3 Histogram equalization

Let n_k be the number of pixels at intensity r_k and N the total pixel count.

~~~text
PDF(r_k) = n_k / N

CDF(r_k) = sum from i=0 to k of PDF(r_i)

s_k = round((L - 1) × CDF(r_k))
~~~

The CDF is monotonic and maps the input intensities into a new range. Equalization often improves global contrast when the histogram is concentrated in a narrow interval.

**Worked 3-bit example from the enhancement lecture**

L=8 and N=48. The observed histogram is:

| Gray level r_k | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Frequency n_k | 4 | 6 | 8 | 10 | 8 | 6 | 4 | 2 |
| PDF | 0.0833 | 0.1250 | 0.1667 | 0.2083 | 0.1667 | 0.1250 | 0.0833 | 0.0417 |
| CDF | 0.0833 | 0.2083 | 0.3750 | 0.5833 | 0.7500 | 0.8750 | 0.9583 | 1.0000 |
| Rounded output | 1 | 1 | 3 | 4 | 5 | 6 | 7 | 7 |

For example, the mapping for r=2 is:

~~~text
s = round(7 × 0.375) = round(2.625) = 3
~~~

Multiple input levels may map to the same output level because the output is discrete. The output histogram is therefore not guaranteed to be perfectly uniform.

**Limitation:** equalization can over-enhance noise or change the overall appearance. It is useful to compare the original and equalized images rather than assume the latter is always better.

### 2.4 Histogram specification / matching

Specification maps a source image toward a chosen target histogram.

~~~mermaid
flowchart TD
    A[Source image] --> B[Source PDF and CDF]
    C[Reference image] --> D[Target PDF and CDF]
    B --> E[Map source levels through source CDF]
    D --> F[Find inverse target-CDF mapping]
    E --> G[Match cumulative values]
    F --> G
    G --> H[Specified output image]
~~~

The target need not be uniform. Specification is helpful when images should have a similar tonal distribution, such as a consistent appearance across a sequence.

## 3. Gray-Level Co-occurrence Matrix (GLCM)

A GLCM describes how often gray-level pairs occur at a chosen spatial offset. It is a statistical description of texture.

### 3.1 How the matrix is formed

For quantized gray levels i and j:

- Choose an offset distance d.
- Choose an angle θ.
- For every valid pixel, look at the neighbour at that offset.
- Increment matrix entry P(i,j) for that ordered pair.
- Optionally symmetrize and normalize the matrix.

~~~mermaid
flowchart TD
    A[Grayscale image] --> B[Quantize to fewer levels]
    B --> C[Choose distance d and angle θ]
    C --> D[Count gray-level neighbour pairs]
    D --> E[Build GLCM]
    E --> F[Symmetrize if required]
    F --> G[Normalize to probabilities]
    G --> H[Compute texture features]
~~~

The matrix size is levels × levels. With 256 levels it may be large and sparse, so reducing to 8, 16 or 32 levels is common for a compact descriptor.

### 3.2 Distance and direction

| Offset | What it measures |
|---|---|
| d=1, θ=0° | Immediate horizontal neighbours |
| d=1, θ=45° | Diagonal neighbours in one direction |
| d=1, θ=90° | Vertical neighbours |
| d=1, θ=135° | Opposite diagonal orientation |

A texture can look different when measured in different directions. Compute multiple directional GLCMs and average the features or concatenate them if orientation is important.

### 3.3 Common GLCM features

Let P(i,j) be the normalized GLCM and μ_i, μ_j the marginal means.

| Feature | Formula | Interpretation |
|---|---|---|
| Contrast | Σ(i-j)²P(i,j) | Higher values indicate larger local gray-level differences |
| Dissimilarity | Σ|i-j|P(i,j) | Mean absolute difference between pairs |
| Homogeneity | ΣP(i,j)/(1+|i-j|) | High when probability is near the diagonal |
| Energy / ASM | ΣP(i,j)² | High when the matrix is concentrated |
| Correlation | Σ((i-μ_i)(j-μ_j)P(i,j))/(σ_iσ_j) | Statistical dependence between paired levels |

**Convention note:** this repository labels ΣP(i,j)² as energy (angular second moment). Some libraries report the square root of that quantity as energy, so compare definitions before comparing numeric outputs.

**Memory cues**

- High contrast: neighbours often differ.
- High homogeneity: neighbours are often similar.
- High energy: a few pair types dominate.
- Correlation: whether one gray level tends to predict its neighbour.

### 3.4 GLCM implementation in this repository

The reusable function is glcm_features in src/dip/module2_enhancement.py. It accepts distances, angles and a quantization level count. It returns contrast, dissimilarity, homogeneity, energy and correlation for every requested distance/angle pair.

~~~python
import cv2
from src.dip.module2_enhancement import glcm_features

gray = cv2.imread("data/sample.jpg", cv2.IMREAD_GRAYSCALE)
features = glcm_features(
    gray,
    distances=(1, 2),
    angles=(0, 45, 90, 135),
    levels=16,
)
for offset, values in features.items():
    print(offset, values)
~~~

The implementation symmetrizes its count matrix before normalization. When comparing results with another library, keep quantization, direction, distance, symmetry and normalization settings identical.

## 4. Smoothing and image averaging

Smoothing reduces local intensity variation. It is often used before edge detection or segmentation, but every smoothing method trades noise reduction against loss of detail.

### 4.1 Mean filter

For a k × k window, the mean filter replaces each pixel with the arithmetic average of the neighbourhood:

~~~text
g(x,y) = (1 / k²) × sum of all pixels in the k × k neighbourhood
~~~

For a 3 × 3 filter, every kernel coefficient is 1/9. This is simple and fast, but it blurs edges because values from both sides of an edge are averaged together.

### 4.2 Gaussian filter

A Gaussian filter assigns larger weights to nearby pixels and smaller weights to distant pixels. The standard deviation σ controls the spread of the kernel. Larger σ gives stronger blur.

It is commonly used before gradient-based edge detection because it suppresses high-frequency noise.

### 4.3 Median and order-statistic filters

An order-statistic filter sorts the values in a neighbourhood and selects a rank.

| Filter | Selected value | Typical effect |
|---|---|---|
| Minimum | Smallest | Removes isolated bright specks; erosion-like |
| Maximum | Largest | Removes isolated dark specks; dilation-like |
| Median | Middle value | Effective for salt-and-pepper noise |
| Midpoint | (minimum + maximum)/2 | Uses local extremes; sensitive to outliers |

The median filter is non-linear. It can remove isolated impulse noise while preserving edges better than a mean filter in many cases.

### 4.4 Compare smoothing methods

| Filter | Strength | Main limitation | Good starting use |
|---|---|---|---|
| Mean | Simple general averaging | Blurs boundaries | Mild smoothing |
| Gaussian | Smooth weighted average | Still blurs edges | Pre-processing before gradients |
| Median | Removes impulse spikes | Can remove thin structures | Salt-and-pepper noise |
| Bilateral | Uses spatial and intensity similarity | Slower and parameter-sensitive | Smooth regions while retaining strong edges |
| Image averaging | Cancels independent random noise across aligned captures | Requires multiple aligned images | Repeated low-light or static-scene captures |

### 4.5 Image averaging and noise

For K aligned captures:

~~~text
g(x,y) = (1/K) × sum from k=1 to K of f_k(x,y)
~~~

If the noise in each capture is independent and zero-mean, averaging reduces noise variance from σ² to approximately σ²/K. The standard deviation becomes σ/√K.

This assumes the scene is aligned and static. Object movement, camera movement and correlated noise can produce ghosting or reduce the improvement.

## 5. Edge-preserving smoothing

A bilateral filter uses two kinds of similarity:

1. Spatial proximity: nearby pixels receive more weight.
2. Intensity similarity: pixels with similar intensity receive more weight.

Conceptually:

~~~text
weight = spatial_weight × intensity_similarity_weight
output = weighted average of neighbouring pixels
~~~

This prevents a strong edge from being averaged as aggressively as a flat region. Guided filtering and anisotropic diffusion are additional edge-aware ideas covered in the lecture material; they are not currently exposed as repository functions.

## 6. Low-pass and high-pass filtering

Spatial filters work directly on pixels. Frequency-domain filters work on transform coefficients.

| Filter | Frequency behaviour | Visual result |
|---|---|---|
| Low-pass | Keeps low frequencies and attenuates high frequencies | Smoother image, less fine detail |
| High-pass | Attenuates low frequencies and retains high frequencies | Edges and fine detail emphasized |

An ideal circular low-pass mask can be described as:

~~~text
H(u,v) = 1  when D(u,v) ≤ D0
H(u,v) = 0  otherwise
~~~

The high-pass mask is the complement. Here D is distance from the zero-frequency centre and D0 is the cutoff radius.

A sharp ideal cutoff can produce ringing. Gaussian frequency masks provide a smoother transition.

### 6.1 Sharpening

Unsharp masking extracts a detail layer by subtracting a blurred image from the original:

~~~text
detail = original - blurred
sharpened = original + amount × detail
~~~

A larger amount increases sharpening but can amplify noise and create halos. Laplacian sharpening uses a second-derivative response to emphasize rapid intensity changes.

**Practical order:** denoise first when necessary, then sharpen. Sharpening a noisy image can make noise more prominent.

## 7. Homomorphic filtering

The lecture models an image as the product of illumination and reflectance:

~~~text
I(x,y) = L(x,y) × R(x,y)
~~~

- Illumination L is often slowly varying.
- Reflectance R contains object detail and material changes.

Taking a logarithm changes the product into a sum:

~~~text
log I = log L + log R
~~~

A frequency-domain filter can then attenuate slowly varying illumination components and enhance reflectance detail. After inverse transformation, exponentiate to return to the image domain.

~~~mermaid
flowchart TD
    A[Input image I] --> B[Take logarithm]
    B --> C[Compute DFT]
    C --> D[Apply high-pass / emphasis filter]
    D --> E[Inverse DFT]
    E --> F[Exponentiate]
    F --> G[Normalize and inspect result]
~~~

The repository's homomorphic_filter uses low- and high-frequency gain parameters, a cutoff and a sharpness parameter. It is an educational implementation of the log-frequency model. It does not estimate physical illumination perfectly, and poor parameters can create halos or exaggerated noise.

## 8. Connect theory to repository code

The implementations are in src/dip/module2_enhancement.py.

~~~python
import cv2
from src.dip.module2_enhancement import (
    linear_contrast_stretch,
    nonlinear_contrast_stretch,
    glcm_features,
    mean_filter,
    gaussian_filter,
    median_filter,
    bilateral_smoothing,
    low_pass_filter,
    high_pass_filter,
    sharpen_image,
    homomorphic_filter,
)

image = cv2.imread("data/sample.jpg")
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

stretched = linear_contrast_stretch(gray)
gamma_corrected = nonlinear_contrast_stretch(gray, gamma=0.8)
texture = glcm_features(gray, distances=(1,), angles=(0, 90), levels=16)
median = median_filter(gray, kernel_size=3)
edge_aware = bilateral_smoothing(gray)
low_frequency = low_pass_filter(gray, cutoff=30)
high_frequency = high_pass_filter(gray, cutoff=30)
sharpened = sharpen_image(gray, amount=0.8)
illumination_corrected = homomorphic_filter(gray)
~~~

Related practicals:

~~~bash
python -m examples.practicals.practical_03_image_blurring
python -m examples.practicals.practical_05_image_histogram
python -m examples.practicals.practical_10_linear_contrast_stretching
python -m examples.practicals.practical_11_frequency_domain_filtering
~~~

## 9. Common mistakes

- Equalizing a colour image independently in each RGB channel can shift colours; luminance-channel equalization is often safer.
- Using a large mean kernel can erase thin structures and edges.
- Choosing a median filter for Gaussian noise without comparing a Gaussian filter.
- Comparing GLCMs built with different offsets or gray-level quantization.
- Calling every blur a restoration method; smoothing is usually enhancement/pre-processing unless it is tied to an explicit degradation model.
- Sharpening before denoising and then mistaking amplified noise for texture.
- Interpreting a high-pass result without normalizing it for display.

## 10. Check your understanding

1. If useful input intensities lie between 50 and 170, what output does linear stretching assign to r=110?
2. Why can histogram equalization make noise more visible?
3. What do distance and angle mean in a GLCM?
4. Which filter would you initially test for salt-and-pepper noise, and why?
5. Why does bilateral smoothing preserve strong boundaries better than a mean filter?
6. What happens to an image after an ideal low-pass filter?
7. What is the illumination-reflectance assumption behind homomorphic filtering?

## References

The syllabus places contrast, histogram specification, GLCM, smoothing, image averaging, order-statistic filtering, edge-preserving smoothing, frequency filtering, sharpening and homomorphic filtering in this module. The Module II lecture deck contains the CDF derivation, a 3-bit equalization example, GLCM construction and features, filter comparisons and the homomorphic-filtering workflow.
