# Module III — Image Restoration

**Syllabus coverage:** mean-square-error restoration; least-square-error restoration; restoration by SVD; maximum a posteriori estimation; homomorphic filtering; distortion models and parameter ranges; filtering procedures and related problems.

## Topic-to-code map

| Syllabus topic | Implementation |
|---|---|
| Mean squared error | mean_squared_error |
| Root mean squared error | root_mean_squared_error |
| Peak signal-to-noise ratio | peak_signal_to_noise_ratio |
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

## Distortion parameters and filtering procedure

The radial model uses k1 and k2 coefficients, while p1 and p2 represent tangential terms in normalized image coordinates. There is no universal numeric range for these coefficients: meaningful ranges depend on the camera, lens, calibration data, and coordinate normalization. Start with small coefficients for demonstrations and estimate real parameters from calibration images rather than treating example values as physical limits.

A practical restoration procedure is: (1) inspect the degradation, (2) estimate or measure the point-spread function (PSF) and noise model, (3) select a restoration filter, (4) apply the filter, and (5) evaluate the result using MSE/RMSE and visual inspection. Common problems include an unknown PSF, amplified noise, ringing, boundary artifacts, and over-smoothing.

## Important implementation assumptions

- The least-squares and MAP routines use a known point-spread function (PSF) and a smoothness regularizer in the frequency domain.
- MAP uses a simplified Gaussian noise / prior model; it is not a universal MAP solver for arbitrary priors.
- SVD restoration uses truncated singular values as a simple denoising/low-rank approximation.
- The lens-distortion function illustrates radial (k1, k2) and tangential (p1, p2) remapping. Coefficients must be calibrated for a real camera.

## Example

~~~python
import cv2
import numpy as np
from src.dip.module3_restoration import least_squares_restore, mean_squared_error, peak_signal_to_noise_ratio

image = cv2.imread("data/sample.jpg", cv2.IMREAD_GRAYSCALE)
psf = np.ones((5, 5), dtype=np.float32) / 25
blurred = cv2.filter2D(image, -1, psf)
restored = least_squares_restore(blurred, psf, regularization=0.02)
print("Restoration MSE:", mean_squared_error(image, restored))
print("Restoration PSNR:", peak_signal_to_noise_ratio(image, restored), "dB")
~~~

See [flowcharts](flowcharts.md) for the module workflow.
