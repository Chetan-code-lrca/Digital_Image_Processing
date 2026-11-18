# Module III — Image Restoration

**Syllabus coverage:** mean-square-error restoration; least-square-error restoration; restoration by SVD; maximum a posteriori estimation; homomorphic filtering; distortion models and parameter ranges; filtering procedures and related problems.

## Topic-to-code map

| Syllabus topic | Implementation |
|---|---|
| Mean squared error | mean_squared_error |
| Root mean squared error | root_mean_squared_error |
| Least-squares fitting | least_squares_line |
| Regularized least-squares restoration | least_squares_restore |
| SVD restoration | svd_restore |
| MAP restoration | map_restore |
| Homomorphic restoration | homomorphic_restore |
| Lens distortion model | apply_lens_distortion |

## Degradation model

A common observation model is:

~~~text
g(x, y) = h(x, y) * f(x, y) + n(x, y)
~~~

Here, f is the original image, h is the blur/degradation function, n is noise, and g is the observed image. Restoration estimates f from g and an assumed or estimated degradation model.

## Important implementation assumptions

- The least-squares and MAP routines use a known point-spread function (PSF) and a smoothness regularizer in the frequency domain.
- MAP uses a simplified Gaussian noise / prior model; it is not a universal MAP solver for arbitrary priors.
- SVD restoration uses truncated singular values as a simple denoising/low-rank approximation.
- The lens-distortion function illustrates radial (k1, k2) and tangential (p1, p2) remapping. Coefficients must be calibrated for a real camera.

## Example

~~~python
import cv2
import numpy as np
from src.dip.module3_restoration import least_squares_restore, mean_squared_error

image = cv2.imread("data/sample.jpg", cv2.IMREAD_GRAYSCALE)
psf = np.ones((5, 5), dtype=np.float32) / 25
blurred = cv2.filter2D(image, -1, psf)
restored = least_squares_restore(blurred, psf, regularization=0.02)
print("Restoration MSE:", mean_squared_error(image, restored))
~~~

See [flowcharts](flowcharts.md) for the module workflow.
