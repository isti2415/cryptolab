"""HMAC-SHA-256 (RFC 2104).

A hash tells you whether data changed; it cannot tell you who changed it,
because anyone can compute a hash. A MAC adds a key, so only the holder can
produce a tag that verifies.

The obvious construction, H(key || message), is broken against SHA-256: a
digest is the hash's entire internal state, so an attacker who has one can
resume from it and append data without knowing the key. HMAC's nested shape
closes that door; the outer hash sees only a fixed 32 bytes, so there is
nothing to extend.
"""

from sha256 import sha256

BLOCK_SIZE = 64  # SHA-256's block size, not its 32-byte output size
IPAD = 0x36
OPAD = 0x5C


def _digest_bytes(data: bytes) -> bytes:
    return bytes.fromhex(sha256(data))


def normalise_key(key: bytes) -> bytes:
    """Reduce or extend the key to exactly one block.

    A key longer than a block is replaced by its own digest, which has a
    consequence worth knowing: a long key and its hash produce identical tags,
    so they are interchangeable to an attacker.
    """
    if len(key) > BLOCK_SIZE:
        key = _digest_bytes(key)
    return key + b"\x00" * (BLOCK_SIZE - len(key))


def hmac_sha256(key: bytes, message: bytes) -> str:
    block_key = normalise_key(key)

    inner_key = bytes(b ^ IPAD for b in block_key)
    outer_key = bytes(b ^ OPAD for b in block_key)

    inner = _digest_bytes(inner_key + message)
    return sha256(outer_key + inner)


def verify(key: bytes, message: bytes, tag: str) -> bool:
    """Compare in constant time.

    A byte-by-byte comparison that returns early leaks how much of the tag was
    correct, and an attacker can rebuild a valid tag one byte at a time from
    the timing alone.
    """
    expected = hmac_sha256(key, message)
    if len(expected) != len(tag):
        return False
    difference = 0
    for a, b in zip(expected, tag):
        difference |= ord(a) ^ ord(b)
    return difference == 0


def run(text: str, params: dict, direction: str) -> str:
    key_raw = str(params["key"])
    if str(params.get("format", "text")) == "hex":
        return hmac_sha256(bytes.fromhex(key_raw), bytes.fromhex("".join(text.split())))
    return hmac_sha256(key_raw.encode(), text.encode())


if __name__ == "__main__":
    print(hmac_sha256(b"Jefe", b"what do ya want for nothing?"))
