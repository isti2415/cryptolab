"""Caesar cipher.

Every letter moves a fixed number of places along the alphabet, wrapping past
Z back to A. Case is preserved and non-letters pass through untouched, which
matches what the visualiser shows on screen.
"""

ALPHABET_SIZE = 26


def shift_letter(ch: str, amount: int) -> str:
    """Move one letter `amount` places, keeping its case."""
    base = ord("A") if ch.isupper() else ord("a")
    index = ord(ch) - base
    return chr(base + (index + amount) % ALPHABET_SIZE)


def caesar(text: str, shift: int, decrypt: bool = False) -> str:
    amount = -shift if decrypt else shift
    return "".join(
        shift_letter(ch, amount) if ch.isalpha() and ch.isascii() else ch
        for ch in text
    )


def run(text: str, params: dict, direction: str) -> str:
    """Entry point used by the shared vector tests."""
    return caesar(text, int(params["shift"]), direction == "decrypt")


if __name__ == "__main__":
    print(caesar("The die is cast", 3))  # Wkh glh lv fdvw
