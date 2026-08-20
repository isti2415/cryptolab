import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Compress any message to 256 bits, with no way back.',
  formula: [
    {
      label: "the round",
      expr: "T₁ = h + Σ₁(e) + Ch(e,f,g) + Kₜ + Wₜ;   T₂ = Σ₀(a) + Maj(a,b,c)",
      note: "Two quantities per round. Every register then shifts down one place, with T₁ folded into e and T₁ + T₂ becoming the new a, so the whole eight-register state turns over 64 times.",
    },
    {
      label: "choice and majority",
      expr: "Ch(e,f,g) = (e ∧ f) ⊕ (¬e ∧ g);   Maj(a,b,c) = (a∧b) ⊕ (a∧c) ⊕ (b∧c)",
      note: "Ch takes bits from f where e is 1 and from g where it is 0. Maj takes whichever bit two of the three agree on. Neither is reversible, which is what stops the round chain running backwards.",
    },
    {
      label: "message schedule",
      expr: "Wₜ = σ₁(Wₜ₋₂) + Wₜ₋₇ + σ₀(Wₜ₋₁₅) + Wₜ₋₁₆",
      note: "Only the first sixteen words come from the block; the other 48 are each built from four earlier ones. This is what spreads a single input bit across the whole computation, so changing one byte perturbs almost every round.",
    },
    {
      label: "padding",
      expr: "m ‖ 1 ‖ 0…0 ‖ len(m) as 64 bits",
      note: "Append a single 1 bit, then zeros, then the original length. Encoding the length is what stops two different messages padding into the same block sequence.",
    },
    {
      label: "feed-forward",
      expr: "H ← H + state after 64 rounds",
      note: "The registers are added back into the running hash rather than replacing it. Without this the rounds would be individually invertible and the entire hash could be run backwards; one line, and it is what makes the function one-way.",
    },
    {
      label: "the weakness it creates",
      expr: "digest = full internal state",
      note: "Because the output is the whole state, anyone holding H(m) can resume from it and compute H(m ‖ padding ‖ suffix) without knowing m. That is the length-extension attack, and the reason HMAC exists.",
    },
  ],
  symbols: [
    { symbol: "a…h", meaning: "the eight 32-bit working registers" },
    { symbol: "Σ₀, Σ₁", meaning: "rotate-and-XOR mixes used in the round" },
    { symbol: "σ₀, σ₁", meaning: "a different pair of mixes, used in the message schedule" },
    { symbol: "Kₜ", meaning: "round constant t; fractional part of a prime’s cube root" },
    { symbol: "Wₜ", meaning: "the t-th word of the 64-word message schedule" },
    { symbol: "∧, ⊕, ¬", meaning: "bitwise AND, XOR and NOT" },
    { symbol: "+", meaning: "addition modulo 2³², not XOR" },
  ],
  overview: [
    'A hash is not a cipher. There is no key, nothing is transmitted, and there is no decryption; the function runs in one direction only. It takes an input of any length and produces a fixed 256 bits, and the useful properties are all about what an attacker cannot do: find a second input with the same digest, find any input matching a given digest, or find two colliding inputs at all.',
    'SHA-256 uses the Merkle–Damgård construction. The message is padded to a whole number of 512-bit blocks, and each block is folded into a 256-bit state by a compression function. Padding appends a single 1 bit, then zeros, then the original length in bits as a 64-bit number; encoding the length is what stops two different messages padding into the same block sequence.',
    'The compression function runs 64 rounds over eight 32-bit registers. Each round computes two quantities: T₁ from the last register, a rotation mix of e, a bitwise choice between f and g, a round constant and a word of the message schedule; and T₂ from a rotation mix of a and a bitwise majority of a, b and c. Every register then shifts down one place, with T₁ folded into e and T₁ + T₂ becoming the new a.',
    'The message schedule is where a single input bit gets spread across the whole computation. Only the first sixteen of the 64 words come from the block; the remaining 48 are each built from four earlier ones through two rotate-and-shift functions, so changing one byte of the message perturbs almost every round.',
    'The one detail that makes the whole thing one-way is easy to miss: after the 64 rounds, the registers are *added* back into the state rather than replacing it. Without that feed-forward the rounds would be individually invertible and the entire hash could be run backwards.',
    'The constants are deliberately boring. The eight initial values are the fractional parts of the square roots of the first eight primes, and the 64 round constants are the cube roots of the first 64 primes. These are "nothing up my sleeve" numbers, chosen precisely so that nobody could have selected them to conceal a weakness.',
  ],
  history: [
    'SHA-256 belongs to the SHA-2 family, published by NIST in 2001 as FIPS 180-2 and designed by the NSA. It arrived alongside SHA-224, SHA-384 and SHA-512, and was in no hurry to be adopted because SHA-1 still looked healthy.',
    'That changed quickly. In 2004 Xiaoyun Wang and colleagues broke MD5 with practical collisions, and in 2005 the same group published a theoretical collision attack on SHA-1 far faster than brute force. SHA-2 went from a standard nobody was using to the recommended replacement almost overnight.',
    'NIST hedged anyway. Because SHA-1 and SHA-2 share a design lineage, a break of one might well extend to the other, so a public competition was launched in 2007 for a structurally different alternative. Keccak won in 2012 and became SHA-3 in 2015, but SHA-2 was never broken, so SHA-3 remains an insurance policy rather than a replacement.',
    'SHA-1 finally fell in practice. Google and CWI produced the first real SHA-1 collision, SHAttered, in 2017 (two different PDFs with the same digest), and the SHA-1 chosen-prefix collision followed in 2020, making it cheap enough to forge in earnest.',
    'SHA-256 now underpins a great deal of infrastructure: TLS certificate signatures, Git object identifiers, package manager checksums, HMAC constructions, password hashing via PBKDF2, and Bitcoin, whose proof-of-work is literally a search for inputs whose double SHA-256 begins with enough zeros.',
  ],
  weaknesses: [
    'The construction leaks its own internal state, and that is exploitable. Because the digest is the entire state after the last block, an attacker who has H(m) can resume hashing from it and compute H(m ‖ padding ‖ suffix) without knowing m at all. This is the length-extension attack, and it is why naïvely authenticating a message as H(secret ‖ message) is broken; the fix is HMAC, which is why HMAC exists at all.',
    'It is fast, and for password storage that is a defect rather than a feature. A modern GPU computes billions of SHA-256 hashes per second, so a plain hash of a password is a weak defence. Passwords need a deliberately slow, memory-hard function (bcrypt, scrypt or Argon2), not a general-purpose hash.',
    'Collision resistance is bounded by the birthday paradox at 128 bits, not 256. Finding any two colliding inputs takes about 2¹²⁸ work rather than 2²⁵⁶; still far out of reach, but half the exponent people often assume.',
    'Reduced-round variants have been attacked: collisions are known for SHA-256 cut to 31 of its 64 rounds, and preimage attacks reach into the mid-40s. Full SHA-256 has a comfortable margin, and these results are what tells us how comfortable.',
    'Grover’s algorithm would let a quantum computer find preimages in about 2¹²⁸ operations rather than 2²⁵⁶, and collision search improves somewhat too. SHA-256 is weakened rather than broken by quantum computing, which is why it remains acceptable where AES-256 is.',
    'The most common failures are not in the function at all. Comparing digests with a non-constant-time string comparison leaks information through timing; hashing without a salt allows rainbow tables; and using a hash where a MAC is required, the length-extension case, is a design error the hash cannot protect against.',
  ],
};
