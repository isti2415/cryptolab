import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Multiply, then shift: a Caesar cipher with a scaling factor.',
  formula: [
    {
      label: "encrypt",
      expr: "c = (a·x + b) mod 26",
      note: "Multiply the letter’s position by a, then add b. The multiply stretches the alphabet around its ring and the addition rotates it; setting a = 1 removes the stretch and leaves a plain Caesar cipher.",
    },
    {
      label: "decrypt",
      expr: "x = a⁻¹·(c − b) mod 26",
      note: "Undo the two operations in reverse order. There is no division in modular arithmetic, so instead of dividing by a you multiply by a⁻¹; the number for which a·a⁻¹ leaves remainder 1.",
    },
    {
      label: "validity",
      expr: "gcd(a, 26) = 1",
      note: "a⁻¹ exists only when a shares no factor with 26. Since 26 = 2 × 13, every even a and a = 13 are excluded, leaving exactly twelve legal multipliers. Choose an illegal one and two letters collapse onto the same output, making the message unrecoverable even with the key.",
    },
  ],
  symbols: [
    { symbol: "x, c", meaning: "Plaintext and ciphertext letters as numbers, A = 0 to Z = 25" },
    { symbol: "a", meaning: "The multiplier: one of 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25" },
    { symbol: "b", meaning: "The shift, any value 0 to 25" },
    { symbol: "a⁻¹", meaning: "Modular inverse of a: the number with a·a⁻¹ ≡ 1 (mod 26)" },
    { symbol: "gcd", meaning: "Greatest common divisor; gcd(a, 26) = 1 means they share no factor" },
  ],
  overview: [
    'The affine cipher takes the Caesar cipher and adds a multiplication. Each letter index x is mapped to (a·x + b) mod 26: the multiplier a stretches the alphabet around its 26-position ring, and the shift b rotates it. Setting a = 1 collapses the whole thing back to Caesar, which makes it a clean illustration of what one extra operation buys you.',
    'Decryption cannot simply subtract and divide, because there is no division in modular arithmetic. It multiplies by a⁻¹, the modular inverse of a: the number that satisfies a·a⁻¹ ≡ 1 (mod 26). Finding it is a job for the extended Euclidean algorithm, the same procedure that produces RSA private exponents.',
    'That inverse only exists when a shares no factor with 26. Since 26 = 2 × 13, any even a or a = 13 is disqualified, leaving twelve legal multipliers: 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23 and 25. Choose an illegal one and the map stops being one-to-one, with a = 2, both A and N land on the same output letter, and the message becomes unrecoverable even by the person holding the key.',
    'The full key space is therefore 12 × 26 = 312 pairs, of which one (a = 1, b = 0) is the identity. It is more than Caesar by a factor of twelve, and still small enough to exhaust on a pocket calculator.',
  ],
  history: [
    'The affine cipher has no single inventor and no famous deployment. It appears in the historical record as one member of a broad family of "decimation" ciphers that Renaissance and early-modern cryptographers experimented with, in which the alphabet is stepped through at intervals rather than shifted whole.',
    'Its real significance is pedagogical and mathematical rather than operational. It is the smallest cipher in which the key must satisfy a genuine number-theoretic condition (gcd(a, 26) = 1); rather than merely being a number someone picked. That condition, and the modular inverse used to undo it, are exactly the machinery that reappears at full scale in RSA.',
    'It also demonstrates something that took cryptographers centuries to internalise: enlarging the key space is not the same as improving security. The affine cipher has twelve times Caesar’s keys and is broken by precisely the same attack, in precisely the same amount of time.',
  ],
  weaknesses: [
    'It remains monoalphabetic. One fixed rule maps plaintext letters to ciphertext letters for the whole message, so the frequency distribution is permuted but not flattened, and frequency analysis breaks it as readily as it breaks Caesar. Multiplication rearranges which letter is most common; it does not stop one letter from being most common.',
    'With 312 keys, brute force is instant. An attacker can enumerate all twelve valid multipliers against all 26 shifts and score each candidate decryption automatically against English letter statistics.',
    'Two known plaintext-ciphertext letter pairs are enough to solve for the key directly, with no searching at all: they give two linear congruences in a and b, which can be solved simultaneously mod 26. A single guessed common word usually supplies both pairs.',
    'The gcd condition is a usability trap as much as a mathematical one. Nothing about the encryption side fails when a = 2 (it produces plausible-looking ciphertext quite happily), and the problem only surfaces when decryption produces nonsense. A cipher that can silently accept a broken key is dangerous in a way its key length does not capture.',
  ],
};
