# Digital Image Processing — Learning Guide

**Interactive preparation workspace:** [DIP Studio](dip-studio.md) — notes, quizzes, flashcards, planner, comparisons and Python/OpenCV code lab.

This documentation is the theory companion to the Python implementations in this repository. Each module guide is intended to be read as a lesson, not just as a topic index.

## Start here

1. [Module I — Image Presentation and Transform](module-1-image-representation-and-transforms.md)  
   Image formation, visual perception, sampling, quantization, colour models, gray-level transforms, histograms, multi-image operations and six transforms.

2. [Module II — Image Enhancement](module-2-image-enhancement.md)  
   Contrast, histogram methods, GLCM texture, smoothing, order-statistic filters, edge-preserving smoothing, frequency filtering, sharpening and homomorphic filtering.

3. [Module III — Image Restoration](module-3-image-restoration.md)  
   Degradation models, MSE/RMSE/PSNR, least-squares, SVD, MAP, homomorphic restoration and lens distortion.

4. [Module IV — Image Compression](module-4-image-compression.md)  
   Fidelity criteria, lossless and lossy methods, RLE, Huffman, LZW, arithmetic coding, JPEG and vector quantization.

5. [Module V — Image Segmentation](module-5-image-segmentation.md)  
   Pixel-based and region-based methods, Otsu, multilevel/local thresholding, K-Means, connected regions, growing, splitting and merging.

## Visual reference

- [Module flowcharts and algorithm diagrams](flowcharts.md)
- [Repository discovery and GitHub topics](repository-discovery.md)

## How to study each module

- Read the concept and formula before looking at the code.
- Trace the Mermaid flowchart to understand the processing sequence.
- Work through the numerical example by hand.
- Run the linked practical and inspect the generated output.
- Change one parameter at a time and record what changes.
- Answer the self-check questions without looking at the page.

## Code layout

Reusable algorithms are under src/dip/. Syllabus practicals are separate modules under examples/practicals/. Tests are under tests/.
