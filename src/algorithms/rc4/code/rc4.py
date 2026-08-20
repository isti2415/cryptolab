"""RC4 stream cipher.

Two loops over a 256-byte permutation and nothing else, no rounds, no S-boxes,
no tables. That simplicity is why it spread everywhere, and the reason it is
worth reading even though it is now thoroughly broken and prohibited in TLS.
"""


def ksa(key: bytes) -> list[int]:
    """Key-scheduling algorithm: stir the key into a permutation of 0..255.

    The key is consumed cyclically, so a short key is simply repeated. The bias
    this leaves in the early output is what eventually broke WEP.
    """
    s = list(range(256))
    j = 0
    for i in range(256):
        j = (j + s[i] + key[i % len(key)]) % 256
        s[i], s[j] = s[j], s[i]
    return s


def prga(s: list[int], length: int):
    """Pseudo-random generation: keep swapping, emit one byte each step."""
    s = list(s)
    i = j = 0
    for _ in range(length):
        i = (i + 1) % 256
        j = (j + s[i]) % 256
        s[i], s[j] = s[j], s[i]
        yield s[(s[i] + s[j]) % 256]


def rc4(data: bytes, key: bytes) -> bytes:
    """Encryption and decryption are the same operation: XOR with the keystream.

    That symmetry is also the trap. Using one key twice produces the same
    keystream twice, and XORing the two ciphertexts cancels it out completely.
    """
    return bytes(b ^ k for b, k in zip(data, prga(ksa(key), len(data))))


def run(text: str, params: dict, direction: str) -> str:
    key = str(params["key"]).encode()
    if direction == "decrypt":
        return rc4(bytes.fromhex("".join(text.split())), key).decode()
    return rc4(text.encode(), key).hex().upper()


if __name__ == "__main__":
    print(rc4(b"Plaintext", b"Key").hex().upper())  # BBF316E8D940AF0AD3
