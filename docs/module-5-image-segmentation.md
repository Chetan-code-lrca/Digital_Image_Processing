# Module V — Image Segmentation

**Syllabus coverage:** region extraction; pixel-based approach; multilevel thresholding; local thresholding; region-based approach; region growing; splitting; merging; split-and-merge techniques.

## Topic-to-code map

| Syllabus topic | Implementation |
|---|---|
| Pixel-based / global thresholding | global_threshold |
| Otsu thresholding | otsu_threshold |
| Multilevel thresholding | multilevel_threshold |
| Local / adaptive thresholding | local_threshold |
| Region extraction | extract_regions |
| Region growing | region_growing |
| Region splitting and merging | split_and_merge |
| Pixel clustering (practical) | kmeans_segmentation |

## Pixel-based and region-based methods

- Pixel-based methods classify pixels using intensity or colour information. Thresholding is a common example.
- Region-based methods use neighbourhood connectivity and similarity to form spatially connected regions.
- Otsu thresholding chooses a global threshold by maximizing between-class variance.
- Adaptive thresholding computes a threshold from a local neighbourhood.
- Region growing expands from seed pixels that satisfy a similarity condition.
- Split-and-merge recursively splits heterogeneous areas and merges adjacent similar regions.

## Example: Otsu thresholding

~~~python
import cv2
from src.dip.module5_segmentation import otsu_threshold

image = cv2.imread("data/sample.jpg", cv2.IMREAD_GRAYSCALE)
threshold, mask = otsu_threshold(image)
print("Selected threshold:", threshold)
cv2.imwrite("outputs/otsu-mask.png", mask)
~~~

See [flowcharts](flowcharts.md) for the module workflow.
