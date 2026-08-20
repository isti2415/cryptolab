"""Vigenère cipher.

A repeating keyword selects a different Caesar shift for each letter. The key
only advances on letters; spaces and punctuation pass through without
consuming a key letter, so the alignment you see under the message on screen is
the alignment used here.
"""

ALPHABET_SIZE = 26


def key_shift(key_char: str) -> int:
    """The Caesar shift named by one key letter: A is 0, B is 1, and so on."""
    return ord(key_char.upper()) - ord("A")


def vigenere(text: str, keyword: str, decrypt: bool = False) -> str:
    key = [c for c in keyword.upper() if c.isalpha() and c.isascii()]
    if not key:
        raise ValueError("the keyword must contain at least one letter")

    out = []
    k = 0
    for ch in text:
        if not (ch.isalpha() and ch.isascii()):
            out.append(ch)
            continue
        base = ord("A") if ch.isupper() else ord("a")
        shift = key_shift(key[k % len(key)])
        if decrypt:
            shift = -shift
        out.append(chr(base + (ord(ch) - base + shift) % ALPHABET_SIZE))
        k += 1  # only letters advance the key
    return "".join(out)


def run(text: str, params: dict, direction: str) -> str:
    return vigenere(text, str(params["keyword"]), direction == "decrypt")


if __name__ == "__main__":
    print(vigenere("ATTACKATDAWN", "LEMON"))  # LXFOPVEFRNHR
