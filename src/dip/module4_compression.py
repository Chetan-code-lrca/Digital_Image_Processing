"""Module IV: lossless/lossy image compression demonstrations."""
from collections import Counter
from fractions import Fraction
import heapq
import itertools

import cv2
import numpy as np

from src.dip.image_utils import to_uint8


def run_length_encode(data):
    """Encode a sequence as (symbol, run_length) pairs."""
    values = np.asarray(data).ravel().tolist()
    if not values:
        return []
    runs = []
    current, count = values[0], 1
    for value in values[1:]:
        if value == current:
            count += 1
        else:
            runs.append((current, count))
            current, count = value, 1
    runs.append((current, count))
    return runs


def run_length_decode(runs, shape=None, dtype=np.uint8):
    """Decode run-length pairs and optionally reshape the output."""
    values = []
    for symbol, count in runs:
        if count < 0:
            raise ValueError("Run lengths must be non-negative.")
        values.extend([symbol] * count)
    result = np.asarray(values, dtype=dtype)
    return result.reshape(shape) if shape is not None else result


def huffman_encode(data):
    """Return a prefix-free Huffman code table and a bit-string encoding."""
    values = list(np.asarray(data).ravel())
    if not values:
        return {}, ""
    frequencies = Counter(values)
    counter = itertools.count()
    heap = [(frequency, next(counter), ("leaf", symbol))
            for symbol, frequency in frequencies.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        node = ("node", left[2], right[2])
        heapq.heappush(heap, (left[0] + right[0], next(counter), node))
    codes = {}

    def walk(node, prefix):
        if node[0] == "leaf":
            codes[node[1]] = prefix or "0"
            return
        walk(node[1], prefix + "0")
        walk(node[2], prefix + "1")

    walk(heap[0][2], "")
    encoded = "".join(codes[value] for value in values)
    return codes, encoded


def huffman_decode(encoded, codes):
    """Decode a Huffman bit string using its code table."""
    reverse = {code: symbol for symbol, code in codes.items()}
    decoded, current = [], ""
    for bit in encoded:
        if bit not in "01":
            raise ValueError("Encoded Huffman data must contain only 0 and 1.")
        current += bit
        if current in reverse:
            decoded.append(reverse[current])
            current = ""
    if current:
        raise ValueError("Incomplete Huffman code at end of bit stream.")
    return np.asarray(decoded)


def lzw_encode(data):
    """Encode 8-bit integer symbols using an LZW dictionary."""
    values = [int(value) for value in np.asarray(data).ravel()]
    if any(value < 0 or value > 255 for value in values):
        raise ValueError("LZW example accepts byte values from 0 through 255.")
    if not values:
        return []
    dictionary = {(symbol,): symbol for symbol in range(256)}
    next_code = 256
    current, output = (), []
    for symbol in values:
        candidate = current + (symbol,)
        if candidate in dictionary:
            current = candidate
        else:
            output.append(dictionary[current])
            dictionary[candidate] = next_code
            next_code += 1
            current = (symbol,)
    if current:
        output.append(dictionary[current])
    return output

def lzw_decode(codes, initial_alphabet=None):
    """Decode LZW codes; defaults to the byte alphabet 0..255."""
    alphabet = list(range(256)) if initial_alphabet is None else list(initial_alphabet)
    dictionary = {index: (symbol,) for index, symbol in enumerate(alphabet)}
    next_code = len(dictionary)
    codes = list(codes)
    if not codes:
        return np.asarray([], dtype=np.uint8)
    first = dictionary[codes[0]]
    output = list(first)
    previous = first
    for code in codes[1:]:
        if code in dictionary:
            entry = dictionary[code]
        elif code == next_code:
            entry = previous + (previous[0],)
        else:
            raise ValueError(f"Invalid LZW code: {code}")
        output.extend(entry)
        dictionary[next_code] = previous + (entry[0],)
        next_code += 1
        previous = entry
    return np.asarray(output)


def arithmetic_encode(data):
    """Encode a finite symbol sequence as an exact Fraction interval midpoint."""
    values = list(np.asarray(data).ravel())
    if not values:
        return {"code": Fraction(0), "counts": {}, "length": 0}
    counts = dict(Counter(values))
    symbols = sorted(counts, key=repr)
    total = len(values)
    cumulative, position = {}, 0
    for symbol in symbols:
        cumulative[symbol] = (position, position + counts[symbol])
        position += counts[symbol]
    low, high = Fraction(0), Fraction(1)
    for symbol in values:
        span = high - low
        left, right = cumulative[symbol]
        high = low + span * Fraction(right, total)
        low = low + span * Fraction(left, total)
    return {"code": (low + high) / 2, "counts": counts, "length": total}


def arithmetic_decode(encoded):
    """Decode the exact interval representation returned by arithmetic_encode."""
    counts, length = encoded["counts"], encoded["length"]
    if length == 0:
        return np.asarray([])
    symbols = sorted(counts, key=repr)
    total = sum(counts.values())
    cumulative, position = {}, 0
    for symbol in symbols:
        cumulative[symbol] = (position, position + counts[symbol])
        position += counts[symbol]
    low, high = Fraction(0), Fraction(1)
    code = encoded["code"]
    result = []
    for _ in range(length):
        scaled = (code - low) * total / (high - low)
        selected = None
        for symbol in symbols:
            left, right = cumulative[symbol]
            if Fraction(left) <= scaled < Fraction(right):
                selected = symbol
                span = high - low
                high = low + span * Fraction(right, total)
                low = low + span * Fraction(left, total)
                result.append(selected)
                break
        if selected is None:
            raise ValueError("Invalid arithmetic code or frequency table.")
    return np.asarray(result)


def jpeg_encode(image, quality=90):
    """Encode an image as JPEG bytes using OpenCV."""
    if not 1 <= quality <= 100:
        raise ValueError("JPEG quality must be between 1 and 100.")
    success, buffer = cv2.imencode(".jpg", to_uint8(image),
                                   [cv2.IMWRITE_JPEG_QUALITY, int(quality)])
    if not success:
        raise RuntimeError("JPEG encoding failed.")
    return buffer.tobytes()


def jpeg_decode(encoded_bytes):
    """Decode JPEG bytes into an image array."""
    image = cv2.imdecode(np.frombuffer(encoded_bytes, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError("JPEG data could not be decoded.")
    return image


def vector_quantize(image, block_size=4, codebook_size=16, seed=0, max_iter=25):
    """Block-based vector quantization with a small k-means codebook.

    Returns reconstructed image, codebook, and block indices. Border pixels
    are padded and cropped back to the original size.
    """
    array = to_uint8(image)
    if array.ndim != 2:
        raise ValueError("Vector quantization expects a grayscale image.")
    if block_size < 1 or codebook_size < 1:
        raise ValueError("block_size and codebook_size must be positive.")
    h, w = array.shape
    pad_h = (-h) % block_size
    pad_w = (-w) % block_size
    padded = np.pad(array, ((0, pad_h), (0, pad_w)), mode="edge")
    ph, pw = padded.shape
    blocks = padded.reshape(ph // block_size, block_size, pw // block_size, block_size)
    vectors = blocks.transpose(0, 2, 1, 3).reshape(-1, block_size * block_size).astype(np.float32)
    k = min(codebook_size, len(vectors))
    rng = np.random.default_rng(seed)
    codebook = vectors[rng.choice(len(vectors), size=k, replace=False)].copy()
    for _ in range(max_iter):
        distances = ((vectors[:, None, :] - codebook[None, :, :]) ** 2).sum(axis=2)
        assignments = distances.argmin(axis=1)
        updated = codebook.copy()
        for index in range(k):
            members = vectors[assignments == index]
            if len(members):
                updated[index] = members.mean(axis=0)
        if np.allclose(updated, codebook):
            codebook = updated
            break
        codebook = updated
    reconstructed = codebook[assignments].reshape(ph // block_size, pw // block_size,
                                                   block_size, block_size)
    reconstructed = reconstructed.transpose(0, 2, 1, 3).reshape(ph, pw)
    return to_uint8(reconstructed[:h, :w]), codebook, assignments.reshape(ph // block_size, pw // block_size)
