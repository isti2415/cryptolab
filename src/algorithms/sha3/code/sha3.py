"""SHA-3 / Keccak (FIPS 202).

Structurally unlike SHA-2. Rather than compressing block by block into a
chaining value, Keccak keeps a large fixed state and absorbs the message into
part of it, then squeezes the digest back out. The untouched part is the
capacity, and because the digest is only a slice of the state, knowing it does
not let anyone resume the permutation; SHA-3 is immune to length extension by
construction.
"""

MASK = (1 << 64) - 1

RHO = [
    [0, 36, 3, 41, 18],
    [1, 44, 10, 45, 2],
    [62, 6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39, 8, 14],
]

RC = [
    0x0000000000000001, 0x0000000000008082, 0x800000000000808A, 0x8000000080008000,
    0x000000000000808B, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
    0x000000000000008A, 0x0000000000000088, 0x0000000080008009, 0x000000008000000A,
    0x000000008000808B, 0x800000000000008B, 0x8000000000008089, 0x8000000000008003,
    0x8000000000008002, 0x8000000000000080, 0x000000000000800A, 0x800000008000000A,
    0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008,
]


def rotl(x: int, n: int) -> int:
    n %= 64
    return ((x << n) | (x >> (64 - n))) & MASK


def keccak_f(a: list[int]) -> list[int]:
    """The 24-round permutation over 25 lanes of 64 bits."""
    for round_index in range(24):
        # theta: XOR each bit with the parity of two whole columns.
        c = [a[x] ^ a[x + 5] ^ a[x + 10] ^ a[x + 15] ^ a[x + 20] for x in range(5)]
        d = [c[(x + 4) % 5] ^ rotl(c[(x + 1) % 5], 1) for x in range(5)]
        for x in range(5):
            for y in range(5):
                a[x + 5 * y] ^= d[x]

        # rho and pi: rotate each lane, then move it. No bit changes value.
        b = [0] * 25
        for x in range(5):
            for y in range(5):
                b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(a[x + 5 * y], RHO[x][y])

        # chi: the only non-linear step.
        for y in range(5):
            for x in range(5):
                a[x + 5 * y] = b[x + 5 * y] ^ (
                    (~b[((x + 1) % 5) + 5 * y] & MASK) & b[((x + 2) % 5) + 5 * y]
                )

        # iota: break the symmetry the other four steps preserve.
        a[0] ^= RC[round_index]
    return a


def keccak(data: bytes, rate: int, pad_byte: int, output_bytes: int) -> str:
    """Sponge: pad, absorb into the rate, permute, then squeeze."""
    padded = bytearray(data)
    padded.append(pad_byte)
    while len(padded) % rate:
        padded.append(0)
    padded[-1] |= 0x80

    lanes = [0] * 25
    for offset in range(0, len(padded), rate):
        chunk = padded[offset : offset + rate]
        for i in range(0, rate, 8):
            lanes[i // 8] ^= int.from_bytes(chunk[i : i + 8], "little")
        lanes = keccak_f(lanes)

    out = bytearray()
    while len(out) < output_bytes:
        for i in range(rate // 8):
            out += lanes[i].to_bytes(8, "little")
            if len(out) >= output_bytes:
                break
        if len(out) < output_bytes:
            lanes = keccak_f(lanes)
    return bytes(out[:output_bytes]).hex()


def sha3_256(data: bytes) -> str:
    return keccak(data, 136, 0x06, 32)


def sha3_512(data: bytes) -> str:
    return keccak(data, 72, 0x06, 64)


def shake128(data: bytes, output_bytes: int = 32) -> str:
    return keccak(data, 168, 0x1F, output_bytes)


def shake256(data: bytes, output_bytes: int = 32) -> str:
    return keccak(data, 136, 0x1F, output_bytes)


def run(text: str, params: dict, direction: str) -> str:
    variant = str(params.get("variant", "sha3-256"))
    data = text.encode()
    return {
        "sha3-256": sha3_256,
        "sha3-512": sha3_512,
        "shake128": shake128,
        "shake256": shake256,
    }[variant](data)


if __name__ == "__main__":
    print(sha3_256(b"abc"))
