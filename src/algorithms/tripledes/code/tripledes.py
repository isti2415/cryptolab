"""Triple DES (3DES / TDEA).

DES applied three times, because a 56-bit key stopped being enough and the
hardware to run DES was already everywhere.

The middle operation is a decryption purely for backwards compatibility: set
all three keys equal and the D undoes the first E, so the whole construction
collapses to plain single DES. That is a compatibility feature, not a security
one.
"""

from des import des_block


def triple_des(block_hex: str, key_hex: str, decrypt: bool = False) -> str:
    """Encrypt-Decrypt-Encrypt with two or three keys.

    A 32-digit key is two-key 3DES, where K3 is reused from K1; 48 digits is
    three independent keys. Two-key 3DES is the weaker of the two and is no
    longer approved.
    """
    key_hex = "".join(key_hex.split()).upper()
    if len(key_hex) not in (32, 48):
        raise ValueError("the key must be 32 hex digits (two-key) or 48 (three-key)")

    k1 = key_hex[0:16]
    k2 = key_hex[16:32]
    k3 = key_hex[32:48] if len(key_hex) == 48 else k1

    if decrypt:
        plan = [(k3, True), (k2, False), (k1, True)]
    else:
        plan = [(k1, False), (k2, True), (k3, False)]

    block = "".join(block_hex.split()).upper()
    for key, invert in plan:
        block = des_block(block, key, invert)
    return block


def run(text: str, params: dict, direction: str) -> str:
    return triple_des(text, str(params["key"]), direction == "decrypt")


if __name__ == "__main__":
    print(triple_des("0123456789ABCDEF", "133457799BBCDFF1" * 3))
