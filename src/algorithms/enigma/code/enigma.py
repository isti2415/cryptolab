"""Enigma (Wehrmacht M3).

A polyalphabetic substitution machine. The rotors step before every keypress,
so the substitution alphabet changes with each letter.

The reflector is what made it usable and what broke it. Sending the current
back through the rotors makes encryption and decryption the same operation --
but it also means no letter can ever encrypt to itself, and that single fact is
the crib Bletchley Park built its attack on.
"""

ROTORS = {
    "I": ("EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q"),
    "II": ("AJDKSIRUXBLHWTMCQGZNPYFVOE", "E"),
    "III": ("BDFHJLCPRTXVZNYEIWGAKMUSQO", "V"),
    "IV": ("ESOVPZJAYQUIRHXLNFTGKDCMWB", "J"),
    "V": ("VZBRGITYUPSDNHLXAWMJQOFECK", "Z"),
}

REFLECTORS = {
    "B": "YRUHQSLDPXNGOKMIEBFZCWVJAT",
    "C": "FVPJIAOYEDRZXWGCTKUQSBNMHL",
}


def _i(ch: str) -> int:
    return ord(ch) - 65


def _c(i: int) -> str:
    return chr(65 + i % 26)


def plug(pairs: list[tuple[str, str]], ch: str) -> str:
    for x, y in pairs:
        if ch == x:
            return y
        if ch == y:
            return x
    return ch


def forward(wiring: str, position: int, ring: int, c: int) -> int:
    """Right to left through a rotor, offset by its position and ring."""
    shift = position - ring
    return (_i(wiring[(c + shift) % 26]) - shift) % 26


def backward(wiring: str, position: int, ring: int, c: int) -> int:
    """Left to right: the same wiring read in the other direction."""
    shift = position - ring
    return (wiring.index(_c(c + shift)) - shift) % 26


def enigma(text, rotor_ids, reflector_id, positions, rings, pairs):
    wirings = [ROTORS[r][0] for r in rotor_ids]
    notches = [ROTORS[r][1] for r in rotor_ids]
    reflector = REFLECTORS[reflector_id]

    pos = [_i(p) for p in positions]
    ring = [_i(r) for r in rings]

    out = []
    for raw in text:
        if not raw.isalpha():
            out.append(raw)
            continue

        # Stepping happens before the current flows, and includes the
        # double-step anomaly: a middle rotor sitting on its own notch advances
        # again and carries the left rotor with it.
        if _c(pos[1]) == notches[1]:
            pos[0] = (pos[0] + 1) % 26
            pos[1] = (pos[1] + 1) % 26
        elif _c(pos[2]) == notches[2]:
            pos[1] = (pos[1] + 1) % 26
        pos[2] = (pos[2] + 1) % 26

        c = _i(plug(pairs, raw.upper()))
        for r in (2, 1, 0):
            c = forward(wirings[r], pos[r], ring[r], c)
        c = _i(reflector[c])
        for r in (0, 1, 2):
            c = backward(wirings[r], pos[r], ring[r], c)
        out.append(plug(pairs, _c(c)))

    return "".join(out)


def parse_pairs(raw: str) -> list[tuple[str, str]]:
    return [(t[0], t[1]) for t in raw.upper().split() if len(t) == 2]


def run(text: str, params: dict, direction: str) -> str:
    return enigma(
        text,
        str(params["rotors"]).split(),
        str(params["reflector"]).upper(),
        str(params["positions"]).upper(),
        str(params["rings"]).upper(),
        parse_pairs(str(params.get("plugboard", ""))),
    )


if __name__ == "__main__":
    print(enigma("AAAAA", ["I", "II", "III"], "B", "AAA", "AAA", []))  # BDZGO
