# Module V — Image Segmentation

> **Course alignment — CSE2571C:** Region extraction; pixel-based approach; multilevel thresholding; local thresholding; region-based approach; growing; splitting; merging; split-and-merge techniques. The practical list also includes Otsu's method and K-Means segmentation.

Image segmentation divides an image into regions or objects that are meaningful for a later task. It is often a bridge between low-level image processing and higher-level analysis.

Examples include separating a document foreground from its background, extracting an object from a scene, locating a tissue region in a scan, or dividing a satellite image into land-cover areas.

## Learning outcomes

You should be able to distinguish pixel-based and region-based approaches, explain global/Otsu/multilevel/local thresholding, extract connected regions, describe seed-based region growing, and explain region splitting and merging.

## 1. Segmentation pipeline

~~~mermaid
flowchart TD
    A[Input image] --> B[Pre-processing / grayscale]
    B --> C{Segmentation family}
    C --> D[Pixel-based classification]
    C --> E[Region-based grouping]
    D --> F[Global threshold]
    D --> G[Otsu threshold]
    D --> H[Multilevel threshold]
    D --> I[Local threshold]
    E --> J[Connected components]
    E --> K[Region growing]
    E --> L[Split and merge]
    F --> M[Label image / mask]
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    M --> N[Measure / describe regions]
~~~

## 2. What is a segment?

A segment is a connected set of pixels that satisfies a chosen criterion. A segmentation algorithm produces a label image or a binary mask.

- A binary mask uses two labels, often 0 for background and 255 for foreground.
- A multi-class label image uses one label per region/class.
- A region can later be measured by area, bounding box, centroid, shape or intensity statistics.

**Segmentation quality depends on the task.** A useful segmentation for document OCR is not necessarily appropriate for medical-image measurement.

## 3. Pixel-based approaches

Pixel-based methods classify pixels according to an intensity, colour or feature rule. Each pixel can be classified without first building a larger region.

### 3.1 Global thresholding

A global threshold T is applied to the whole image:

~~~text
g(x,y) = 255, if f(x,y) ≥ T
g(x,y) =   0, otherwise
~~~

It works well when foreground and background intensities are reasonably separated and illumination is fairly uniform.

**Weakness:** one threshold may fail if different parts of the image have different lighting or overlapping intensity distributions.

### 3.2 Otsu's thresholding

Otsu automatically selects a global threshold by considering the histogram. For a candidate threshold T, the pixels are divided into two classes.

Let:

- ω0 and ω1 be the class probabilities.
- μ0 and μ1 be the class means.

Between-class variance is:

~~~text
σ_B²(T) = ω0(T) × ω1(T) × [μ0(T) - μ1(T)]²
~~~

Choose the threshold that maximizes this variance.

~~~mermaid
flowchart TD
    A[Grayscale image] --> B[Compute histogram]
    B --> C[Try candidate thresholds]
    C --> D[Split pixels into two classes]
    D --> E[Compute class weights and means]
    E --> F[Compute between-class variance]
    F --> G{All thresholds checked?}
    G -->|No| C
    G -->|Yes| H[Choose threshold with maximum variance]
    H --> I[Create binary mask]
~~~

**Assumption:** the image histogram should provide a meaningful separation between the two classes. Otsu can struggle with complex multi-object scenes, heavy noise or strongly non-uniform illumination.

### 3.3 Multilevel thresholding

Instead of one threshold, select several thresholds:

~~~text
T1 < T2 < ... < Tk
~~~

Pixels are assigned to intensity classes according to the interval in which their values fall. For example, two thresholds divide an image into three classes.

Multi-Otsu selects thresholds by optimizing class separation. It is useful when a scene contains multiple intensity groups rather than one foreground/background pair.

### 3.4 Local / adaptive thresholding

When illumination varies spatially, compute a threshold from a local neighbourhood.

An adaptive mean threshold can be expressed as:

~~~text
T(x,y) = local_mean(x,y) - C
~~~

C is an offset parameter. The pixel is then compared with its local threshold. Other adaptive methods use a local weighted mean, such as a Gaussian-weighted average.

| Method | Threshold source | Suitable situation |
|---|---|---|
| Global fixed | One user-specified T | Uniform lighting and separated classes |
| Otsu | Histogram-based global selection | Two dominant intensity groups |
| Multilevel Otsu | Several global thresholds | Several intensity classes |
| Adaptive/local | Local neighbourhood | Uneven illumination |

