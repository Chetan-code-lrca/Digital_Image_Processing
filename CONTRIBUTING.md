# Contributing

Thank you for helping improve this Digital Image Processing learning repository.

## Development setup

~~~bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
~~~

On Windows PowerShell, activate with .venv\\Scripts\\Activate.ps1.

## Contribution guidelines

1. Keep each algorithm focused and readable.
2. Add a short docstring describing inputs, outputs, and assumptions.
3. Explain whether an algorithm is lossless or lossy where relevant.
4. Add or update tests for normal inputs and invalid inputs.
5. Keep practical examples runnable from the repository root.
6. Do not commit private datasets, generated output images, credentials, or large binaries.
7. Note parameter sensitivity, limitations, and any optional dependencies.

## Validation

Run:

~~~bash
python -m pytest -v
~~~

For a practical script, run its module command from the root directory and verify that output is saved under outputs/practicals/.

## Scope

The project follows five broad areas of a Digital Image Processing syllabus: image presentation and transforms, enhancement, restoration, compression, and segmentation. Improvements to the original colour, texture, shape and feature-fusion examples are also welcome.
