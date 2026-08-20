import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Two strangers agree a shared secret in public, without ever sending it.',
  formula: [
    {
      label: "public setup",
      expr: "p prime, g a generator mod p",
      note: "Both agreed in the open, standardised, and identical for everyone using the group. Neither is secret; publishing them gives an attacker nothing.",
    },
    {
      label: "Alice sends",
      expr: "A = gᵃ mod p",
      note: "She raises the generator to her private exponent. Recovering a from A is the discrete logarithm problem; easy to compute forwards, believed infeasible to reverse for large p.",
    },
    {
      label: "Bob sends",
      expr: "B = gᵇ mod p",
      note: "The same, with his own exponent. Only A and B cross the wire; a and b never leave their machines.",
    },
    {
      label: "both derive",
      expr: "Bᵃ = (gᵇ)ᵃ = g^(ab) = (gᵃ)ᵇ = Aᵇ",
      note: "Exponentiation commutes, so the two sides land on the same number without ever transmitting it. That single identity is the whole scheme.",
    },
    {
      label: "computing it",
      expr: "square-and-multiply, one step per exponent bit",
      note: "Nobody multiplies g by itself a times. Walk the bits of the exponent, squaring each step and folding the base in where a bit is set; cost scales with the size of the exponent, not its value.",
    },
    {
      label: "what it does not do",
      expr: "no authentication",
      note: "An active attacker can run one exchange with each side and sit in the middle. Diffie–Hellman must be combined with signatures or certificates; TLS signs the exchange for exactly this reason.",
    },
  ],
  symbols: [
    { symbol: "p", meaning: "A large public prime: the modulus" },
    { symbol: "g", meaning: "The public generator; its powers must cover a large subgroup" },
    { symbol: "a, b", meaning: "The private exponents, one per party, never transmitted" },
    { symbol: "A, B", meaning: "The public values that cross the channel" },
    { symbol: "g^(ab)", meaning: "The shared secret; hashed through a KDF before use as a key" },
  ],
  overview: [
    'Diffie–Hellman solves a problem every cipher before it simply assumed away. Symmetric encryption needs both parties to already share a key, but if they can already exchange a secret safely, they hardly needed the cipher. Diffie–Hellman lets two parties who have never met, talking over a channel an adversary is recording, end up holding the same secret number.',
    'Both sides agree publicly on a prime p and a generator g. Alice picks a private exponent a and publishes A = gᵃ mod p; Bob picks b and publishes B = gᵇ mod p. Alice then computes Bᵃ and Bob computes Aᵇ. Because (gᵇ)ᵃ and (gᵃ)ᵇ are both g^(a·b), they arrive at the same value.',
    'An eavesdropper sees p, g, A and B (every byte that crossed the wire), and needs a or b to finish the calculation. Extracting the exponent from gᵃ mod p is the discrete logarithm problem, and no efficient classical algorithm for it is known. The gap between computing a power and undoing one is the entire security argument.',
    'It is a key agreement, not encryption. Nothing is transmitted confidentially and no message is protected; the output is a number both sides now hold. That number is never used as a key directly either; its bits are not uniformly distributed, so it goes through a key derivation function first, and the resulting key is what encrypts anything.',
  ],
  history: [
    'Whitfield Diffie and Martin Hellman published "New Directions in Cryptography" in 1976, introducing both the key exchange and the concept of public-key cryptography. They had the idea of asymmetry before anyone had a working encryption scheme built on it; RSA arrived the following year.',
    'Ralph Merkle had proposed a related construction, now called Merkle puzzles, as an undergraduate, and his contribution is why Hellman later argued the scheme should be called Diffie–Hellman–Merkle.',
    'It had, as with RSA, been discovered earlier in secret. Malcolm Williamson at GCHQ found the same construction in 1974, building on James Ellis’s 1970 proposal of "non-secret encryption". None of it could be published, and the work was declassified only in 1997.',
    'Diffie and Hellman received the Turing Award in 2015. The exchange itself became foundational infrastructure: it underpins TLS, SSH, IPsec and Signal, and the ephemeral variant is what gives modern connections forward secrecy.',
    'The 2015 Logjam paper changed how it is deployed. It showed that a well-resourced attacker could precompute against one widely reused 1024-bit prime and then break individual connections cheaply, and that a handful of primes covered a large share of the internet. The response was larger groups, and a shift toward elliptic-curve Diffie–Hellman with standardised curves.',
  ],
  weaknesses: [
    'It authenticates nothing, and that is the failure people actually hit. An active attacker sitting in the middle runs one exchange with Alice and another with Bob, ending up sharing a different secret with each. Both sides believe they are talking privately to the other; the attacker relays and reads everything. Diffie–Hellman must be combined with signatures or certificates; TLS signs the exchange precisely for this reason.',
    'Small or badly chosen groups are breakable. The discrete logarithm gets easier as p shrinks, and 512-bit groups fell to Logjam in minutes. Worse, the expensive part of the attack depends only on p, so an attacker who precomputes against a commonly reused prime can then break many connections cheaply. Reusing standard groups is efficient for implementers and a gift to well-funded adversaries.',
    'The generator matters as much as the modulus. If g generates only a small subgroup, the shared secret takes few possible values and an attacker enumerates them. Related small-subgroup confinement attacks work by sending a deliberately bad public value, which is why implementations must validate what they receive rather than exponentiating it blindly.',
    'Static exponents destroy forward secrecy. If the same private exponent is reused across sessions, recovering it once retroactively decrypts every recorded past session. Ephemeral Diffie–Hellman generates fresh exponents per connection so that a later key compromise does not reach backwards, and that property is much of why it is preferred today.',
    'The raw shared secret is not a key. Its bits are biased and it may have algebraic structure, so using it directly weakens whatever cipher consumes it. A key derivation function is mandatory, not a nicety.',
    'Shor’s algorithm breaks the discrete logarithm as thoroughly as it breaks factoring, so a sufficiently large quantum computer defeats Diffie–Hellman outright. Traffic recorded today can be decrypted later, which is why deployments are moving to hybrid exchanges combining a classical group with a post-quantum KEM.',
  ],
};
