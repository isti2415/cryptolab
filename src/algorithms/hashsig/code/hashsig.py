"""Hash-based signatures: WOTS+ one-time signatures under a Merkle tree.

The core of SLH-DSA (FIPS 205), the one NIST post-quantum standard built on
nothing but hash functions. No number theory, no lattices, no new hardness
assumption: if the hash is secure, the signature is secure.

Two ideas stacked. WOTS+ signs one message with one key by revealing partial
hash chains -- reuse the key and enough of the chains leak to forge. A Merkle
tree fixes the "one" by hashing many WOTS+ public keys into a single root.
"""

from sha256 import sha256

N = 4        # hash output kept short so values stay readable
W = 16       # Winternitz parameter: 4 bits per chunk
LEN1 = 8     # message chunks
LEN2 = 2     # checksum chunks
LEN = LEN1 + LEN2
HEIGHT = 3
LEAVES = 1 << HEIGHT


def H(*parts: str) -> str:
    """Domain-separated hash, truncated to N bytes."""
    return sha256("|".join(parts).encode())[: N * 2].upper()


def chain(value: str, start: int, count: int, address: str) -> str:
    for i in range(count):
        value = H("chain", f"{address}:{start + i}", value)
    return value


def to_chunks(digest: str) -> list[int]:
    """Split the digest into base-w chunks and append a checksum.

    The checksum is what makes this a signature. Without it an attacker could
    take a signature and walk any chain further forward, forging a signature on
    a larger chunk. The checksum moves the other way, so raising a message
    chunk lowers a checksum chunk -- and walking a chain backwards means
    inverting the hash.
    """
    chunks = [int(digest[i], 16) for i in range(LEN1)]
    checksum = sum(W - 1 - c for c in chunks)
    check = [(checksum >> (4 * (LEN2 - 1 - i))) % W for i in range(LEN2)]
    return chunks + check


def wots_secret(seed: str, leaf: int) -> list[str]:
    return [H("sk", seed, str(leaf), str(i)) for i in range(LEN)]


def wots_public(seed: str, leaf: int) -> str:
    ends = [
        chain(v, 0, W - 1, f"{leaf}:{i}")
        for i, v in enumerate(wots_secret(seed, leaf))
    ]
    return H("wotspk", *ends)


def build_tree(seed: str) -> list[list[str]]:
    levels = [[wots_public(seed, i) for i in range(LEAVES)]]
    for _ in range(HEIGHT):
        below = levels[-1]
        levels.append(
            [H("node", below[i], below[i + 1]) for i in range(0, len(below), 2)]
        )
    return levels


def sign(seed: str, leaf: int, message: str):
    """Reveal each chain as far as its chunk says, plus the sibling path."""
    chunks = to_chunks(H("msg", message))
    sk = wots_secret(seed, leaf)
    signature = [chain(v, 0, chunks[i], f"{leaf}:{i}") for i, v in enumerate(sk)]

    levels = build_tree(seed)
    path, index = [], leaf
    for level in range(HEIGHT):
        path.append(levels[level][index ^ 1])
        index >>= 1
    return signature, path


def recompute_root(leaf: int, message: str, signature, path) -> str:
    """Finish every chain, rebuild the leaf, climb to the root.

    No secret is needed and none is revealed -- the verifier only walks hashes
    forward, which is the direction they go.
    """
    chunks = to_chunks(H("msg", message))
    ends = [
        chain(v, chunks[i], W - 1 - chunks[i], f"{leaf}:{i}")
        for i, v in enumerate(signature)
    ]

    node, index = H("wotspk", *ends), leaf
    for sibling in path:
        node = H("node", node, sibling) if index % 2 == 0 else H("node", sibling, node)
        index >>= 1
    return node


def verify(root: str, leaf: int, message: str, signature, path) -> bool:
    return recompute_root(leaf, message, signature, path) == root


def run(text: str, params: dict, direction: str) -> str:
    seed, leaf = str(params["seed"]), int(params["leaf"])
    root = build_tree(seed)[HEIGHT][0]
    signature, path = sign(seed, leaf, text)

    # The decrypt direction demonstrates rejection by altering the message.
    checked = text + " " if direction == "decrypt" else text
    computed = recompute_root(leaf, checked, signature, path)
    if computed == root:
        return f"valid · root {root}"
    return f"invalid · expected {root}, got {computed}"


if __name__ == "__main__":
    root = build_tree("seed")[HEIGHT][0]
    sig, path = sign("seed", 0, "attack at dawn")
    print(verify(root, 0, "attack at dawn", sig, path))
