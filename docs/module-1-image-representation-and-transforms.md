# Module I — Image Presentation and Transform

**Syllabus coverage:** visual perception; colour representation; image capture, representation and storage; gray-level transformations; histogram equalization; multi-image operations; DFT, DCT, Walsh-Hadamard, Haar, Karhunen-Loeve transform and SVD.

## Core ideas

Human visual perception is relevant to digital image processing. The cornea and lens focus light onto the retina; rods are more sensitive in low-light conditions and cones support colour vision and finer detail. Brightness adaptation describes how the visual system adjusts to different illumination levels.

Image capture begins with a sensing device that converts incoming energy into a signal. Digitization then samples spatial coordinates and quantizes intensity values. The resulting pixel matrix can be stored, displayed, processed, or transmitted.

A digital image is a discrete two-dimensional signal. Spatial sampling determines the number of pixel locations, while quantization maps measured intensity to a finite set of values. For an 8-bit grayscale image, there are 256 possible gray levels.

## Topic-to-code map

| Syllabus topic | Implementation |
|---|---|
| Image information / representation | image_information in src/dip/module1_representation.py |
| Sampling and quantization | sample_and_quantize |
| Colour representation: HSV, HSI, YCbCr, CMYK | convert_colour_models |
| Gray-level transformations | gray_negative, log_transform, inverse_log_transform, gamma_transform, piecewise_linear_transform, gray_level_slicing, threshold_image |
| Histogram equalization | histogram_equalization |
| Histogram specification | histogram_specification |
| Multi-image operations | multi_image_operations |
| Discrete Fourier transform | dft_magnitude |
| Discrete cosine transform | dct_transform, dct_inverse |
| Walsh-Hadamard transform | walsh_hadamard_transform |
| Haar transform | haar_transform |
| Karhunen-Loeve transform | klt_transform |
| Singular value decomposition | svd_low_rank |

## Important interpretation notes

- Sampling changes spatial detail; quantization changes the number of available intensity levels.
- DFT represents spatial frequencies; DCT uses cosine basis functions and is important in JPEG.
- Haar transform produces approximation and detail sub-bands in a simple wavelet decomposition.
- KLT is data-dependent and uses covariance eigenvectors.
- SVD factorizes an image matrix and supports low-rank approximation.

## Run the related practicals

~~~bash
python -m examples.practicals.practical_01_rgb_to_grayscale
python -m examples.practicals.practical_07_colour_models
python -m examples.practicals.practical_08_gray_level_transformations
python -m examples.practicals.practical_09_image_transforms
~~~

See [flowcharts](flowcharts.md) for the module workflow.
