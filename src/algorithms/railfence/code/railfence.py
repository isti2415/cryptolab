"""Rail fence cipher.

A transposition rather than a substitution: the letters are unchanged, only
their order moves. Frequency analysis is therefore useless against it, the
ciphertext has exactly the letter distribution of the plaintext.
"""


def rail_pattern(length: int, rails: int) -> list[int]:
    """Which rail each position lands on: down, up, repeat.

    The cycle is 2*rails - 2 because the top and bottom rails are visited once
    per cycle while every rail in between is visited twice.
    """
    cycle = 2 * rails - 2
    out = []
    for i in range(length):
        j = i % cycle
        out.append(j if j < rails else cycle - j)
    return out


def encrypt(text: str, rails: int) -> str:
    """Write the message along the zigzag, then read the rails in order."""
    pattern = rail_pattern(len(text), rails)
    rows = [[] for _ in range(rails)]
    for ch, rail in zip(text, pattern):
        rows[rail].append(ch)
    return "".join("".join(row) for row in rows)


def decrypt(text: str, rails: int) -> str:
    """Measure the rails from the length, refill them, then read the zigzag.

    The shape of the fence depends only on the message length and the rail
    count, so it can be reconstructed without knowing any of the letters.
    """
    pattern = rail_pattern(len(text), rails)

    counts = [pattern.count(r) for r in range(rails)]
    rows = []
    cursor = 0
    for n in counts:
        rows.append(list(text[cursor : cursor + n]))
        cursor += n

    positions = [0] * rails
    out = []
    for rail in pattern:
        out.append(rows[rail][positions[rail]])
        positions[rail] += 1
    return "".join(out)


def rail_fence(text: str, rails: int, decrypt_mode: bool = False) -> str:
    letters = "".join(ch for ch in text.upper() if ch.isalpha() and ch.isascii())
    if not 2 <= rails <= 12:
        raise ValueError("use between 2 and 12 rails")
    if rails >= len(letters):
        raise ValueError("more rails than letters leaves the message unchanged")
    return decrypt(letters, rails) if decrypt_mode else encrypt(letters, rails)


def run(text: str, params: dict, direction: str) -> str:
    return rail_fence(text, int(params["rails"]), direction == "decrypt")


if __name__ == "__main__":
    print(rail_fence("WEAREDISCOVEREDFLEEATONCE", 3))
