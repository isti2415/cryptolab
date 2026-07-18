import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'The modern standard — a substitution-permutation network on a 4×4 byte grid.',
  overview: [
    'AES encrypts 128-bit blocks by arranging the 16 bytes into a 4×4 state matrix and transforming it over ten rounds (for a 128-bit key). Each round applies four steps: SubBytes (a non-linear S-box substitution), ShiftRows (rotating the rows), MixColumns (mixing each column with a matrix multiply in GF(2⁸)), and AddRoundKey (XOR with a key derived from the schedule).',
    'The interplay of a non-linear substitution with linear diffusion is deliberate: SubBytes provides confusion, ShiftRows and MixColumns provide diffusion, and together they ensure that changing a single input bit rapidly affects the entire block. The final round omits MixColumns so that encryption and decryption stay symmetric.',
  ],
  history: [
    'AES began as Rijndael, designed by Belgian cryptographers Joan Daemen and Vincent Rijmen. It won a five-year open, public competition run by NIST and was standardised in 2001 as the successor to DES.',
    'The open selection process — with the whole world invited to attack the candidates — was a landmark in cryptographic practice, and gave AES enormous credibility. It is now the most widely used block cipher on earth, securing everything from TLS and disk encryption to Wi-Fi.',
  ],
  weaknesses: [
    'After two decades of intense scrutiny there is no practical attack on full AES; the best known attacks are only marginally faster than brute force and entirely infeasible.',
    'The real risks live outside the maths. Naïve software can leak the key through cache-timing side channels, which is why modern CPUs provide constant-time AES instructions (AES-NI).',
    'AES is a block cipher, not a complete system: using it securely requires a sound mode of operation (never plain ECB), correct handling of the IV/nonce, and authentication — mistakes here, not the cipher itself, are where real deployments fail.',
  ],
  notes: [
    'This lab shows AES-128 on a single block. Enter the block and key as 32 hexadecimal digits each. The default is FIPS-197 Appendix C.1: key 000102…0f with block 00112233…ff → 69C4E0D8…C55A.',
  ],
};
