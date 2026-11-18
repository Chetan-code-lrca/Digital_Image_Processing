# Module IV — Image Compression

> **Course alignment — CSE2571C:** Fidelity criteria; run-length coding; Huffman coding; LZW; arithmetic coding; JPEG encoder and decoder; vector quantization compression.

Image compression reduces the number of bits required to represent an image. It is important because uncompressed images can require substantial storage and network bandwidth.

## Learning outcomes

You should be able to distinguish lossless and lossy compression, calculate compression and fidelity measures, explain dictionary and statistical coding, trace the JPEG stages, and describe vector quantization.

## 1. Compression pipeline

~~~mermaid
flowchart TD
    A[Input image] --> B[Choose representation / transform]
    B --> C{Compression type}
    C --> D[Lossless coding]
    C --> E[Lossy coding]
    D --> F[RLE / Huffman / LZW / arithmetic]
    E --> G[Transform and quantization]
    E --> H[Vector quantization]
    F --> I[Encoded data]
    G --> I
    H --> I
    I --> J[Storage / transmission]
    J --> K[Decoder]
    K --> L[Reconstructed image]
    L --> M[Fidelity evaluation]
~~~

## 2. Lossless versus lossy compression

| Property | Lossless | Lossy |
|---|---|---|
| Reconstruction | Exact | Approximate |
| Information discarded? | No | Yes, by design |
| Typical methods in this syllabus | RLE, Huffman, LZW, arithmetic coding | JPEG quantization, vector quantization |
| Suitable when | Exact pixel recovery matters | Smaller size is more important than exact equality |

A lossless encoder and decoder should satisfy:

~~~text
decode(encode(image)) = image
~~~

A lossy method instead produces a reconstruction that is judged by visual quality or a distortion metric.

## 3. Fidelity and compression criteria

### 3.1 Compression ratio

~~~text
Compression Ratio (CR) = Original data size / Compressed data size
~~~

A ratio greater than 1 indicates size reduction.

**Worked example**

An uncompressed image occupies 262,144 bytes. The compressed representation occupies 65,536 bytes.

~~~text
CR = 262,144 / 65,536 = 4
~~~

The compressed file is one-quarter of the original size, a 4:1 compression ratio.

### 3.2 Bits per pixel

~~~text
bits per pixel = compressed bits / number of image pixels
~~~

Bpp allows comparisons across image dimensions, though it does not capture visual quality by itself.

### 3.3 Reconstruction error

For reference image I and reconstructed image K:

~~~text
MSE  = (1/N) × Σ(I - K)²
RMSE = sqrt(MSE)
PSNR = 10 × log10(MAX² / MSE) dB
~~~

- Lower MSE and RMSE indicate lower pixel-wise error.
- Higher PSNR generally indicates lower pixel-wise error.
- If reconstruction is exact, MSE=0 and PSNR is infinite.
- These metrics do not fully capture perceptual quality or semantic importance.

## 4. Run-Length Encoding (RLE)

RLE represents repeated consecutive symbols as a value and a run length.

**Example**

~~~text
Input:  A A A A A B B C C C

RLE:    (A,5), (B,2), (C,3)
~~~

### Encoder logic

~~~mermaid
flowchart TD
    A[Read first symbol] --> B[Set run count = 1]
    B --> C{Next symbol same?}
    C -->|Yes| D[Increment run count]
    D --> C
    C -->|No| E[Write symbol and count]
    E --> F{More input?}
    F -->|Yes| G[Start new run]
    G --> C
    F -->|No| H[Write final run]
~~~

**When it works well:** long runs of repeated values, such as simple graphics, masks and some scanned images.

**When it works poorly:** noisy photographs, where adjacent pixels often differ and run metadata can add overhead.

For a 2-D image, the implementation in the repository flattens the array into a sequence before encoding. This is simple for teaching; a real image format must also record dimensions, dtype and scan order.

## 5. Huffman coding

Huffman coding assigns variable-length prefix-free binary codewords based on symbol frequency.

- Frequent symbols receive shorter codes.
- Rare symbols receive longer codes.
- Prefix-free means no codeword is the prefix of another codeword, allowing unambiguous decoding.

### 5.1 Huffman construction

1. Count each symbol's frequency.
2. Create a leaf node for each symbol.
3. Select the two nodes with the smallest frequencies.
4. Join them into a parent node whose frequency is their sum.
5. Repeat until one tree remains.
6. Label left/right branches with 0/1 and read each symbol's code.

