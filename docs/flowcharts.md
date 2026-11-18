# Digital Image Processing Flowcharts

These flowcharts summarize the processing logic used by the examples in this repository. Mermaid diagrams render directly on GitHub. For full explanations, equations, worked examples and parameter guidance, read the [module learning guides](index.md).

## End-to-end digital image processing workflow

~~~mermaid
flowchart TD
    A[Real-world scene] --> B[Image sensor / acquisition]
    B --> C[Sampling]
    C --> D[Quantization]
    D --> E[Digital image]
    E --> F{Processing objective}
    F --> G[Enhancement]
    F --> H[Restoration]
    F --> I[Compression]
    F --> J[Segmentation]
    G --> K[Analysis / visualization]
    H --> K
    I --> L[Storage / transmission]
    J --> M[Region and feature extraction]
    M --> K
~~~

## Module I — Image representation and transforms

~~~mermaid
flowchart TD
    A[Input image] --> B[Inspect dimensions, channels and data type]
    B --> C[Sampling and quantization]
    C --> D[Colour representation]
    D --> E[Gray-level transformations]
    E --> F[Histogram equalization / specification]
    F --> G[Multi-image operations]
    G --> H[Transforms: DFT, DCT, WHT, Haar, KLT, SVD]
    H --> I[Visualize or analyze coefficients]
~~~

## Module II — Image enhancement

~~~mermaid
flowchart TD
    A[Input image] --> B[Inspect contrast and noise]
    B --> C{Enhancement target}
    C --> D[Contrast stretching / histogram methods]
    C --> E[Smoothing / image averaging]
    C --> F[Sharpening]
    C --> G[Homomorphic filtering]
    D --> H[Enhanced image]
    E --> H
    F --> H
    G --> H
~~~

## Module III — Image restoration

~~~mermaid
flowchart TD
    A[Degraded observation] --> B[Estimate degradation model]
    B --> C[Choose restoration method]
    C --> D[Least-squares restoration]
    C --> E[SVD restoration]
    C --> F[MAP estimation]
    C --> G[Homomorphic restoration]
    C --> H[Geometric distortion correction]
    D --> I[Restored estimate]
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J[Evaluate MSE / RMSE]
~~~

## Module IV — Image compression

~~~mermaid
flowchart TD
    A[Input image] --> B[Choose quality / fidelity requirement]
    B --> C{Compression family}
    C --> D[Lossless]
    C --> E[Lossy]
    D --> F[RLE / Huffman / LZW / Arithmetic]
    E --> G[JPEG transform + quantization]
    E --> H[Vector quantization]
    F --> I[Compressed representation]
    G --> I
    H --> I
    I --> J[Decode]
    J --> K[Measure fidelity and compression ratio]
~~~

## Module V — Image segmentation

~~~mermaid
flowchart TD
    A[Input image] --> B[Pre-process / grayscale]
    B --> C{Segmentation approach}
    C --> D[Pixel-based]
    C --> E[Region-based]
    D --> F[Global / multilevel / local threshold]
    E --> G[Seed and region growing]
    E --> H[Region splitting]
    E --> I[Region merging]
    H --> J[Split-and-merge]
    I --> J
    F --> K[Segment labels / masks]
    G --> K
    J --> K
~~~

## Feature extraction pipeline retained from the original project

~~~mermaid
flowchart LR
    A[Input image] --> B[Colour features]
    A --> C[Texture features]
    A --> D[Shape features]
    B --> E[Normalize / concatenate]
    C --> E
    D --> E
    E --> F[Combined feature vector]
    F --> G[Similarity / classification / retrieval]
~~~
