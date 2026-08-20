"""Affine cipher.

Each letter index x becomes (a·x + b) mod 26: a multiply followed by a shift.
Decryption undoes them in the opposite order using a⁻¹, the modular inverse of
a, which only exists when a is coprime with 26. Pick an a that shares a factor
with 26 and the map stops being one-to-one: several letters collapse onto the
same output and the message is unrecoverable.
"""

from math import gcd

ALPHABET_SIZE = 26


def mod_inverse(a: int, m: int) -> int:
    """Multiplicative inverse of a mod m, via the extended Euclidean algorithm."""
    old_r, r = a % m, m
    old_s, s = 1, 0
    while r:
        q = old_r // r
        old_r, r = r, old_r - q * r
        old_s, s = s, old_s - q * s
    if old_r != 1:
        raise ValueError(f"a = {a} is not coprime with {m}; no inverse exists")
    return old_s % m


def transform(x: int, a: int, b: int, decrypt: bool) -> int:
    """One letter index through the affine map, or back out of it."""
    if decrypt:
        return (mod_inverse(a, ALPHABET_SIZE) * (x - b)) % ALPHABET_SIZE
    return (a * x + b) % ALPHABET_SIZE


def affine(text: str, a: int, b: int, decrypt: bool = False) -> str:
    if gcd(a, ALPHABET_SIZE) != 1:
        raise ValueError(f"a = {a} must be coprime with {ALPHABET_SIZE}")

    out = []
    for ch in text:
        if not (ch.isalpha() and ch.isascii()):
            out.append(ch)
            continue
        base = ord("A") if ch.isupper() else ord("a")
        y = transform(ord(ch) - base, a, b, decrypt)
        out.append(chr(base + y))
    return "".join(out)


def run(text: str, params: dict, direction: str) -> str:
    return affine(
        text, int(params["a"]) % 26, int(params["b"]) % 26, direction == "decrypt"
    )


if __name__ == "__main__":
    print(affine("AFFINE CIPHER", 5, 8))  # IHHWVC SWFRCP
