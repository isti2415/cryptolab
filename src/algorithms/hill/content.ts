import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Encrypt blocks of letters with matrix multiplication mod 26.',
  formula: [
    {
      label: "encrypt",
      expr: "c = K · x  (mod 26)",
      note: "Take a block of letters as a column vector and multiply it by the key matrix, reducing every entry mod 26. Each output letter is a weighted sum of every input letter in the block.",
    },
    {
      label: "decrypt",
      expr: "x = K⁻¹ · c  (mod 26)",
      note: "Multiply by the matrix inverse taken mod 26. For a 2×2 matrix that is det(K)⁻¹ times the adjugate: the same structure as ordinary linear algebra, with modular inverses standing in for division.",
    },
    {
      label: "validity",
      expr: "gcd(det K, 26) = 1",
      note: "The inverse exists only when the determinant has a modular inverse, which needs it coprime with 26. A matrix failing this encrypts perfectly happily and then cannot be decrypted: a trap worth checking before use, not after.",
    },
    {
      label: "why it falls",
      expr: "n known blocks solve for K",
      note: "Encryption is a linear map, so enough known plaintext gives a system of linear equations in the entries of K. For the 2×2 case, four known letters generally recover the whole key.",
    },
  ],
  symbols: [
    { symbol: "x, c", meaning: "Plaintext and ciphertext blocks as column vectors of letter numbers" },
    { symbol: "K", meaning: "The key matrix, n×n with entries mod 26" },
    { symbol: "K⁻¹", meaning: "Its inverse mod 26, which exists only under the condition above" },
    { symbol: "det K", meaning: "The determinant; for [[a,b],[c,d]] that is ad − bc" },
    { symbol: "adj K", meaning: "The adjugate; for 2×2 it is [[d,−b],[−c,a]]" },
  ],
  overview: [
    'The Hill cipher treats blocks of letters as vectors and multiplies them by a key matrix, modulo 26. This lab uses a 2×2 matrix, so letters are enciphered two at a time: the block [x₀, x₁] becomes K·[x₀, x₁] mod 26.',
    'Because every entry of the output vector is a weighted sum of every entry of the input vector, changing one plaintext letter changes both ciphertext letters. That is genuine diffusion (information from one position spreading across a block), and it is the property that single-letter substitution ciphers completely lack.',
    'Decryption multiplies by K⁻¹, the matrix inverse taken mod 26. For a 2×2 matrix that is det(K)⁻¹ times the adjugate, which means the determinant must have a modular inverse, which in turn means it must be coprime with 26. A matrix with determinant 13, or any even determinant, is not usable as a key no matter how well it encrypts.',
    'Hill generalises to n×n matrices operating on n letters at a time, and larger blocks diffuse further. The 2×2 case shown here is the smallest one in which the idea is visible at all.',
  ],
  history: [
    'Lester S. Hill published the cipher in 1929 in The American Mathematical Monthly, in a paper titled Cryptography in an Algebraic Alphabet, followed by a second paper in 1931.',
    'Its importance is conceptual rather than operational. It was the first cipher built explicitly on linear algebra, and the first practical system able to operate on more than three symbols simultaneously. It marks the point where cryptography starts being treated as a branch of mathematics rather than a craft of clever substitutions.',
    'Hill and Louis Weisner patented a mechanical device to perform the 6×6 case, using gears and chains to carry out the modular arithmetic. It was never commercially successful (the machine was cumbersome, and the cipher’s weakness against known plaintext limited its appeal), but it is a genuine attempt to make the mathematics practical.',
    'Its real legacy is downstream. The idea that a cipher should mix a block of symbols linearly, so that each output depends on many inputs, reappears as the MixColumns step of AES. AES pairs that linear mixing with a non-linear S-box specifically to avoid the flaw that sank Hill.',
  ],
  weaknesses: [
    'The cipher is purely linear, and that is fatal. Encryption is a matrix multiplication, so an attacker with enough known plaintext can simply solve for the key: n known blocks give n linear equations in the entries of an n×n matrix, and the system is solved with the same linear algebra used to encrypt. For the 2×2 case, four known letters generally suffice.',
    'It provides diffusion but no confusion. There is no non-linear step anywhere in the algorithm, so the relationship between key and ciphertext stays algebraically simple; exactly the structure cryptanalysis is best at exploiting. Modern block ciphers interleave a linear diffusion layer with a non-linear substitution layer for precisely this reason.',
    'Ciphertext-only attacks are harder than against monoalphabetic ciphers, but not out of reach for small matrices: the key space for a 2×2 matrix mod 26 is small enough to search directly, and block-level frequency analysis narrows it further.',
    'Key validity is a real trap. A matrix whose determinant shares a factor with 26 encrypts perfectly happily and then cannot be decrypted, because the inverse does not exist. The failure appears only at the far end, potentially after the message has been sent.',
    'It leaks nothing about block boundaries but everything about block repetition: identical plaintext blocks always produce identical ciphertext blocks, which is the same weakness ECB mode has in modern block ciphers.',
  ],
};
