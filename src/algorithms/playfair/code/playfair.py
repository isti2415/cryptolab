"""Playfair cipher.

The first practical digraph substitution cipher: letters are enciphered two at
a time against a 5x5 key square, which defeats single-letter frequency analysis.
I and J share a cell so 25 letters fit the grid.
"""

ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ"


def normalize(text: str) -> str:
    return "".join(c for c in text.upper().replace("J", "I") if c.isalpha() and c.isascii())


def build_grid(keyword: str) -> list[list[str]]:
    """Keyword first (duplicates dropped), then the rest of the alphabet."""
    seen: list[str] = []
    for ch in normalize(keyword) + ALPHABET_NO_J:
        if ch not in seen:
            seen.append(ch)
    return [seen[r * 5 : r * 5 + 5] for r in range(5)]


def positions(grid: list[list[str]]) -> dict[str, tuple[int, int]]:
    return {ch: (r, c) for r, row in enumerate(grid) for c, ch in enumerate(row)}


def _filler(letter: str) -> str:
    """X separates a doubled pair, except after an X, where Q is used."""
    return "Q" if letter == "X" else "X"


def to_pairs(text: str, decrypt: bool) -> list[str]:
    letters = normalize(text)
    pairs: list[str] = []

    if decrypt:
        # Ciphertext is already an even stream of digraphs.
        for i in range(0, len(letters), 2):
            a = letters[i]
            b = letters[i + 1] if i + 1 < len(letters) else _filler(a)
            pairs.append(a + b)
        return pairs

    i = 0
    while i < len(letters):
        a = letters[i]
        b = letters[i + 1] if i + 1 < len(letters) else None
        if b is None or a == b:
            pairs.append(a + _filler(a))
            i += 1
        else:
            pairs.append(a + b)
            i += 2
    return pairs


def encipher_pair(pair: str, grid: list[list[str]], pos: dict, decrypt: bool) -> str:
    """Row rule, column rule, or rectangle rule, in that order of precedence."""
    step = -1 if decrypt else 1
    (r1, c1), (r2, c2) = pos[pair[0]], pos[pair[1]]

    if r1 == r2:  # same row: take the letter to the right (left when decrypting)
        return grid[r1][(c1 + step) % 5] + grid[r2][(c2 + step) % 5]
    if c1 == c2:  # same column: take the letter below (above when decrypting)
        return grid[(r1 + step) % 5][c1] + grid[(r2 + step) % 5][c2]
    # rectangle: swap columns, keep rows
    return grid[r1][c2] + grid[r2][c1]


def playfair(text: str, keyword: str, decrypt: bool = False) -> str:
    grid = build_grid(keyword)
    pos = positions(grid)
    pairs = to_pairs(text, decrypt)
    return " ".join(encipher_pair(p, grid, pos, decrypt) for p in pairs)


def run(text: str, params: dict, direction: str) -> str:
    return playfair(text, str(params["keyword"]), direction == "decrypt")


if __name__ == "__main__":
    print(playfair("Hide the gold in the tree stump", "PLAYFAIR EXAMPLE"))
