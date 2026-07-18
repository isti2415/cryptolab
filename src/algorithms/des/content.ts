import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'A 16-round Feistel block cipher — the first modern encryption standard.',
  overview: [
    'DES encrypts 64-bit blocks under a 56-bit key (supplied here as 64 bits including parity). It first derives sixteen 48-bit round keys, then runs the block through an initial permutation, sixteen rounds of a Feistel network, and a final permutation.',
    'In each round the block is split in half; the right half is expanded, combined with the round key, passed through eight S-boxes (the cipher’s only non-linear part) and permuted, then XORed into the left half. This Feistel structure has a neat property: decryption is the exact same process with the round keys applied in reverse.',
  ],
  history: [
    'Developed by IBM (building on Horst Feistel’s Lucifer cipher) with input from the NSA, DES was adopted as a US federal standard in 1977 — the first openly published, government-endorsed cipher, which made it the foundation of commercial cryptography for two decades.',
    'The NSA’s involvement was controversial: it quietly strengthened the S-boxes against differential cryptanalysis (unknown publicly until the 1990s) while insisting the key be shortened to 56 bits — short enough, critics rightly suspected, to eventually brute-force.',
  ],
  weaknesses: [
    'The 56-bit key is far too small today. In 1998 the EFF’s “Deep Crack” machine broke DES by brute force in days; a modern cluster does it in hours.',
    'Its response was Triple DES (encrypt-decrypt-encrypt with two or three keys) to extend the key length, but that is slow and has its own limits.',
    'DES was retired as a standard in favour of AES in 2001. It remains hugely important as the template every later block cipher learned from — and as a caution that key length is not a detail.',
  ],
  notes: [
    'This lab enciphers a single 64-bit block. Enter the block and the key as 16 hexadecimal digits each (spaces are ignored). Try key 133457799BBCDFF1 with block 0123456789ABCDEF — the classic DES test vector.',
  ],
};
