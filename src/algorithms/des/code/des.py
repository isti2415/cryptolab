"""DES: the Data Encryption Standard (FIPS 46-3), one 64-bit block.

DES is a 16-round Feistel network. Its structure is elegant: because each round
XORs the output of a keyed function into the other half and then swaps, the
whole thing is its own inverse when the round keys are reversed, so encryption
and decryption are the same code path.

Its problem is not the design but the size. A 56-bit key was already
controversial in 1977; the EFF broke it by brute force in days in 1998, and a
modern cluster does it in hours. Nothing here should protect anything real.
"""

IP = [
    58, 50, 42, 34, 26, 18, 10, 2,
    60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6,
    64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1,
    59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5,
    63, 55, 47, 39, 31, 23, 15, 7,
]

FP = [
    40, 8, 48, 16, 56, 24, 64, 32,
    39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30,
    37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28,
    35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26,
    33, 1, 41, 9, 49, 17, 57, 25,
]

E = [
    32, 1, 2, 3, 4, 5,
    4, 5, 6, 7, 8, 9,
    8, 9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21,
    20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32, 1,
]

P = [
    16, 7, 20, 21, 29, 12, 28, 17,
    1, 15, 23, 26, 5, 18, 31, 10,
    2, 8, 24, 14, 32, 27, 3, 9,
    19, 13, 30, 6, 22, 11, 4, 25,
]

PC1 = [
    57, 49, 41, 33, 25, 17, 9,
    1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27,
    19, 11, 3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,
    7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29,
    21, 13, 5, 28, 20, 12, 4,
]

PC2 = [
    14, 17, 11, 24, 1, 5,
    3, 28, 15, 6, 21, 10,
    23, 19, 12, 4, 26, 8,
    16, 7, 27, 20, 13, 2,
    41, 52, 31, 37, 47, 55,
    30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53,
    46, 42, 50, 36, 29, 32,
]

SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]

SBOX = [
    [
        [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
        [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
        [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
        [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
    ],
    [
        [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
        [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
        [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
        [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
    ],
    [
        [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
        [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
        [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
        [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
    ],
    [
        [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
        [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
        [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
        [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
    ],
    [
        [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
        [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
        [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
        [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
    ],
    [
        [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
        [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
        [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
        [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
    ],
    [
        [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
        [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
        [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
        [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
    ],
    [
        [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
        [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
        [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
        [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
    ],
]

def hex_to_bits(hex_str: str) -> list[int]:
    """Hex digits into a flat list of bits, most significant first."""
    return [
        (int(ch, 16) >> shift) & 1 for ch in hex_str for shift in (3, 2, 1, 0)
    ]


def bits_to_hex(bits: list[int]) -> str:
    return "".join(
        f"{(bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]:X}"
        for i in range(0, len(bits), 4)
    )


def permute(bits: list[int], table: list[int]) -> list[int]:
    """Every DES table is 1-based, hence the -1."""
    return [bits[i - 1] for i in table]


def xor(a: list[int], b: list[int]) -> list[int]:
    return [x ^ y for x, y in zip(a, b)]


def rotate_left(bits: list[int], n: int) -> list[int]:
    return bits[n:] + bits[:n]


def subkeys(key_bits: list[int]) -> list[list[int]]:
    """PC-1, split into halves C and D, sixteen left rotations, then PC-2.

    PC-1 drops every eighth bit of the key; those were only ever parity bits,
    which is why a 64-bit DES key carries just 56 bits of strength.
    """
    pc1 = permute(key_bits, PC1)
    c, d = pc1[:28], pc1[28:]
    keys = []
    for shift in SHIFTS:
        c = rotate_left(c, shift)
        d = rotate_left(d, shift)
        keys.append(permute(c + d, PC2))
    return keys


def feistel(right: list[int], key: list[int]) -> list[int]:
    """f(R, K): expand to 48 bits, mix in the key, crush to 32, permute.

    The eight S-boxes are the only non-linear part of DES. Everything else is a
    fixed shuffle or an XOR, and a cipher built purely from those would fall to
    linear algebra immediately.
    """
    mixed = xor(permute(right, E), key)

    out: list[int] = []
    for i in range(8):
        chunk = mixed[i * 6 : i * 6 + 6]
        # Outer two bits choose the row, inner four choose the column.
        row = (chunk[0] << 1) | chunk[5]
        col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4]
        value = SBOX[i][row][col]
        out += [(value >> 3) & 1, (value >> 2) & 1, (value >> 1) & 1, value & 1]

    return permute(out, P)


def des_block(block_hex: str, key_hex: str, decrypt: bool = False) -> str:
    if len(block_hex) != 16 or len(key_hex) != 16:
        raise ValueError("block and key must each be 16 hexadecimal digits (64 bits)")

    keys = subkeys(hex_to_bits(key_hex))
    if decrypt:
        keys = keys[::-1]  # the only difference between the two directions

    bits = permute(hex_to_bits(block_hex), IP)
    left, right = bits[:32], bits[32:]

    for key in keys:
        left, right = right, xor(left, feistel(right, key))

    # Final swap, then the inverse of the initial permutation.
    return bits_to_hex(permute(right + left, FP))


def run(text: str, params: dict, direction: str) -> str:
    block = "".join(text.split()).upper()
    key = "".join(str(params["key"]).split()).upper()
    return des_block(block, key, direction == "decrypt")


if __name__ == "__main__":
    print(des_block("0123456789ABCDEF", "133457799BBCDFF1"))  # 85E813540F0AB405
