"""SHA-256 (FIPS 180-4).

A hash, not a cipher: no key, and no way back. Any input is compressed to 256
bits such that finding a second input with the same digest, or any input
matching a given digest, is infeasible.

The structure is Merkle-Damgard: pad to whole 512-bit blocks, then fold each
block into a 256-bit state with a compression function.
"""

# Fractional parts of the cube roots of the first 64 primes.
K = [
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1,
    0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786,
    0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147,
    0x06CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B,
    0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A,
    0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
]

# Fractional parts of the square roots of the first 8 primes.
H0 = [
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
]

MASK = 0xFFFFFFFF


def rotr(x: int, n: int) -> int:
    return ((x >> n) | (x << (32 - n))) & MASK


def big_sigma0(x: int) -> int:
    return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)


def big_sigma1(x: int) -> int:
    return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)


def small_sigma0(x: int) -> int:
    return rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3)


def small_sigma1(x: int) -> int:
    return rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10)


def ch(e: int, f: int, g: int) -> int:
    """Choose: take f where e is 1, g where e is 0."""
    return (e & f) ^ (~e & g)


def maj(a: int, b: int, c: int) -> int:
    """Majority: whichever bit two of the three agree on."""
    return (a & b) ^ (a & c) ^ (b & c)


def pad(data: bytes) -> bytes:
    """Append a 1 bit, zeros, then the original bit length as 64 bits.

    Encoding the length is what stops two different messages padding to the
    same block sequence.
    """
    bit_length = len(data) * 8
    data = data + b"\x80"
    while len(data) % 64 != 56:
        data += b"\x00"
    return data + bit_length.to_bytes(8, "big")


def compress(state: list[int], block: bytes) -> list[int]:
    """Fold one 512-bit block into the 256-bit state."""
    w = [int.from_bytes(block[i * 4 : i * 4 + 4], "big") for i in range(16)]
    for t in range(16, 64):
        w.append(
            (small_sigma1(w[t - 2]) + w[t - 7] + small_sigma0(w[t - 15]) + w[t - 16])
            & MASK
        )

    a, b, c, d, e, f, g, h = state
    for t in range(64):
        t1 = (h + big_sigma1(e) + ch(e, f, g) + K[t] + w[t]) & MASK
        t2 = (big_sigma0(a) + maj(a, b, c)) & MASK
        h, g, f, e = g, f, e, (d + t1) & MASK
        d, c, b, a = c, b, a, (t1 + t2) & MASK

    # Feed-forward: add back rather than replace, which is what makes the
    # compression function one-way.
    return [(x + y) & MASK for x, y in zip(state, [a, b, c, d, e, f, g, h])]


def sha256(data: bytes) -> str:
    state = list(H0)
    padded = pad(data)
    for i in range(0, len(padded), 64):
        state = compress(state, padded[i : i + 64])
    return "".join(f"{x:08x}" for x in state)


def run(text: str, params: dict, direction: str) -> str:
    return sha256(text.encode())


if __name__ == "__main__":
    print(sha256(b"abc"))