## 4. K-Means segmentation

K-Means is a clustering algorithm often used for pixel segmentation. Each pixel is represented by a feature vector, such as grayscale intensity or an RGB colour vector.

### Algorithm

1. Choose K cluster centres.
2. Assign each pixel to its nearest centre.
3. Recompute each centre as the mean of assigned pixels.
4. Repeat until assignments or centres stabilize.

~~~mermaid
flowchart TD
    A[Build pixel feature vectors] --> B[Choose K initial centres]
    B --> C[Assign each pixel to nearest centre]
    C --> D[Recompute cluster means]
    D --> E{Centres stable?}
    E -->|No| C
    E -->|Yes| F[Reshape labels into image]
    F --> G[Segmented output]
~~~

**Important choices**

- K determines the number of clusters.
- Features determine what “similar” means.
- Intensity-only K-Means groups by brightness.
- Colour K-Means groups by channel values.
- Adding spatial coordinates can encourage spatially coherent regions, but changes the feature space and distance scale.

**Limitations:** K must be chosen; results can depend on initialization; clusters do not automatically correspond to semantic objects; and plain K-Means ignores spatial adjacency unless coordinates are included.

The repository's kmeans_segmentation clusters pixel intensities or colour vectors and returns label and segmented images.

## 5. Region-based approaches

Region-based methods use both pixel similarity and spatial connectivity. A region is formed by connected neighbouring pixels that satisfy a homogeneity rule.

### 5.1 Region extraction and connected components

Given a binary image, connected-component labelling assigns a label to every connected foreground group.

Two common neighbourhood definitions are:

~~~text
4-connectivity: up, down, left, right

8-connectivity: 4-connectivity plus the four diagonals
~~~

~~~mermaid
flowchart TD
    A[Binary mask] --> B[Choose 4- or 8-connectivity]
    B --> C[Scan unlabelled foreground pixels]
    C --> D[Follow connected neighbours]
    D --> E[Assign one component label]
    E --> F[Continue until all foreground pixels labelled]
    F --> G[Region count, stats and centroids]
~~~

The repository's extract_regions returns the number of foreground components, a label image, component statistics and centroids. Statistics include bounding-box and area information from OpenCV.

### 5.2 Region growing

Region growing starts from one or more seed pixels and adds neighbouring pixels that satisfy a similarity criterion.

A simple intensity rule is:

~~~text
Include pixel p if |I(p) - I(seed)| ≤ tolerance
~~~

~~~mermaid
flowchart TD
    A[Choose seed pixel] --> B[Add seed to queue]
    B --> C[Read next queued pixel]
    C --> D{Within similarity tolerance?}
    D -->|No| E[Reject pixel]
    D -->|Yes| F[Add pixel to region]
    F --> G[Queue unvisited neighbours]
    E --> H{Queue empty?}
    G --> H
    H -->|No| C
    H -->|Yes| I[Return region mask]
~~~

**Seed selection matters.** A poor seed can grow into the wrong region. A high tolerance may cause leakage across boundaries; a low tolerance may leave holes or fragment the object.

The repository's region_growing uses a fixed seed-intensity tolerance and supports 4- or 8-connectivity. It compares each candidate against the seed intensity, not the evolving region mean.

## 6. Region splitting and merging

Split-and-merge is a region-based strategy for images where one global homogeneity criterion is insufficient.

### 6.1 Splitting

- Start with the whole image as one region.
- Check a homogeneity test, such as intensity variance.
- If the region is not homogeneous, divide it into smaller subregions.
- Repeat until each region satisfies the test or reaches a minimum size.

A quadtree split divides a rectangular region into four subregions when its dimensions permit.

### 6.2 Merging

- Examine adjacent regions.
- Compare their means or another similarity measure.
- Merge neighbouring regions when their difference is below a selected threshold.
- Update region labels.

~~~mermaid
flowchart TD
    A[Whole image region] --> B[Compute region homogeneity]
    B --> C{Homogeneous enough?}
    C -->|No| D[Split into subregions]
    D --> B
    C -->|Yes| E[Create initial region labels]
    E --> F[Find adjacent region pairs]
    F --> G{Similar enough to merge?}
    G -->|Yes| H[Merge and update labels]
    G -->|No| I[Keep separate]
    H --> J{More adjacent pairs?}
    I --> J
    J -->|Yes| F
    J -->|No| K[Final region map]
