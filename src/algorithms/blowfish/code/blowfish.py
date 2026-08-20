"""Blowfish.

A 16-round Feistel cipher whose S-boxes are generated from the key rather than
fixed. That is the design's distinguishing idea and also its cost: keying runs
the cipher 521 times before a single byte of plaintext moves. Slow for bulk
data, and exactly what you want for hashing passwords, bcrypt is built on it.

The initial tables are the hexadecimal digits of pi, computed here from
Machin's formula rather than pasted in as 1042 magic constants.
"""

MASK = 0xFFFFFFFF
ROUNDS = 16
P_LENGTH = ROUNDS + 2
S_BOXES, S_SIZE = 4, 256


def _atan_inv(x: int, one: int) -> int:
    term = one // x
    total = term
    x2 = x * x
    n = 1
    while term:
        term //= x2
        n += 2
        total += -term // n if n % 4 == 3 else term // n
    return total


def pi_words(count: int) -> list[int]:
    """The first `count` 32-bit words of pi's fractional part, in hex.

    pi = 16*arctan(1/5) - 4*arctan(1/239). Deriving them makes it checkable
    that the tables contain nothing but pi, which is why Schneier chose them.
    """
    hex_digits = count * 8
    guard = 16
    one = 1 << (4 * (hex_digits + guard))
    pi = 16 * _atan_inv(5, one) - 4 * _atan_inv(239, one)
    frac = pi - (3 << (4 * (hex_digits + guard)))
    digits = format(frac >> (4 * guard), "x").rjust(hex_digits, "0")
    return [int(digits[i * 8 : i * 8 + 8], 16) for i in range(count)]


_PI = pi_words(P_LENGTH + S_BOXES * S_SIZE)
INITIAL_P = _PI[:P_LENGTH]
INITIAL_S = [
    _PI[P_LENGTH + i * S_SIZE : P_LENGTH + (i + 1) * S_SIZE] for i in range(S_BOXES)
]


def f(p_s: tuple[list[int], list[list[int]]], x: int) -> int:
    """Four byte-wide S-box lookups, combined with two adds and an XOR.

    Mixing addition mod 2**32 with XOR is deliberate: the two do not distribute
    over each other, which is what makes f awkward to attack algebraically.
    """
    _, s = p_s
    a, b, c, d = (x >> 24) & 0xFF, (x >> 16) & 0xFF, (x >> 8) & 0xFF, x & 0xFF
    return ((((s[0][a] + s[1][b]) & MASK) ^ s[2][c]) + s[3][d]) & MASK


def encrypt_block(p_s, left: int, right: int, decrypt: bool = False):
    p, _ = p_s
    l, r = left & MASK, right & MASK
    for i in range(ROUNDS):
        l ^= p[ROUNDS + 1 - i] if decrypt else p[i]
        r ^= f(p_s, l)
        l, r = r, l
    l, r = r, l
    if decrypt:
        r ^= p[1]
        l ^= p[0]
    else:
        r ^= p[ROUNDS]
        l ^= p[ROUNDS + 1]
    return l & MASK, r & MASK


def expand_key(key: bytes):
    """521 encryptions, each rewriting two table entries and feeding the next.

    There is no shortcut: the tables cannot be precomputed without the key.
    """
    p = list(INITIAL_P)
    s = [list(box) for box in INITIAL_S]

    for i in range(P_LENGTH):
        word = 0
        for j in range(4):
            word = ((word << 8) | key[(i * 4 + j) % len(key)]) & MASK
        p[i] ^= word

    l = r = 0
    for i in range(0, P_LENGTH, 2):
        l, r = encrypt_block((p, s), l, r)
        p[i], p[i + 1] = l, r
    for box in range(S_BOXES):
        for i in range(0, S_SIZE, 2):
            l, r = encrypt_block((p, s), l, r)
            s[box][i], s[box][i + 1] = l, r
    return p, s


def blowfish(block_hex: str, key_hex: str, decrypt: bool = False) -> str:
    block_hex = "".join(block_hex.split()).upper()
    key = bytes.fromhex("".join(key_hex.split()))
    if len(block_hex) != 16:
        raise ValueError("the block must be 16 hexadecimal digits")
    if not 4 <= len(key) <= 56:
        raise ValueError("the key must be 4 to 56 bytes")

    p_s = expand_key(key)
    l, r = int(block_hex[:8], 16), int(block_hex[8:], 16)
    l, r = encrypt_block(p_s, l, r, decrypt)
    return f"{l:08X}{r:08X}"


def run(text: str, params: dict, direction: str) -> str:
    return blowfish(text, str(params["key"]), direction == "decrypt")


if __name__ == "__main__":
    print(blowfish("0000000000000000", "0000000000000000"))  # 4EF997456198DD78
