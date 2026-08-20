"""Hill cipher (2x2).

Letters are taken two at a time as a vector and multiplied by a key matrix mod
26. Every output letter depends on both input letters, which is real diffusion, 
the property single-letter substitution ciphers completely lack.

The catch is that the whole thing is linear, so a handful of known
plaintext/ciphertext pairs let an attacker solve for the key directly.
"""

from math import gcd

ALPHABET_SIZE = 26


def mod_inverse(a: int, m: int) -> int:
    old_r, r = a % m, m
    old_s, s = 1, 0
    while r:
        q = old_r // r
        old_r, r = r, old_r - q * r
        old_s, s = s, old_s - q * s
    if old_r != 1:
        raise ValueError(f"{a} has no inverse mod {m}")
    return old_s % m


def invert(matrix: list[list[int]]) -> list[list[int]]:
    """Inverse of a 2x2 matrix mod 26: det^-1 times the adjugate."""
    (a, b), (c, d) = matrix
    det = (a * d - b * c) % ALPHABET_SIZE
    if gcd(det, ALPHABET_SIZE) != 1:
        raise ValueError(
            f"determinant {det} shares a factor with {ALPHABET_SIZE}, "
            "so the matrix cannot be inverted and the key is unusable"
        )
    inv = mod_inverse(det, ALPHABET_SIZE)
    return [
        [(inv * d) % ALPHABET_SIZE, (inv * -b) % ALPHABET_SIZE],
        [(inv * -c) % ALPHABET_SIZE, (inv * a) % ALPHABET_SIZE],
    ]


def apply_block(matrix: list[list[int]], block: str) -> str:
    """One 2-letter block through the matrix multiply, mod 26."""
    x0, x1 = (ord(ch) - ord("A") for ch in block)
    y0 = (matrix[0][0] * x0 + matrix[0][1] * x1) % ALPHABET_SIZE
    y1 = (matrix[1][0] * x0 + matrix[1][1] * x1) % ALPHABET_SIZE
    return chr(ord("A") + y0) + chr(ord("A") + y1)


def hill(text: str, key: str, decrypt: bool = False) -> str:
    nums = [int(t) for t in key.replace(",", " ").split()]
    if len(nums) != 4:
        raise ValueError("the key must be four whole numbers (a 2x2 matrix, row by row)")
    a, b, c, d = nums
    matrix = [[a, b], [c, d]]
    # Validate the key even when encrypting: a non-invertible matrix encrypts
    # happily and then silently fails to decrypt, which is worse than an error.
    inverse = invert(matrix)

    letters = "".join(ch for ch in text.upper() if ch.isalpha() and ch.isascii())
    if len(letters) % 2:
        letters += "X"  # pad to a whole number of blocks

    applied = inverse if decrypt else matrix
    return "".join(
        apply_block(applied, letters[i : i + 2]) for i in range(0, len(letters), 2)
    )


def run(text: str, params: dict, direction: str) -> str:
    return hill(text, str(params["key"]), direction == "decrypt")


if __name__ == "__main__":
    print(hill("HELP", "3 3 2 5"))  # HIAT
