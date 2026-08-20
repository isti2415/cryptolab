import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Signatures from hash functions alone: the most conservative post-quantum option.',
  formula: [
    {
      label: "the chain",
      expr: "H applied cᵢ times to a secret value",
      note: "Each chain runs from a secret start to a public end, w−1 hashes apart. Publishing an intermediate point proves you knew the start, without revealing it, and a verifier can only walk forwards, because walking back means inverting the hash.",
    },
    {
      label: "WOTS+ signature",
      expr: "reveal each chain walked cᵢ of w−1 steps",
      note: "The message digest is split into chunks, and each chain is revealed exactly that far along. The verifier finishes each chain the remaining w−1−cᵢ steps and checks the ends against the public key.",
    },
    {
      label: "the checksum",
      expr: "Σ (w − 1 − cᵢ), appended as further chunks",
      note: "Without it, an attacker could take a signature and walk any chain further forward, forging a signature on a larger chunk value. The checksum moves the other way, so raising a message chunk necessarily lowers a checksum chunk, which would mean walking a chain backwards.",
    },
    {
      label: "the Merkle tree",
      expr: "node = H(left ‖ right), up to a single root",
      note: "WOTS+ can be used only once, so many one-time public keys are hashed pairwise into a tree and only the root is published. The root is the entire long-term public key, however many leaves sit beneath it.",
    },
    {
      label: "authentication path",
      expr: "one sibling per level, leaf to root",
      note: "The signature carries the siblings needed to climb from its leaf back to the root. A verifier reconstructs the leaf from the WOTS+ signature, walks up with the path, and checks the result equals the published root.",
    },
    {
      label: "what SLH-DSA adds",
      expr: "hypertree + FORS, to remove the state",
      note: "A single tree must remember which leaves are spent; reuse is a break, not a warning. FIPS 205 stacks trees and picks the leaf by hashing the message instead of counting, making the scheme stateless at the cost of much larger signatures.",
    },
  ],
  symbols: [
    { symbol: "H", meaning: "The underlying hash: the only assumption in the scheme" },
    { symbol: "w", meaning: "The Winternitz parameter: chain length, trading size against speed" },
    { symbol: "cᵢ", meaning: "The i-th chunk of the message digest, in base w" },
    { symbol: "leaf", meaning: "One WOTS+ public key, hashed to a single value" },
    { symbol: "root", meaning: "The top of the Merkle tree: the published public key" },
    { symbol: "‖", meaning: "Concatenation" },
  ],
  overview: [
    'Every other signature scheme rests on a number-theoretic assumption: factoring is hard, or discrete logarithms are, or lattice problems are. Hash-based signatures rest on nothing but the hash function. If the hash is secure, the signature is secure; there is no second assumption to be wrong about, which makes this the most conservative choice available and the only post-quantum standard whose security is genuinely well understood.',
    'The building block is WOTS+, a one-time signature. Start from a set of secret values and hash each of them w−1 times to get the public key. To sign, split the message digest into chunks and reveal each chain walked forward by exactly its chunk value. A verifier finishes each chain the remaining steps and checks the result matches the public key. They can walk forward; they cannot walk back, because that would mean inverting the hash.',
    'A checksum is what stops the obvious forgery. Without it, an attacker holding a signature could simply walk any chain further forward and produce a valid signature on a larger chunk value. The checksum chunks are computed to move in the opposite direction, so increasing any message chunk necessarily decreases a checksum chunk, and that would require walking a chain backwards.',
    'WOTS+ can only be used once, because a second signature reveals more of the chains and the two together allow forgery. A Merkle tree fixes that: hash many WOTS+ public keys pairwise up into a single root, and publish only the root. Each signature carries its leaf, the WOTS+ signature, and the sibling hashes needed to climb back to the root: the authentication path.',
    'The result is a public key of a few dozen bytes that authenticates thousands of signatures. What it costs is signature size and state: each leaf may be used exactly once, and something must remember which have been spent.',
    'SLH-DSA (FIPS 205) removes that bookkeeping. It stacks trees into a hypertree, and picks the leaf by hashing the message rather than counting, so no state is kept, at the price of much larger signatures. The machinery on this page is the part doing the work; SLH-DSA is this, layered.',
  ],
  history: [
    'Ralph Merkle proposed both halves in his 1979 PhD thesis: the one-time signature scheme and the tree that turns many one-time keys into a single public key. This predates RSA’s widespread use and almost everything else in modern cryptography.',
    'It was then largely ignored for thirty years. RSA and DSA signatures were far smaller and needed no state, and nobody was worried about the assumptions underneath them.',
    'Quantum computing changed the calculation. Shor’s algorithm breaks factoring and discrete logarithms outright, and hash functions are only weakened; Grover’s algorithm halves the effective security level, which is answered by doubling the output size. A construction that had looked like a curiosity became the safest thing available.',
    'The modern line runs through XMSS (RFC 8391, stateful) and LMS (RFC 8554), both standardised for use where state can be managed; firmware signing, for instance, where the signer is a controlled build system rather than a general-purpose device.',
    'SPHINCS+ made the scheme stateless and won a place in NIST’s post-quantum competition, standardised as SLH-DSA in FIPS 205 in August 2024. NIST’s stated reason for standardising it alongside the lattice-based ML-DSA was precisely the diversity of assumptions: if lattices turn out to be weaker than believed, hash-based signatures are unaffected.',
  ],
  weaknesses: [
    'Signatures are large. A WOTS+ signature is one hash value per chunk, plus the authentication path, and SLH-DSA’s stateless variants run from about 8 KB to 50 KB per signature, against 64 bytes for Ed25519. For a TLS handshake carrying several certificates, that is a real cost.',
    'Signing and verification are slow. SLH-DSA signing involves tens of thousands of hash evaluations, which is orders of magnitude more work than an elliptic-curve signature.',
    'State is a genuine hazard in the stateful variants. Reusing a one-time key is not a degradation but a break: two signatures under the same WOTS+ key reveal enough chain material to forge a third. A virtual machine snapshot, a restored backup or a crash at the wrong moment can silently reuse an index, which is why NIST restricts stateful variants to carefully controlled settings and why SLH-DSA was standardised instead.',
    'The number of signatures is capped by the tree. A height-h tree gives 2ʰ signatures and no more, so the parameter has to be chosen for the lifetime of the key.',
    'Grover’s algorithm halves the effective security of the underlying hash, so post-quantum parameters use larger outputs than a classical analysis would suggest. This is a known, quantified cost rather than an open question.',
    'Implementations must get domain separation right. Every hash call needs to be distinguished by its position in the structure, and getting that wrong allows values from one context to be replayed in another.',
    'What this lab shows is XMSS-shaped, a single stateful Merkle tree, rather than full SLH-DSA. The standard adds a hypertree of such trees plus FORS, a few-time signature, to select leaves by hashing the message rather than by counting. Those layers are what make it stateless, and without them a reused leaf index is a break rather than a warning.',
  ],
};