~~~mermaid
flowchart TD
    A[Count symbol frequencies] --> B[Create one node per symbol]
    B --> C[Select two least-frequent nodes]
    C --> D[Combine into parent]
    D --> E{One tree left?}
    E -->|No| C
    E -->|Yes| F[Assign 0/1 paths]
    F --> G[Encode symbols]
~~~

### 5.2 Simple example

Suppose the frequencies are A=5, B=2, C=1. One valid Huffman tree gives:

| Symbol | Frequency | Example code |
|---|---:|---|
| A | 5 | 0 |
| B | 2 | 10 |
| C | 1 | 11 |

The encoded length for this example is:

~~~text
5×1 + 2×2 + 1×2 = 11 bits
Average code length = 11/8 = 1.375 bits/symbol
~~~

The exact codes can vary when frequency ties occur, but the prefix-free property remains.

### 5.3 Entropy and average code length

~~~text
H(X) = -Σ p_i log2(p_i)
L_avg = Σ p_i × l_i
~~~

H(X) is the source entropy in bits per symbol. l_i is the code length for symbol i. Huffman coding produces an average length close to the entropy lower bound for a memoryless symbol source, though it cannot always achieve it exactly.

## 6. Lempel-Ziv-Welch (LZW)

LZW is a dictionary-based compression method. Instead of coding each pixel independently, it builds a dictionary of recurring symbol sequences.

### 6.1 Encoder idea

1. Initialize the dictionary with the basic alphabet.
2. Start with an empty current phrase.
3. Extend the phrase while the extended phrase exists in the dictionary.
4. When it does not exist, output the code for the current phrase.
5. Add the new phrase to the dictionary.
6. Continue with the next symbol.

~~~mermaid
flowchart TD
    A[Initialize symbol dictionary] --> B[Read next symbol]
    B --> C[Extend current phrase]
    C --> D{Phrase exists?}
    D -->|Yes| B
    D -->|No| E[Output current phrase code]
    E --> F[Add extended phrase to dictionary]
    F --> G[Set current phrase to new symbol]
    G --> B
~~~

LZW is lossless when encoder and decoder use compatible dictionary initialization and update rules. The repository example uses an initial byte alphabet from 0 to 255, which is suitable for 8-bit grayscale values.

## 7. Arithmetic coding

Arithmetic coding represents a sequence by progressively narrowing a numeric interval.

1. Start with [0,1).
2. Assign a sub-interval to each symbol according to its probability.
3. For each input symbol, replace the current interval with that symbol's sub-interval.
4. After all symbols, any number inside the final interval can identify the sequence when the decoder knows the model and length.

~~~mermaid
flowchart TD
    A[Start interval: 0 to 1] --> B[Build symbol probability ranges]
    B --> C[Read next symbol]
    C --> D[Subdivide current interval]
    D --> E[Keep selected symbol interval]
    E --> F{More symbols?}
    F -->|Yes| C
    F -->|No| G[Transmit a code inside final interval]
~~~

The repository's teaching implementation uses exact rational fractions and stores the final rational code together with the frequency table and sequence length. This makes the interval arithmetic easy to inspect, but it is not a production bitstream format.

## 8. JPEG encoder and decoder

JPEG is a lossy image-compression standard. A common baseline pipeline is:

~~~mermaid
flowchart TD
    A[Colour image] --> B[Convert RGB to YCbCr]
    B --> C[Optional chroma subsampling]
    C --> D[Split into 8×8 blocks]
    D --> E[Level shift]
    E --> F[2-D DCT]
    F --> G[Quantization]
    G --> H[Zigzag coefficient order]
    H --> I[Run-length and entropy coding]
    I --> J[JPEG bitstream]
    J --> K[Entropy decode]
    K --> L[Inverse zigzag]
    L --> M[Dequantize]
    M --> N[Inverse DCT]
    N --> O[Reconstruct blocks and colour image]
~~~

### 8.1 Why each stage exists

| Stage | Purpose |
|---|---|
| RGB to YCbCr | Separates luminance-related and chroma information |
| Chroma subsampling | Uses fewer samples for colour detail when acceptable |
| 8 × 8 blocking | Applies local transforms |
| Level shift | Centres pixel values around zero |
| DCT | Concentrates much energy in low-frequency coefficients |
| Quantization | Discards precision; main lossy stage |
| Zigzag scan | Places low-frequency coefficients earlier and groups high-frequency zeros |
| RLE / entropy coding | Efficiently represents repeated zeros and symbol statistics |

