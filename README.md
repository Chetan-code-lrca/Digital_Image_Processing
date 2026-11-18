# Digital Image Processing (DIP) with Python and OpenCV

A practical, beginner-friendly **Digital Image Processing (DIP) lab using Python, OpenCV and NumPy**. The repository follows a five-module university DIP syllabus and provides explanations, reusable implementations, visual flowcharts, and 16 runnable image-processing practicals.

Learn and implement **image representation, colour models, gray-level transformations, histogram equalization, DFT, DCT, Walsh-Hadamard, Haar, KLT, SVD, image enhancement, image restoration, image compression, and image segmentation**.

> This repository expands the original low-level image feature extraction project. The existing colour, texture, shape, and feature-fusion examples remain available alongside the complete DIP learning path.

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python" alt="Python 3.10 or newer">
  <img src="https://img.shields.io/badge/OpenCV-image%20processing-green?logo=opencv" alt="OpenCV">
  <img src="https://img.shields.io/badge/Modules-5-purple" alt="Five DIP modules">
  <img src="https://img.shields.io/badge/Practicals-16-orange" alt="Sixteen practical examples">
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" alt="MIT license">
</p>

## Interactive DIP preparation workspace

**DIP Studio** is the interactive companion app included in this repository. It gives learners one place to study, revise and plan:

- Topic-based notes and formulas across all five course modules
- 20 multiple-choice quiz questions with explanations
- 21 active-recall flashcards
- A seven-day study planner and personal study sessions
- Side-by-side comparisons of commonly confused methods
- Python/OpenCV code snippets and a link to the complete implementation

**[Open the DIP Studio setup guide](docs/dip-studio.md)** for local run and deployment instructions. The app is built with Next.js and is designed for Vercel deployment.

> Progress is saved locally in the current browser. JSON export/import is available; account-based cloud sync is not part of this first release.

## What you can learn

- **Digital Image Processing fundamentals:** pixels, image representation, sampling, quantization, visual perception, image capture and storage.
- **Image enhancement:** contrast stretching, histogram methods, GLCM texture statistics, smoothing, noise reduction, sharpening, frequency filters and homomorphic filtering.
- **Image restoration:** MSE, RMSE, least-squares restoration, SVD, MAP estimation and lens-distortion models.
- **Image compression:** RLE, Huffman coding, LZW, arithmetic coding, JPEG encoding/decoding and vector quantization.
- **Image segmentation:** global, Otsu, multilevel and local thresholding; region extraction; region growing; splitting, merging and split-and-merge.
- **Low-level feature extraction:** colour, texture and shape descriptors with feature fusion.

## Digital Image Processing workflow

~~~mermaid
flowchart TD
    A[Real-world scene] --> B[Image acquisition]
    B --> C[Sampling]
    C --> D[Quantization]
    D --> E[Digital image]
    E --> F{Processing task}
    F --> G[Enhancement]
    F --> H[Restoration]
    F --> I[Compression]
    F --> J[Segmentation]
    G --> K[Image analysis]
    H --> K
    I --> L[Storage and transmission]
    J --> M[Regions and features]
    M --> K
~~~

See the **[complete learning guide](docs/index.md)** for the expanded lessons, worked equations, comparisons, self-check questions and module-specific diagrams. The [flowchart collection](docs/flowcharts.md) provides a separate visual overview.

## Detailed theory guides

The module pages are full lessons rather than short topic summaries. Each includes concept explanations, equations, comparison tables, Mermaid diagrams, worked examples, links to related code, common mistakes and self-check questions. Start at the [learning guide index](docs/index.md).

## Syllabus coverage: all five modules

| Module | Topics covered | Learning guide |
|---|---|---|
| I. Image presentation and transform | Visual perception, colour representation, acquisition, storage, gray-level transforms, histogram equalization/specification, multi-image operations, DFT, DCT, Walsh-Hadamard, Haar, KLT, SVD | [Module I](docs/module-1-image-representation-and-transforms.md) |
| II. Image enhancement | Contrast intensification, linear/non-linear stretching, histogram specification, GLCM, smoothing, averaging, mean/order-statistic filters, edge-preserving smoothing, low/high-pass filtering, sharpening, homomorphic filtering | [Module II](docs/module-2-image-enhancement.md) |
| III. Image restoration | MSE, RMSE, least-squares, SVD restoration, MAP estimation, homomorphic restoration, distortion models and filtering | [Module III](docs/module-3-image-restoration.md) |
| IV. Image compression | Fidelity criteria, RLE, Huffman, LZW, arithmetic coding, JPEG encoder/decoder, vector quantization | [Module IV](docs/module-4-image-compression.md) |
| V. Image segmentation | Region extraction, pixel-based methods, multilevel/local thresholding, region-based methods, growing, splitting, merging, split-and-merge | [Module V](docs/module-5-image-segmentation.md) |