~~~

The repository separates these operations:

- region_split performs a quadtree-style variance split.
- region_merge merges adjacent regions whose grayscale means are sufficiently similar.
- split_and_merge runs both steps.

This is a clear educational implementation. More advanced split-and-merge systems may use richer homogeneity tests, region shape constraints and repeated merge passes.

## 7. Compare pixel-based and region-based approaches

| Aspect | Pixel-based | Region-based |
|---|---|---|
| Basic decision | Classify each pixel | Group connected pixels |
| Typical examples | Global, Otsu, adaptive thresholding | Region growing, split-and-merge |
| Spatial connectivity | Not always used | Essential |
| Strength | Simple and efficient | Produces spatially connected regions |
| Weakness | Can create isolated pixels or fragmented masks | More parameters and connectivity decisions |
| Main parameters | Threshold, number of levels, local window | Seed, tolerance, homogeneity, minimum size |

## 8. Practical segmentation choices

| Image condition | First method to test | Why |
|---|---|---|
| Foreground and background have two clear intensity groups | Otsu | Automatically chooses a global threshold |
| Several distinct intensity classes | Multilevel thresholding | Creates more than two classes |
| Uneven background illumination | Adaptive threshold | Threshold follows local intensity |
| Similar pixels need to be grouped into K classes | K-Means | Clusters feature vectors |
| One known seed lies inside the target | Region growing | Expands from a seed using local connectivity |
| Regions need to be subdivided and recombined | Split-and-merge | Alternates homogeneity-based splitting and adjacency-based merging |

## 9. Connect theory to repository code

The implementations are in src/dip/module5_segmentation.py.

~~~python
import cv2
from src.dip.module5_segmentation import (
    global_threshold,
    otsu_threshold,
    multilevel_threshold,
    local_threshold,
    extract_regions,
    region_growing,
    kmeans_segmentation,
    region_split,
    region_merge,
    split_and_merge,
)

gray = cv2.imread("data/sample.jpg", cv2.IMREAD_GRAYSCALE)

binary = global_threshold(gray, threshold=127)
otsu_value, otsu_mask = otsu_threshold(gray)
levels, multi_labels = multilevel_threshold(gray, classes=3)
adaptive = local_threshold(gray, block_size=11, constant=2)

count, components, stats, centroids = extract_regions(otsu_mask)
grown = region_growing(gray, seed=(50, 50), tolerance=12, connectivity=4)
cluster_labels, clustered = kmeans_segmentation(gray, clusters=3)

initial_regions = region_split(gray, variance_limit=100, min_size=8)
merged_regions = region_merge(gray, initial_regions, merge_threshold=8)
final_regions = split_and_merge(gray, variance_limit=100, merge_threshold=8)
~~~

Run the segmentation practical:

~~~bash
python -m examples.practicals.practical_14_image_segmentation
~~~

## 10. Common mistakes

- Assuming Otsu will work on every image; it is still a global threshold.
- Using a local threshold window that is too small or too large.
- Forgetting that changing K changes the interpretation of K-Means output.
- Treating cluster labels as semantic object identities.
- Choosing 4-connectivity when diagonal contact should join components, or 8-connectivity when it should not.
- Selecting a region-growing seed on a boundary.
- Setting region-growing tolerance so high that the region leaks.
- Merging regions only because their means are similar without checking adjacency.

## 11. Check your understanding

1. What is the difference between a binary mask and a label image?
2. How does Otsu choose a threshold?
3. Why can adaptive thresholding handle uneven illumination better than one global threshold?
4. What does K represent in K-Means?
5. What is the difference between 4-connectivity and 8-connectivity?
6. What information does region growing need before it starts?
7. What is the purpose of splitting before merging?
8. Which parameter can cause region-growing leakage?

## References

The CSE2571C syllabus specifies region extraction, pixel-based segmentation, multilevel/local thresholding, region-based methods, growing, splitting, merging and split-and-merge. The practical list specifically asks for Otsu's method and K-Means, so both are included in the code and learning path.
