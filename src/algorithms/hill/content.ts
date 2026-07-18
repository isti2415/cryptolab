import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Encrypt blocks of letters with matrix multiplication mod 26.',
  overview: [
    'The Hill cipher treats groups of letters as vectors and multiplies them by a key matrix, modulo 26. This lab uses a 2×2 matrix, so letters are enciphered two at a time: the block [x₀, x₁] becomes K·[x₀, x₁] mod 26.',
    'Because each output letter depends on several input letters, Hill diffuses information across a block — a property that single-letter substitution ciphers completely lack. Decryption multiplies by the inverse matrix mod 26, which exists only when the matrix’s determinant is coprime with 26.',
  ],
  history: [
    'Invented by the mathematician Lester S. Hill in 1929 and published in The American Mathematical Monthly.',
    'It was the first cipher built explicitly on linear algebra, and is a milestone in the mathematisation of cryptography — the idea that encryption is a reversible function you can analyse with matrices and modular arithmetic.',
  ],
  weaknesses: [
    'Hill is purely linear, which is its downfall: it is trivially broken by a known-plaintext attack. Enough plaintext/ciphertext letter pairs let an attacker solve a system of linear equations for the whole key matrix.',
    'It provides no confusion — only diffusion — so on its own it is not secure. Its real legacy is conceptual: modern block ciphers like AES deliberately interleave a linear diffusion step (MixColumns) with a non-linear substitution step (the S-box) precisely to avoid Hill’s weakness.',
    'The matrix must be invertible mod 26; a poorly chosen key silently fails to decrypt, so key validity has to be checked up front.',
  ],
  notes: [
    'Enter the 2×2 key as four numbers, row by row (e.g. “3 3 2 5” = [[3, 3], [2, 5]]). The determinant must be coprime with 26. Text is reduced to A–Z and padded with X to a whole number of blocks.',
  ],
};
