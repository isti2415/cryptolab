"""ML-KEM (Kyber), at toy parameters.

A key encapsulation mechanism over Module-LWE: rather than encrypting a
message, it produces a shared secret plus a ciphertext that lets the key holder
recover it.

Kyber is LWE with the flat matrix of numbers replaced by a small matrix of
polynomials. A plain LWE public key grows with the square of the dimension; a
rank-k module over a degree-n ring carries the same weight in k*k polynomials,
which is what brings the keys down to about a kilobyte.

NOT FIPS 203. Parameters here are n=8, k=2 against the standard's n=256, and
this implements only the CPA-secure core without the Fujisaki-Okamoto
transform that makes real ML-KEM CCA-secure.
"""

Q = 3329
N = 8
K = 2
ETA = 2
HALF = round(Q / 2)


def poly_mul(a, b):
    """Negacyclic: terms passing degree n wrap round with the sign flipped."""
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


def transpose(m):
    return [[row[i] for row in m] for i in range(len(m))]


def make_random(seed: int):
    """Deterministic, so a walkthrough can be revisited. Not cryptographic."""
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
    """Centered binomial: the difference of two counts of random bits.

    Kyber samples noise this way rather than from a discrete Gaussian because
    it is far easier to do in constant time -- and the noise is secret, so
    constant time matters.
    """
    out = []
    for _ in range(N):
        bits = rnd()
        a = sum((bits >> i) & 1 for i in range(ETA))
        b = sum((bits >> (i + ETA)) & 1 for i in range(ETA))
        out.append(a - b)
    return out


def centered(x: int) -> int:
    r = x % Q
    return r - Q if r > Q / 2 else r


def keygen(rnd):
    A = [[[rnd() % Q for _ in range(N)] for _ in range(K)] for _ in range(K)]
    s = [sample_noise(rnd) for _ in range(K)]
    e = [sample_noise(rnd) for _ in range(K)]
    t = [poly_add(p, e[i]) for i, p in enumerate(mat_vec(A, s))]
    return A, s, t


def encapsulate(A, t, bits, rnd):
    """Fresh noise every time, so two encapsulations are unrelated."""
    r = [sample_noise(rnd) for _ in range(K)]
    e1 = [sample_noise(rnd) for _ in range(K)]
    e2 = sample_noise(rnd)

    u = [poly_add(p, e1[i]) for i, p in enumerate(mat_vec(transpose(A), r))]
    encoded = [b * HALF for b in bits]
    v = poly_add(poly_add(vec_dot(t, r), e2), encoded)
    return u, v


def decapsulate(s, u, v):
    """Subtract the secret part and round each coefficient to 0 or q/2."""
    raw = poly_sub(v, vec_dot(s, u))
    out = []
    for coefficient in raw:
        value = centered(coefficient)
        out.append(1 if abs(abs(value) - HALF) < abs(value) else 0)
    return out


def round_trip(bits: str, seed: int) -> str:
    rnd = make_random(seed)
    A, s, t = keygen(rnd)
    u, v = encapsulate(A, t, [int(b) for b in bits], rnd)
    return "".join(str(b) for b in decapsulate(s, u, v))


def run(text: str, params: dict, direction: str) -> str:
    return round_trip(text.replace(" ", ""), int(params["seed"]))


if __name__ == "__main__":
    print(round_trip("10110011", 12345))