The decoder reverses these steps. Quantization cannot be perfectly reversed because coefficient precision was discarded.

### 8.2 Quality trade-off

Higher JPEG quality usually means finer quantization and a larger file. Lower quality generally yields a smaller file and more visible artifacts such as blocking, ringing and loss of fine texture.

The repository's jpeg_encode and jpeg_decode call OpenCV's JPEG codec. They demonstrate actual encode/decode usage but do not expose the internal JPEG DCT and quantization stages as separate implementation functions.

## 9. Vector quantization

Vector quantization groups blocks or feature vectors around representative codebook vectors.

1. Divide the image into blocks.
2. Flatten each block into a vector.
3. Build a codebook of representative vectors.
4. Assign each block to its nearest codebook vector.
5. Store the codebook and block indices.
6. Reconstruct blocks by looking up the assigned codebook vector.

~~~mermaid
flowchart TD
    A[Image] --> B[Divide into blocks]
    B --> C[Flatten blocks into vectors]
    C --> D[Create codebook / cluster centres]
    C --> E[Find nearest codebook vector]
    D --> E
    E --> F[Store codebook index per block]
    F --> G[Decoder looks up codebook entries]
    G --> H[Reconstruct image blocks]
~~~

A larger codebook can improve reconstruction quality but requires more codebook storage and more index bits. A smaller codebook compresses more aggressively but produces more quantization error.

The repository's vector_quantize function uses a small k-means-style codebook for grayscale blocks. It returns the reconstructed image, codebook and block assignments.

## 10. Compare the syllabus methods

| Method | Coding principle | Lossless? | Best suited for |
|---|---|---:|---|
| RLE | Consecutive repeated symbols | Yes | Long runs |
| Huffman | Symbol frequency | Yes | Skewed symbol distributions |
| LZW | Repeated sequences / dictionary | Yes | Recurring symbol patterns |
| Arithmetic | Probability interval | Yes | Statistical sequence coding |
| JPEG | DCT + quantization + entropy coding | No | Photographic images |
| Vector quantization | Nearest codebook vector | Usually lossy | Block/vector approximation |

## 11. Connect theory to repository code

The implementations are in src/dip/module4_compression.py.

~~~python
import cv2
import numpy as np
from src.dip.module4_compression import (
    run_length_encode, run_length_decode,
    huffman_encode, huffman_decode,
    lzw_encode, lzw_decode,
    arithmetic_encode, arithmetic_decode,
    jpeg_encode, jpeg_decode,
    vector_quantize,
)

gray = cv2.imread("data/sample.jpg", cv2.IMREAD_GRAYSCALE)

runs = run_length_encode(gray)
rle_recovered = run_length_decode(runs, shape=gray.shape, dtype=np.uint8)

codes, bitstream = huffman_encode(gray)
huffman_recovered = huffman_decode(bitstream, codes).astype(np.uint8).reshape(gray.shape)

jpeg_bytes = jpeg_encode(gray, quality=85)
jpeg_recovered = jpeg_decode(jpeg_bytes)

vq_recovered, codebook, block_indices = vector_quantize(
    gray, block_size=4, codebook_size=16
)
~~~

Run the syllabus compression practicals:

~~~bash
python -m examples.practicals.practical_12_run_length_encoding
python -m examples.practicals.practical_13_huffman_coding
~~~

## 12. Common mistakes

- Quoting a compression ratio without saying whether it is bytes, bits or bpp.
- Claiming JPEG is lossless.
- Assuming RLE always compresses: random data can become larger.
- Treating Huffman codewords as fixed-length.
- Forgetting to transmit or reconstruct the Huffman model/dictionary.
- Confusing the DCT transform with JPEG quantization: DCT itself is not the lossy step.
- Comparing image quality using compression ratio alone.
- Assuming the repository's arithmetic-coding demonstration is a production file format.

## 13. Check your understanding

1. When is RLE likely to be effective?
2. Why must Huffman codes be prefix-free?
3. How does LZW exploit recurring patterns?
4. What happens to the arithmetic interval after each symbol?
5. Which JPEG stage discards information?
6. Why is DCT useful before quantization?
7. What is the trade-off when a vector-quantization codebook becomes smaller?
8. Calculate CR if a 1 MiB image is compressed to 256 KiB.

## References

The CSE2571C syllabus lists fidelity criteria, RLE, Huffman, LZW, arithmetic coding, JPEG encoder/decoder and vector quantization. The chapter expands those topics into encoder/decoder workflows, illustrative calculations and fidelity measures.
