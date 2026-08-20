import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Diffie–Hellman on a curve: the same idea, in a group where attacks work far worse.',
  formula: [
    {
      label: "the curve",
      expr: "y² = x³ + ax + b  (mod p)",
      note: "The points satisfying this equation, plus a point at infinity, form a group. Over the real numbers it is a smooth arc; over a finite field it is the scatter of dots on this page, and the algebra is identical.",
    },
    {
      label: "adding two points",
      expr: "λ = (y₂ − y₁)/(x₂ − x₁);   x₃ = λ² − x₁ − x₂;   y₃ = λ(x₁ − x₃) − y₁",
      note: "Geometrically: draw the line through the two points, find the third place it meets the curve, and reflect that across the horizontal axis. The division is a modular inverse, not ordinary division.",
    },
    {
      label: "doubling a point",
      expr: "λ = (3x₁² + a)/(2y₁)",
      note: "The same formulas with the tangent in place of the chord: the limiting case when the two points coincide. Everything after λ is unchanged.",
    },
    {
      label: "scalar multiplication",
      expr: "k·P by double-and-add",
      note: "Walk the bits of k, doubling the accumulator each step and adding P where a bit is set. This is the elliptic counterpart of square-and-multiply, and recovering k from k·P is the elliptic-curve discrete logarithm problem.",
    },
    {
      label: "the exchange",
      expr: "a·(b·G) = b·(a·G)",
      note: "Identical in shape to ordinary Diffie–Hellman. Each side multiplies the point they received by their own scalar, and both land on the same point.",
    },
    {
      label: "why curves are smaller",
      expr: "no index calculus is known",
      note: "Discrete logarithms in a finite field fall to index calculus, which is sub-exponential. Nothing equivalent is known for curves (the best general attack is Pollard’s rho at the square root of the group order), so a 256-bit curve gives roughly what a 3072-bit prime group gives.",
    },
  ],
  symbols: [
    { symbol: "p", meaning: "the field modulus; all coordinates are numbers mod p" },
    { symbol: "a, b", meaning: "the curve’s coefficients, fixed and public" },
    { symbol: "G", meaning: "the generator, a published base point" },
    { symbol: "λ", meaning: "the slope of the chord or tangent" },
    { symbol: "∞", meaning: "the point at infinity: the group’s identity element" },
    { symbol: "k·P", meaning: "P added to itself k times" },
  ],
  overview: [
    'Elliptic-curve cryptography runs the Diffie–Hellman idea in a different group. Rather than multiplying numbers modulo a prime, you add points on a curve; rather than recovering an exponent from a power, an attacker has to recover a scalar k from the point k·G.',
    'The group law is geometric, at least over the real numbers. To add two points, draw the line through them, find the third place it meets the curve, and reflect that across the horizontal axis. To double a point, use the tangent instead. The point at infinity acts as the identity, and reflecting a point gives its inverse.',
    'Over a finite field the picture shatters; the plot on this page is what an elliptic curve mod p actually looks like, a scatter of dots rather than a smooth arc. The algebra is unchanged, and the symmetry about the middle is still visible, because that reflection is exactly what gives every point an inverse. It is worth seeing the real thing rather than the textbook arc, which quietly stops being true the moment the field is finite.',
    'Scalar multiplication uses double-and-add, the direct counterpart of square-and-multiply: walk the bits of k, double the accumulator each step, and add the base point where the bit is set. Cost scales with the number of bits in k, not its value.',
    'The reason to bother is size. Attacking a discrete logarithm in a finite field can use index calculus, which is sub-exponential; no equivalent is known for elliptic curves, where the best general attack is Pollard’s rho at the square root of the group order. So a 256-bit curve gives roughly what a 3072-bit prime group gives; smaller keys, smaller signatures, less computation.',
    'The curves here are absurdly small so that every point fits on a screen. Real curves have around 2²⁵⁶ points, and nothing about the arithmetic changes.',
  ],
  history: [
    'Neal Koblitz and Victor Miller independently proposed using elliptic curves for cryptography in 1985. The mathematics was already well developed (elliptic curves had been studied for over a century, and had recently been central to Wiles’s proof of Fermat’s Last Theorem), but the cryptographic application was new.',
    'Adoption was slow for two decades, partly through unfamiliarity and partly through a thicket of patents held by Certicom. RSA was understood, implemented and unencumbered by comparison.',
    'NIST standardised a set of curves in 2000, including P-256, which became the default in TLS. Their generation process was never fully explained, and after the 2013 Snowden disclosures (which revealed the Dual_EC_DRBG backdoor); that opacity became a real problem for confidence.',
    'The response was curves designed transparently. Daniel J. Bernstein’s Curve25519, published in 2006, chose every parameter by a stated rule and was built to make implementation mistakes hard: no invalid-curve attacks, no point validation to forget, constant-time by construction. It was standardised as RFC 7748 in 2016 and is now the default in Signal, WireGuard, SSH and TLS 1.3.',
    'Bitcoin uses secp256k1, a Koblitz curve chosen for fast computation and, notably, not one of the NIST curves. That choice looked idiosyncratic in 2009 and looks prescient now.',
  ],
  weaknesses: [
    'It authenticates nothing, exactly like ordinary Diffie–Hellman. An active attacker can run separate exchanges with each side and sit in the middle reading everything. ECDH must be combined with signatures or certificates.',
    'Invalid-curve attacks are the classic implementation failure. If an implementation accepts a public point without checking it lies on the curve, an attacker can send a point on a different, weaker curve and recover the private scalar from the results. This has broken real TLS and Bluetooth implementations. Curve25519 is designed so that this class of mistake cannot occur.',
    'Naive double-and-add leaks the scalar through timing, because the add only happens on set bits. Private keys have been recovered from timing and power traces of exactly this loop; production implementations use ladders that perform identical operations regardless of the bit.',
    'Small-subgroup and twist attacks exploit curves or points whose order has small factors. Cofactor clearing and careful curve choice address these, and getting either wrong silently reduces the effective key size.',
    'Bad randomness is catastrophic for the signature variant. ECDSA requires a fresh random nonce per signature; reuse reveals the private key outright, which is how the Sony PlayStation 3 signing key was extracted in 2010. Deterministic nonce generation (RFC 6979) or Ed25519 avoids the whole problem.',
    'Shor’s algorithm breaks elliptic curves as completely as it breaks RSA, in fact rather more easily, because the smaller key sizes need fewer qubits. Curves are not more quantum-resistant than factoring; they are less.',
  ],
};
