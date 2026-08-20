"""Diffie-Hellman key exchange.

Two parties agree a shared secret over a channel an eavesdropper is watching,
without ever transmitting anything that reveals it. The whole thing rests on
exponentiation commuting: (g^b)^a and (g^a)^b are the same number.
"""


def modpow(base: int, exp: int, mod: int) -> int:
    """Square and multiply, written out rather than calling pow()."""
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = result * base % mod
        exp >>= 1
        base = base * base % mod
    return result


def public_value(g: int, secret: int, p: int) -> int:
    """What each side publishes: g raised to its own private exponent.

    Recovering `secret` from this is the discrete logarithm problem, easy in
    one direction, believed infeasible in the other for large p.
    """
    return modpow(g, secret, p)


def shared_secret(received: int, secret: int, p: int) -> int:
    """Raise the value the other side sent to your own private exponent."""
    return modpow(received, secret, p)


def exchange(p: int, g: int, a: int, b: int) -> int:
    """A full exchange, from both sides, checking they agree.

    In practice the result is never used as a key directly: its bits are not
    uniformly distributed, so it goes through a key derivation function first.
    """
    A = public_value(g, a, p)
    B = public_value(g, b, p)

    alice = shared_secret(B, a, p)
    bob = shared_secret(A, b, p)
    assert alice == bob
    return alice


def run(text: str, params: dict, direction: str) -> str:
    return str(
        exchange(
            int(params["p"]), int(params["g"]), int(params["a"]), int(params["b"])
        )
    )


if __name__ == "__main__":
    print(exchange(23, 5, 6, 15))
