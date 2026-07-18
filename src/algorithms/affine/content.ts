import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Multiply, then shift — a Caesar cipher with a scaling factor.',
  overview: [
    'The Affine cipher generalizes the Caesar cipher. Instead of only shifting each letter, it first multiplies the letter’s position by a constant a and then adds a constant b, all modulo 26: c = (a·x + b) mod 26.',
    'The key is the pair (a, b). For the cipher to be reversible, a must be coprime with 26 — that is, share no common factor with it — so that every letter maps to a distinct letter. Decryption undoes the multiply using the modular inverse of a: x = a⁻¹·(c − b) mod 26.',
  ],
  history: [
    'The affine cipher is a classical monoalphabetic substitution cipher, a natural mathematical extension of Caesar’s shift studied widely in the teaching of modular arithmetic and number theory.',
    'It is important less as a historical field cipher than as the simplest cipher that forces you to reason about modular inverses and coprimality — the same ideas that underpin modern public-key cryptography.',
  ],
  weaknesses: [
    'There are only 12 valid choices of a (the numbers coprime with 26) and 26 choices of b, giving just 312 keys — trivially brute-forced.',
    'Like every monoalphabetic cipher it leaves letter frequencies intact, so frequency analysis recovers the mapping from a modest amount of ciphertext.',
    'Knowing (or guessing) just two plaintext/ciphertext letter pairs is enough to solve for a and b directly.',
  ],
  notes: [
    'Valid values of a are 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25. Choosing an invalid a is reported as an error rather than silently producing an unrecoverable message.',
  ],
};
