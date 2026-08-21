import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  formula: [
    {
      label: "keys",
      expr: "t = A·s₁ + s₂,  both small",
      note: "The same Module-LWE relation ML-KEM uses. The private key is the pair of small vectors; the public key is A and t, and recovering s₁ from t is the hard problem.",
    },
    {
      label: "commit",
      expr: "w = A·y,  for a fresh random y",
      note: "y is the masking vector. It must be new for every signature; reusing one across two signatures lets an attacker subtract them and recover the secret, the same failure that exposed the PlayStation 3 signing key through ECDSA.",
    },
    {
      label: "challenge",
      expr: "c = H(m, HighBits(w))",
      note: "A sparse polynomial with only a handful of ±1 coefficients, derived from the message and the rounded commitment. Sparseness matters: c·s₁ and c·s₂ must stay small for the bounds below to work.",
    },
    {
      label: "respond",
      expr: "z = y + c·s₁",
      note: "The response carries the secret inside it, masked by y. This is exactly why the next line exists.",
    },
    {
      label: "reject unless",
      expr: "‖z‖∞ < γ₁ − β   and   ‖LowBits(w − c·s₂)‖∞ < γ₂ − β",
      note: "Candidates outside these bounds have a distribution that depends on s₁, so publishing them would leak the key over many signatures. Discarding them is the mechanism, not an error path, and it is why signing takes a variable number of attempts.",
    },
    {
      label: "verify",
      expr: "HighBits(A·z − c·t) = HighBits(w)",
      note: "A·z − c·t works out to A·y − c·s₂, differing from the signer’s w only by the small term c·s₂; small enough that rounding to high bits erases it. Re-deriving the challenge from those high bits must reproduce c.",
    },
  ],
  symbols: [
    { symbol: "A", meaning: "A public matrix of polynomials" },
    { symbol: "s₁, s₂", meaning: "The small secret vectors making up the private key" },
    { symbol: "y", meaning: "The masking vector; fresh, random, and never reused" },
    { symbol: "c", meaning: "The challenge: sparse, with τ coefficients of ±1" },
    { symbol: "z", meaning: "The published response, and half the signature" },
    { symbol: "γ₁, γ₂", meaning: "The bound on y and the high-bit rounding granularity" },
    { symbol: "β", meaning: "The largest c·s can be, what the bounds must absorb" },
    { symbol: "‖·‖∞", meaning: "The largest absolute coefficient" },
  ],
  overview: [
    'ML-DSA signs using the same Module-LWE algebra ML-KEM encrypts in. The private key is a pair of small vectors s₁ and s₂; the public key is a matrix A and t = A·s₁ + s₂. Recovering s₁ from t is the same hard problem in both schemes.',
    'Signing follows the Fiat–Shamir pattern. Commit by computing w = A·y for a random masking vector y, derive a challenge c by hashing the message together with the high bits of w, and respond with z = y + c·s₁. A verifier recomputes A·z − c·t, which equals A·y − c·s₂; differing from the signer’s w only by the small term c·s₂, small enough that rounding to high bits erases it entirely.',
    'The distinctive part is the "with aborts". The response z contains c·s₁, so its distribution depends on the secret key. Publishing every candidate would let an attacker collect signatures and average out the mask, recovering s₁, which is exactly how earlier lattice signature schemes such as NTRUSign were broken. ML-DSA therefore checks each candidate against two bounds and discards it if either fails, retrying with a fresh mask.',
    'Rejection is the mechanism, not an error path. The bounds are chosen so that whatever survives them has a distribution independent of the secret key, so a published signature reveals nothing about s₁ no matter how many are collected. The price is that signing takes a variable number of attempts and therefore has no fixed running time.',
    'The challenge is deliberately sparse (only a handful of ±1 coefficients), because c·s₁ and c·s₂ have to stay small for the bounds and the high-bit rounding to work. Everything in the parameter set is a negotiation between that smallness and the security level.',
  ],
  history: [
    'The "Fiat–Shamir with aborts" technique is Vadim Lyubashevsky’s, published in 2009. It was the answer to a specific embarrassment: earlier lattice signature schemes, notably GGH and NTRUSign, leaked their private keys through the signature distribution, and NTRUSign was broken by exactly that route. Rejection sampling removed the leak by construction.',
    'Dilithium was submitted to NIST’s post-quantum competition in 2017 by Léo Ducas, Eike Kiltz, Tancrède Lepoint, Vadim Lyubashevsky, Peter Schwabe, Gregor Seiler and Damien Stehlé, largely the same team behind Kyber, and deliberately so, since sharing the underlying assumption and much of the arithmetic simplifies implementing both.',
    'NIST selected it in July 2022 as the primary signature standard, published as FIPS 204, ML-DSA, in August 2024. Two others were standardised alongside it: SLH-DSA (FIPS 205), built only on hash functions, and FN-DSA/Falcon, which has smaller signatures but is notoriously difficult to implement in constant time because it needs floating-point Gaussian sampling.',
    'NIST’s guidance is to prefer ML-DSA by default and reach for SLH-DSA where a completely different assumption is wanted. That deliberate diversity is the lesson of the competition: if lattices turn out weaker than believed, hash-based signatures are untouched.',
  ],
  weaknesses: [
    'Signing has no fixed running time. The number of rejected candidates varies with the key and the message, and a naive implementation leaks information through that timing. Constant-time implementations must mask the loop rather than let it run visibly.',
    'The masking vector must be fresh and unpredictable for every signature. Reuse across two signatures allows subtracting them to recover c·s₁ and from there the key: the same failure mode that exposed the PlayStation 3 signing key through ECDSA nonce reuse. Deterministic derivation of y from the message and key avoids relying on a randomness source at signing time.',
    'Signatures are large. ML-DSA-65 produces about 3.3 KB, against 64 bytes for Ed25519, and public keys run to nearly 2 KB. For certificate chains, where several signatures appear in a single handshake, that adds up quickly.',
    'It rests on Module-LWE and Module-SIS, which carry more algebraic structure than plain lattice problems. No attack exploits it, but the assumption is younger and stronger than the ones it replaces.',
    'Fault attacks are a documented concern. Inducing a fault during signing (skipping a rejection check, or corrupting an intermediate) can produce a signature that leaks key material, and implementations on hardware an attacker can touch need explicit countermeasures.',
    'Security estimates depend on lattice reduction cost models that are still being refined, so quoted levels have shifted over time and may shift again.',
    'This lab is Dilithium’s structure at toy parameters and is explicitly not FIPS 204. The ring degree is 8 rather than 256, the module is rank 2, the bounds are scaled to match, and the challenge derivation is simplified, so it produces none of the standard’s test vectors. The seeded generator is a further simplification: a real signer must never derive its masking vector predictably, because doing so reveals the private key.',
  ],
  sources: [
    {
      label: 'FIPS 204: ML-DSA',
      url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf',
      note: 'The standard this page models the structure of, and is explicitly not.',
    },
  ],
};
