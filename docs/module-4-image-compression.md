# Module IV — Image Compression

**Syllabus coverage:** fidelity criteria; run-length coding; Huffman coding; LZW; arithmetic coding; JPEG encoder and decoder; vector quantization compression.

## Topic-to-code map

| Syllabus topic | Implementation |
|---|---|
| Fidelity / reconstruction error | mean_squared_error, root_mean_squared_error in Module III |
| Run-length coding | run_length_encode, run_length_decode |
| Huffman coding | huffman_encode, huffman_decode |
| LZW | lzw_encode, lzw_decode |
| Arithmetic coding | arithmetic_encode, arithmetic_decode |
| JPEG encoder / decoder | jpeg_encode, jpeg_decode |
| Vector quantization | vector_quantize |

## Lossless and lossy compression

- **Lossless:** decoding recovers the original sequence exactly. The repository demonstrates RLE, Huffman, LZW and arithmetic coding.
- **Lossy:** some information is discarded to reduce size. JPEG quantization and block vector quantization are examples.

## Fidelity metrics

~~~text
Compression ratio = original data size / compressed data size
PSNR = 10 log10(MAX^2 / MSE)
~~~

A lower MSE and higher PSNR generally indicate a closer reconstruction. A compression ratio alone does not describe visual quality.

## Important implementation notes

- The RLE and Huffman practicals verify exact round-trip reconstruction.
- LZW uses an initial byte alphabet (0–255), suitable for grayscale pixel data.
- Arithmetic coding uses exact rational interval arithmetic for clarity; it is a teaching implementation, not a production codec.
- JPEG encoding and decoding are delegated to OpenCV's JPEG implementation.
- Vector quantization uses block vectors and a small k-means codebook.

## Run the related practicals

~~~bash
python -m examples.practicals.practical_12_run_length_encoding
python -m examples.practicals.practical_13_huffman_coding
~~~

See [flowcharts](flowcharts.md) for the module workflow.
