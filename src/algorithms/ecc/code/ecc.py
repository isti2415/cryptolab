"""Elliptic-curve Diffie-Hellman.

The same idea as ordinary Diffie-Hellman in a different group: instead of
multiplying numbers modulo a prime, add points on a curve. The hard problem
becomes recovering k from k*G rather than an exponent from a power.

The payoff is size. No index-calculus shortcut is known for elliptic curves, so
a 256-bit curve gives roughly the security of a 3072-bit prime group.
"""


def inverse(a: int, p: int) -> int:
    return pow(a % p, -1, p)


def on_curve(point, p: int, a: int, b: int) -> bool:
    if point is None:
        return True
    x, y = point
    return (y * y - (x * x * x + a * x + b)) % p == 0


def add(P, Q, p: int, a: int):
    """The group law: line through two points, third intersection, reflected.

    None is the point at infinity, the identity of the group.
    """
    if P is None:
        return Q
    if Q is None:
        return P

    if P[0] == Q[0] and (P[1] + Q[1]) % p == 0:
        return None

    if P == Q:
        lam = (3 * P[0] * P[0] + a) * inverse(2 * P[1], p) % p
    else:
        lam = (Q[1] - P[1]) * inverse(Q[0] - P[0], p) % p

    x = (lam * lam - P[0] - Q[0]) % p
    y = (lam * (P[0] - x) - P[1]) % p
    return (x, y)


def multiply(k: int, P, p: int, a: int):
    """Double-and-add, the elliptic counterpart of square-and-multiply.

    The add is conditional on the bit, so a naive implementation takes a
    different amount of time depending on the secret scalar. Real private keys
    have been recovered from exactly that timing difference; production code
    uses a ladder that performs the same operations either way.
    """
    result = None
    for bit in bin(k)[2:]:
        result = add(result, result, p, a)
        if bit == "1":
            result = add(result, P, p, a)
    return result


def exchange(p: int, a_coeff: int, b_coeff: int, G, alice: int, bob: int):
    """A full ECDH exchange, from both sides, checking they agree."""
    A = multiply(alice, G, p, a_coeff)
    B = multiply(bob, G, p, a_coeff)

    shared_alice = multiply(alice, B, p, a_coeff)
    shared_bob = multiply(bob, A, p, a_coeff)
    assert shared_alice == shared_bob
    return shared_alice


CURVES = {
    "tiny": (17, 0, 7, (6, 6)),
    "small": (263, 1, 1, (3, 89)),
}


def run(text: str, params: dict, direction: str) -> str:
    p, a_coeff, b_coeff, G = CURVES[str(params["curve"])]
    point = exchange(p, a_coeff, b_coeff, G, int(params["a"]), int(params["b"]))
    return "∞" if point is None else f"({point[0]}, {point[1]})"


if __name__ == "__main__":
    p, a, b, G = CURVES["small"]
    print(exchange(p, a, b, G, 47, 131))
