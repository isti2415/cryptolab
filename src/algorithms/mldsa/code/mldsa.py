"""ML-DSA (Dilithium), at toy parameters.

Signatures over the same Module-LWE algebra ML-KEM encrypts in, built on
"Fiat-Shamir with aborts": the signer produces a candidate and throws it away
if publishing it would leak the secret key, retrying until one is safe.

That rejection loop is the whole idea. A signature z = y + c*s1 carries s1
inside it; publishing every candidate would let an attacker average many
signatures and extract s1, which is how earlier lattice signature schemes were
broken.

NOT FIPS 204. Parameters are tiny and the challenge derivation is simplified.
"""

from sha256 import sha256

Q = 3329
N = 8
K = 2
L = 2
ETA = 2
GAMMA1 = 256
GAMMA2 = 128
TAU = 2
BETA = TAU * ETA


def centered(x: int) -> int:
    r = x % Q
    return r - Q if r > Q / 2 else r


def poly_mul(a, b):
    out = [0] * N
    for i in range(N):
        for j in range(N):
            k = i + j
            if k < N:
                out[k] = (out[k] + a[i] * b[j]) % Q
            else:
                out[k - N] = (out[k - N] - a[i] * b[j]) % Q
    return out


def poly_add(a, b):
    return [(x + y) % Q for x, y in zip(a, b)]


def poly_sub(a, b):
    return [(x - y) % Q for x, y in zip(a, b)]


def vec_dot(a, b):
    out = [0] * N
    for x, y in zip(a, b):
        out = poly_add(out, poly_mul(x, y))
    return out


def mat_vec(m, v):
    return [vec_dot(row, v) for row in m]


def high_bits(x: int) -> int:
    return round(centered(x) / (2 * GAMMA2))


def low_bits(x: int) -> int:
    return centered(x) - 2 * GAMMA2 * high_bits(x)


def vec_high(v):
    return [[high_bits(c) for c in p] for p in v]


def make_random(seed: int):
    state = seed & 0xFFFFFFFF or 1

    def nxt() -> int:
        nonlocal state
        state ^= (state << 13) & 0xFFFFFFFF
        state ^= state >> 17
        state ^= (state << 5) & 0xFFFFFFFF
        state &= 0xFFFFFFFF
        return state

    return nxt


def sample_noise(rnd):
    out = []
    for _ in range(N):
        bits = rnd()
        a = sum((bits >> i) & 1 for i in range(ETA))
        b = sum((bits >> (i + ETA)) & 1 for i in range(ETA))
        out.append(a - b)
    return out


def challenge(message: str, w1) -> list[int]:
    """A sparse polynomial with TAU coefficients of +-1.

    Sparse and tiny is what matters: c*s1 has to stay small enough for the
    bounds below to work.
    """
    material = message + "|" + ";".join(",".join(str(c) for c in p) for p in w1)
    digest = sha256(material.encode())
    c = [0] * N
    cursor = placed = 0
    while placed < TAU and cursor + 2 <= len(digest):
        position = int(digest[cursor], 16) % N
        sign = 1 if int(digest[cursor + 1], 16) % 2 == 0 else Q - 1
        cursor += 2
        if c[position] == 0:
            c[position] = sign
            placed += 1
    return c


def keygen(rnd):
    A = [[[rnd() % Q for _ in range(N)] for _ in range(L)] for _ in range(K)]
    s1 = [sample_noise(rnd) for _ in range(L)]
    s2 = [sample_noise(rnd) for _ in range(K)]
    t = [poly_add(p, s2[i]) for i, p in enumerate(mat_vec(A, s1))]
    return A, s1, s2, t


def sign(A, s1, s2, message: str, rnd):
    """Retry until a candidate clears both bounds.

    The bounds protect the secret, not the verifier: too large a z means the
    signature's distribution depends on s1.
    """
    for attempt in range(1, 65):
        y = [
            [centered_range(rnd() % (2 * GAMMA1)) for _ in range(N)]
            for _ in range(L)
        ]
        w = mat_vec(A, y)
        w1 = vec_high(w)
        c = challenge(message, w1)

        z = [poly_add(y[i], poly_mul(c, s1[i])) for i in range(L)]
        low = [poly_sub(w[i], poly_mul(c, s2[i])) for i in range(K)]

        z_norm = max(abs(centered(x)) for p in z for x in p)
        low_norm = max(abs(low_bits(x)) for p in low for x in p)

        if z_norm < GAMMA1 - BETA and low_norm < GAMMA2 - BETA:
            return z, c, attempt
    raise ValueError("rejection sampling did not converge")


def centered_range(x: int) -> int:
    """Fold a value into (-GAMMA1, GAMMA1]."""
    return x - 2 * GAMMA1 if x > GAMMA1 else x


def verify(A, t, message: str, z, c) -> bool:
    """A*z - c*t = A*y - c*s2, which rounds to the same high bits as w."""
    if max(abs(centered(x)) for p in z for x in p) >= GAMMA1 - BETA:
        return False
    az = mat_vec(A, z)
    ct = [poly_mul(c, p) for p in t]
    w1 = vec_high([poly_sub(az[i], ct[i]) for i in range(K)])
    return challenge(message, w1) == c


def run(text: str, params: dict, direction: str) -> str:
    rnd = make_random(int(params["seed"]))
    A, s1, s2, t = keygen(rnd)
    z, c, attempts = sign(A, s1, s2, text, rnd)

    checked = text + " " if direction == "decrypt" else text
    if verify(A, t, checked, z, c):
        return f"valid · {attempts} signing attempt{'' if attempts == 1 else 's'}"
    return "invalid · challenge mismatch"


if __name__ == "__main__":
    print(run("attack at dawn", {"seed": 12345}, "encrypt"))