## Quick start

The repository contains both the Python DIP lab and the interactive Next.js preparation workspace. For the web app, see [DIP Studio](docs/dip-studio.md).


### 1. Clone the repository

~~~bash
git clone https://github.com/Chetan-code-lrca/Digital_Image_Processing.git
cd Digital_Image_Processing
~~~

### 2. Create a virtual environment

~~~bash
python -m venv .venv
~~~

Activate it:

**Linux / macOS / WSL**

~~~bash
source .venv/bin/activate
~~~

**Windows PowerShell**

~~~powershell
.venv\Scripts\Activate.ps1
~~~

### 3. Install dependencies

~~~bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
~~~

### 4. Run a practical

For example, run RGB-to-grayscale conversion:

~~~bash
python -m examples.practicals.practical_01_rgb_to_grayscale
~~~

The examples generate a deterministic sample image when no input image is present. Results are written under **outputs/practicals/**. You can replace the generated sample with your own image for experiments.

## 16 runnable DIP practicals

Each experiment has a separate Python file. Run commands from the repository root.

| No. | Practical / experiment | Python command |
|---:|---|---|
| 01 | RGB to grayscale conversion | `python -m examples.practicals.practical_01_rgb_to_grayscale` |
| 02 | Image resizing and interpolation | `python -m examples.practicals.practical_02_resize_image` |
| 03 | Image blurring and Gaussian smoothing | `python -m examples.practicals.practical_03_image_blurring` |
| 04 | Edge detection using Canny | `python -m examples.practicals.practical_04_edge_detection` |
| 05 | Image histogram | `python -m examples.practicals.practical_05_image_histogram` |
| 06 | Image rotation | `python -m examples.practicals.practical_06_image_rotation` |
| 07 | HSV, HSI, YCbCr and CMYK colour models | `python -m examples.practicals.practical_07_colour_models` |
| 08 | Gray-level transformations | `python -m examples.practicals.practical_08_gray_level_transformations` |
| 09 | DFT, DCT, Hadamard and Haar transforms | `python -m examples.practicals.practical_09_image_transforms` |
| 10 | Linear contrast stretching | `python -m examples.practicals.practical_10_linear_contrast_stretching` |
| 11 | Frequency-domain low-pass and high-pass filters | `python -m examples.practicals.practical_11_frequency_domain_filtering` |
| 12 | Run-length encoding | `python -m examples.practicals.practical_12_run_length_encoding` |
| 13 | Huffman coding | `python -m examples.practicals.practical_13_huffman_coding` |
| 14 | Otsu and K-Means image segmentation | `python -m examples.practicals.practical_14_image_segmentation` |
| 15 | Image merging and alpha blending | `python -m examples.practicals.practical_15_image_merging_blending` |
| 16 | Colour-channel and spatial image splitting | `python -m examples.practicals.practical_16_image_splitting` |

## Reusable algorithm implementations

The implementations are organized by syllabus module under **src/dip/**.

| File | Main functions |
|---|---|
| `module1_representation.py` | Sampling/quantization, colour models, negative/log/inverse-log/gamma, piecewise mapping, gray-level slicing, histogram equalization/specification, multi-image operations, DFT, DCT, Walsh-Hadamard, Haar, KLT, SVD |
| `module2_enhancement.py` | Linear/nonlinear contrast, GLCM, mean/Gaussian/median/order-statistic filters, image averaging, bilateral smoothing, low/high-pass filtering, sharpening, homomorphic filtering |
| `module3_restoration.py` | MSE/RMSE/PSNR, least-squares fitting/restoration, SVD restoration, MAP restoration, homomorphic restoration, radial/tangential distortion |
| `module4_compression.py` | RLE, Huffman, LZW, arithmetic coding, JPEG encode/decode, vector quantization |
| `module5_segmentation.py` | Global/Otsu/multilevel/local thresholding, region extraction, region growing, region splitting/merging, K-Means, split-and-merge |

Example: use the same functions in your own Python script.

~~~python
import cv2
from src.dip.module2_enhancement import linear_contrast_stretch, bilateral_smoothing

image = cv2.imread("data/sample.jpg")
enhanced = linear_contrast_stretch(image)
smoothed = bilateral_smoothing(image)

cv2.imwrite("outputs/enhanced.png", enhanced)
cv2.imwrite("outputs/smoothed.png", smoothed)
~~~

## Original low-level image feature extraction project

The original feature-extraction work is preserved:

- **Colour features:** RGB/HSV representations, colour histograms and channel statistics.
- **Texture features:** grayscale statistics and histograms.
- **Shape features:** thresholding, Canny edges, contours, area and perimeter.
- **Feature fusion:** combine colour, texture and shape measurements into a feature vector.

Run the original examples:

~~~bash
python -m examples.colour.colour_features
python -m examples.texture.texture_features
python -m examples.shape.shape_features
python -m examples.fusion.feature_fusion
~~~

Read the longer [feature extraction article](article/README.md).

## Repository structure

~~~text
Digital_Image_Processing/
├── article/                   # Original feature-extraction learning articles
├── data/                      # Sample data / generated sample image
├── docs/
│   ├── flowcharts.md           # Mermaid learning and algorithm flowcharts
│   ├── module-1-...md          # Module I notes and code map
│   ├── module-2-...md          # Module II notes and code map
│   ├── module-3-...md          # Module III notes and code map
│   ├── module-4-...md          # Module IV notes and code map
│   ├── module-5-...md          # Module V notes and code map
│   └── repository-discovery.md # Suggested GitHub search metadata
├── examples/
│   ├── colour/                 # Original colour feature example
│   ├── texture/                # Original texture feature example
│   ├── shape/                  # Original shape feature example
│   ├── fusion/                 # Original feature-fusion example
│   └── practicals/             # 16 individual syllabus practicals
├── src/
│   ├── colour/                 # Original colour feature functions
│   ├── texture/                # Original texture feature functions
│   ├── shape/                  # Original shape feature functions
│   ├── fusion/                 # Original feature-fusion function
│   └── dip/                    # Five-module DIP implementations
└── tests/                      # Automated tests for core functions
~~~

## Run the test suite

~~~bash
python -m pytest -v
~~~

A GitHub Actions workflow runs the tests on pushes and pull requests to the main branch.

## Learning path

1. Start with **Module I** to understand how images are represented and transformed.
2. Continue with **Module II** to improve contrast, reduce noise and sharpen details.
3. Study **Module III** to understand degradation models and restoration quality.
4. Learn **Module IV** to compare lossless and lossy image compression.
5. Finish with **Module V** to separate objects and regions from images.
6. Run the 16 practical scripts and modify parameters to observe how outputs change.

## Intended audience

This open-source Digital Image Processing Python project is intended for undergraduate computer science students, computer vision beginners, engineering labs, self-learners, and contributors who want to understand classical image-processing algorithms through readable code.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md), keep examples reproducible, add tests for new algorithms, and document assumptions or limitations.

## SEO and repository discovery

This project is organized around the actual topics learners search for: **Digital Image Processing Python, DIP practicals, OpenCV image processing, image enhancement, image restoration, image compression, image segmentation, histogram equalization, DFT, DCT, GLCM, JPEG, Huffman coding, and computer vision**.

For the recommended GitHub repository description, topics, and discovery settings, see [Repository discovery and search setup](docs/repository-discovery.md).

Search engines decide independently whether and when to index a page. Clear documentation improves discoverability but does not guarantee a particular search position.

## References

- B. Chandra and D. Majumder, *Digital Image Processing and Analysis*.
- Anil K. Jain, *Fundamentals of Digital Image Processing*.
- [OpenCV documentation](https://docs.opencv.org/)
- [scikit-image documentation](https://scikit-image.org/docs/stable/)
- [NumPy documentation](https://numpy.org/doc/)

## License

MIT — see [LICENSE](LICENSE).
