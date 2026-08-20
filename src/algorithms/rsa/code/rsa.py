"""RSA, textbook, for teaching only.

From two primes p and q: n = p*q, phi(n) = (p-1)(q-1), a public exponent e
coprime with phi, and the private exponent d = e^-1 mod phi. Then encryption is
c = m^e mod n and decryption m = c^d mod n.

This is deliberately NOT how RSA is used for real. It is deterministic, the
same message always gives the same ciphertext, and malleable, because
(m1*m2)^e = c1*c2. Real RSA wraps the message in randomised padding (OAEP for
encryption, PSS for signatures) precisely to destroy both properties. Encrypting
one character at a time, as here, is the worst case: 26 possible ciphertexts per
letter makes it a substitution cipher with extra arithmetic.
"""

def is_probable_prime(n: int) -> bool:
    """Miller-Rabin. Deterministic below 3.3e24 with these witnesses."""
    witnesses = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]
    if n < 2:
        return False
    for p in witnesses:
        if n == p:
            return True
        if n % p == 0:
            return False

    d, s = n - 1, 0
    while d % 2 == 0:
        d //= 2
        s += 1

    for a in witnesses:
        x = pow(a, d, n)
        if x in (1, n - 1):
            continue
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1:
                break
        else:
            return False
    return True


def mod_inverse(a: int, m: int) -> int:
    """Extended Euclidean algorithm; this is where d comes from."""
    old_r, r = a % m, m
    old_s, s = 1, 0
    while r:
        q = old_r // r
        old_r, r = r, old_r - q * r
        old_s, s = s, old_s - q * s
    if old_r != 1:
        raise ValueError(f"{a} has no inverse mod {m}")
    return old_s % m


def modpow(base: int, exp: int, mod: int) -> int:
    """Square and multiply, written out rather than calling pow().

    Nobody computes m^65537 with 65537 multiplications: the exponent is walked
    bit by bit, squaring each step and folding the base into the result only
    where a bit is set. Cost scales with the *size* of the exponent, not its
    value.
    """
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = result * base % mod
        exp >>= 1
        base = base * base % mod
    return result


def keygen(p: int, q: int, e: int) -> tuple[int, int, int]:
    """Returns (n, e, d). Raises if the parameters cannot form a valid key."""
    if not is_probable_prime(p):
        raise ValueError(f"p = {p} is not prime")
    if not is_probable_prime(q):
        raise ValueError(f"q = {q} is not prime")
    if p == q:
        raise ValueError("p and q must be two different primes")

    n = p * q
    phi = (p - 1) * (q - 1)
    if not 1 < e < phi:
        raise ValueError(f"e must satisfy 1 < e < phi(n) = {phi}")
    return n, e, mod_inverse(e, phi)


def encrypt(text: str, p: int, q: int, e: int) -> str:
    n, e, _ = keygen(p, q, e)
    out = []
    for ch in text:
        m = ord(ch)
        if m >= n:
            raise ValueError(
                f"character {ch!r} has code {m}, which is >= n = {n}; "
                "textbook RSA needs n larger than every message value"
            )
        out.append(str(modpow(m, e, n)))
    return " ".join(out)


def decrypt(text: str, p: int, q: int, e: int) -> str:
    n, _, d = keygen(p, q, e)
    return "".join(chr(modpow(int(tok), d, n)) for tok in text.split())


def run(text: str, params: dict, direction: str) -> str:
    p, q, e = int(params["p"]), int(params["q"]), int(params["e"])
    return decrypt(text, p, q, e) if direction == "decrypt" else encrypt(text, p, q, e)


if __name__ == "__main__":
    print(encrypt("Hi", 61, 53, 17))  # 3000 3179
    print(decrypt("3000 3179", 61, 53, 17))  # Hi
