"""Learning With Errors -- Regev encryption, at toy parameters.

The foundation the lattice-based post-quantum standards rest on, reduced to
numbers you can check by hand.

One small change to a problem anyone can solve: given A and A*s, recovering s
is Gaussian elimination. Publish A*s + e instead, with every entry of e off by
one or two, and the same problem is believed hard for classical and quantum
computers alike.
"""

Q = 97
N = 4
M = 8


def make_random(seed: int):
    """A tiny deterministic generator, so a walkthrough can be revisited.

    This is not a source of cryptographic randomness and must never be used as
    one; a real scheme takes its randomness from the system.
    """
    state = seed & 0xFFFFFFFF or 1

    def nxt() -> int:
        nonlocal state
        state ^= (state << 13) & 0xFFFFFFFF
        state ^= state >> 17
        state ^= (state << 5) & 0xFFFFFFFF
        state &= 0xFFFFFFFF
        return state

    return nxt


def keygen(seed: int):
    """Secret s, public (A, b = A*s + e) with small e."""
    rnd = make_random(seed)
    s = [rnd() % Q for _ in range(N)]
    A = [[rnd() % Q for _ in range(N)] for _ in range(M)]
    e = [(rnd() % 5) - 2 for _ in range(M)]
    b = [
        (sum(A[i][j] * s[j] for j in range(N)) + e[i]) % Q for i in range(M)
    ]
    return s, A, b, e, rnd


def encrypt_bit(bit: int, A, b, rnd):
    """Add up a random subset of the published equations, then hide the bit.

    The sum is itself a valid noisy equation, so the ciphertext leaks no more
    than the public key already did.
    """
    r = [rnd() % 2 for _ in range(M)]
    u = [sum(r[k] * A[k][j] for k in range(M)) % Q for j in range(N)]
    v = (sum(r[k] * b[k] for k in range(M)) + bit * (Q // 2)) % Q
    return u, v


def decrypt_bit(u, v, s) -> int:
    """Subtract u*s and round to whichever of 0 and q/2 is nearer.

    Only the holder of s can compute u*s. The accumulated noise is far smaller
    than q/4, so the rounding is never in doubt -- if it ever grew past that,
    decryption would start returning wrong bits.
    """
    raw = (v - sum(u[j] * s[j] for j in range(N))) % Q
    return 1 if abs(raw - Q // 2) < min(raw, Q - raw) else 0


def round_trip(bits: str, seed: int) -> str:
    s, A, b, _, rnd = keygen(seed)
    out = []
    for ch in bits:
        u, v = encrypt_bit(int(ch), A, b, rnd)
        out.append(str(decrypt_bit(u, v, s)))
    return "".join(out)


def run(text: str, params: dict, direction: str) -> str:
    return round_trip(text.replace(" ", ""), int(params["seed"]))


if __name__ == "__main__":
    print(round_trip("10110", 12345))
