"""ChaCha20 (RFC 8439).

A stream cipher made only of additions, XORs and rotations, "ARX". No lookup
tables anywhere, which is the point: table lookups are what leak AES's key
through cache timing, and a cipher without them is constant-time by
construction on any CPU.
"""

MASK = 0xFFFFFFFF

# "expand 32-byte k"; the constants are literally that ASCII string.
CONSTANTS = [0x61707865, 0x3320646E, 0x79622D32, 0x6B206574]

COLUMNS = [(0, 4, 8, 12), (1, 5, 9, 13), (2, 6, 10, 14), (3, 7, 11, 15)]
DIAGONALS = [(0, 5, 10, 15), (1, 6, 11, 12), (2, 7, 8, 13), (3, 4, 9, 14)]


def rotl(x: int, n: int) -> int:
    return ((x << n) | (x >> (32 - n))) & MASK


def quarter_round(s: list[int], a: int, b: int, c: int, d: int) -> None:
    """Add, XOR, rotate, four times. No branch or address depends on the data."""
    s[a] = (s[a] + s[b]) & MASK
    s[d] = rotl(s[d] ^ s[a], 16)
    s[c] = (s[c] + s[d]) & MASK
    s[b] = rotl(s[b] ^ s[c], 12)
    s[a] = (s[a] + s[b]) & MASK
    s[d] = rotl(s[d] ^ s[a], 8)
    s[c] = (s[c] + s[d]) & MASK
    s[b] = rotl(s[b] ^ s[c], 7)


def initial_state(key: bytes, counter: int, nonce: bytes) -> list[int]:
    words = lambda b: [int.from_bytes(b[i : i + 4], "little") for i in range(0, len(b), 4)]
    return CONSTANTS + words(key) + [counter & MASK] + words(nonce)


def block(key: bytes, counter: int, nonce: bytes) -> bytes:
    """One 64-byte keystream block."""
    start = initial_state(key, counter, nonce)
    s = list(start)

    for round_number in range(20):
        for a, b, c, d in (COLUMNS if round_number % 2 == 0 else DIAGONALS):
            quarter_round(s, a, b, c, d)

    # The rounds alone are reversible; adding the starting state back is what
    # makes the block function one-way.
    out = [(x + y) & MASK for x, y in zip(s, start)]
    return b"".join(w.to_bytes(4, "little") for w in out)


def chacha20(data: bytes, key: bytes, nonce: bytes, counter: int = 0) -> bytes:
    out = bytearray()
    for i in range(0, len(data), 64):
        stream = block(key, counter + i // 64, nonce)
        out += bytes(x ^ y for x, y in zip(data[i : i + 64], stream))
    return bytes(out)


def run(text: str, params: dict, direction: str) -> str:
    key = bytes.fromhex("".join(str(params["key"]).split()))
    nonce = bytes.fromhex("".join(str(params["nonce"]).split()))
    counter = int(params["counter"])
    if direction == "decrypt":
        return chacha20(bytes.fromhex("".join(text.split())), key, nonce, counter).decode()
    return chacha20(text.encode(), key, nonce, counter).hex().upper()


if __name__ == "__main__":
    key = bytes(range(32))
    nonce = bytes.fromhex("000000090000004a00000000")
    print(block(key, 1, nonce).hex()[:32])
