"""One-time pad.

Mechanically this is a Vigenère cipher whose key is as long as the message.
What makes it unbreakable is not the mechanism but the conditions: the pad must
be truly random, used exactly once, and never shorter than the message. Reuse
a pad across two messages and XORing the two ciphertexts cancels it out
entirely, which is how the Venona project read Soviet traffic for decades.
"""

ALPHABET_SIZE = 26


def combine(letter: str, pad_letter: str, decrypt: bool) -> str:
    """Add (or subtract) one pad letter, mod 26, preserving case."""
    base = ord("A") if letter.isupper() else ord("a")
    m = ord(letter) - base
    k = ord(pad_letter.upper()) - ord("A")
    return chr(base + ((m - k) if decrypt else (m + k)) % ALPHABET_SIZE)


def one_time_pad(text: str, pad: str, decrypt: bool = False) -> str:
    key = [c for c in pad.upper() if c.isalpha() and c.isascii()]
    needed = sum(1 for ch in text if ch.isalpha() and ch.isascii())
    if len(key) < needed:
        raise ValueError(
            f"the pad has {len(key)} letters but the message needs {needed}; "
            "a one-time pad is never reused or repeated"
        )

    out = []
    k = 0
    for ch in text:
        if not (ch.isalpha() and ch.isascii()):
            out.append(ch)
            continue
        out.append(combine(ch, key[k], decrypt))
        k += 1  # each pad letter is consumed exactly once, never repeated
    return "".join(out)


def run(text: str, params: dict, direction: str) -> str:
    return one_time_pad(text, str(params["pad"]), direction == "decrypt")


if __name__ == "__main__":
    print(one_time_pad("HELLO", "XMCKL"))  # EQNVZ
