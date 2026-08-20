import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'A 16-round Feistel block cipher: the first modern encryption standard.',
  formula: [
    {
      label: "round",
      expr: "Lₙ = Rₙ₋₁,  Rₙ = Lₙ₋₁ ⊕ f(Rₙ₋₁, Kₙ)",
      note: "The Feistel structure. Because f’s output is only XORed in and the halves swap, f never has to be invertible, and decryption is the identical circuit with the round keys reversed.",
    },
    {
      label: "the f function",
      expr: "f(R, K) = P(S(E(R) ⊕ K))",
      note: "Expand the 32-bit half to 48 bits, XOR in the round key, crush it back to 32 through eight S-boxes, then permute. The XOR is the only point in the round where the key enters.",
    },
    {
      label: "S-box addressing",
      expr: "row = b₁b₆,  column = b₂b₃b₄b₅",
      note: "Each 6-bit group indexes one S-box: the outer two bits pick the row and the inner four pick the column, giving four bits out. These tables are the only non-linear part of DES, and the sole reason it resists differential cryptanalysis.",
    },
    {
      label: "key schedule",
      expr: "PC-1 → C, D → rotate → PC-2",
      note: "PC-1 discards every eighth bit (parity, carrying no key material), and splits the remaining 56 into two 28-bit halves. Each round rotates both halves left, and PC-2 selects 48 of the 56 bits as that round’s key.",
    },
    {
      label: "effective key",
      expr: "56 bits, not 64",
      note: "About 7.2 × 10¹⁶ keys. Expensive in 1977; the EFF’s Deep Crack exhausted it in 56 hours in 1998, and a modern cluster does it far faster.",
    },
  ],
  symbols: [
    { symbol: "L, R", meaning: "The left and right 32-bit halves of the block" },
    { symbol: "Kₙ", meaning: "The 48-bit round key for round n" },
    { symbol: "E", meaning: "Expansion, 32 bits to 48 by duplicating sixteen of them" },
    { symbol: "S", meaning: "The eight S-boxes, 48 bits in and 32 out" },
    { symbol: "P", meaning: "A fixed 32-bit permutation, so each S-box feeds different ones next round" },
    { symbol: "IP, FP", meaning: "Initial and final permutations; exact inverses, and cryptographically inert" },
  ],
  overview: [
    'DES encrypts a single 64-bit block under a 56-bit key, supplied as 64 bits including eight parity bits that carry no key material. The block passes through an initial permutation, sixteen rounds of a Feistel network, and a final permutation that is the exact inverse of the first.',
    'A Feistel round splits the block in half and treats the halves asymmetrically. The right half is fed through a keyed function f, the result is XORed into the left half, and the halves swap. The elegance of this construction is that f never has to be invertible; whatever f does, XOR and a swap undo themselves. That is why DES decryption is the identical circuit with the round keys applied in reverse order, and why the same hardware serves both directions.',
    'The function f is where the work happens. The 32-bit half is expanded to 48 bits by the E table, which duplicates sixteen of its bits so that each one influences two S-boxes. The 48-bit round key is XORed in: the only point in the entire round where the key enters. The result is split into eight 6-bit groups, each indexing one of eight S-boxes: the outer two bits select the row, the inner four select the column, and four bits come out. Those 32 bits are then shuffled by the P table so that each S-box output feeds different S-boxes next round.',
    'The S-boxes are the only non-linear component in DES. Everything else (the permutations, the expansion, the XORs); is linear, and a cipher built entirely from linear parts falls to linear algebra immediately. The sixteen round keys come from the key schedule: PC-1 discards the parity bits and permutes the remaining 56 into two 28-bit halves, which are rotated left by one or two positions each round before PC-2 selects 48 of them.',
  ],
  history: [
    'DES descends from Lucifer, a cipher developed at IBM in the early 1970s by a team including Horst Feistel, whose name the round structure carries. IBM submitted a variant in response to the National Bureau of Standards’ 1973 call for a public encryption standard, and it was adopted as FIPS 46 in 1977; the first openly published, government-endorsed cipher, which is what made commercial cryptography possible at all.',
    'The NSA’s involvement was immediately controversial and turned out to cut both ways. The agency insisted the key be shortened from Lucifer’s 112 or 128 bits to 56, which critics correctly suspected was short enough to brute-force eventually. The agency also modified the S-boxes, which critics suspected of hiding a backdoor.',
    'The second suspicion was wrong, and the reason is remarkable. When Eli Biham and Adi Shamir published differential cryptanalysis in 1990, the DES S-boxes turned out to be almost optimally resistant to it. Don Coppersmith confirmed in 1994 that IBM had discovered the technique in 1974 and been asked to keep it classified; the design had been hardened against an attack the public would not learn of for sixteen years.',
    'The key length objection was right. In 1997 the DESCHALL project broke a DES challenge by distributed brute force in 96 days. In 1998 the Electronic Frontier Foundation built Deep Crack for around $250,000 and did it in 56 hours, publishing the full design specifically to end official claims that DES was still adequate. In January 1999, Deep Crack and distributed.net together did it in 22 hours 15 minutes.',
    'NIST withdrew DES as a standard in 2005. Triple DES (encrypt, decrypt, encrypt with two or three keys); extended its life, but NIST has since deprecated that too, disallowing it for new applications after 2023.',
  ],
  weaknesses: [
    'The 56-bit key is the headline failure. The full key space is about 7.2 × 10¹⁶, which was expensive in 1977 and is trivial now: dedicated hardware or a modest GPU cluster exhausts it in hours, and the cost keeps falling. No amount of care in using DES compensates for this.',
    'The 64-bit block is a subtler but real problem. By the birthday bound, collisions between ciphertext blocks become likely after roughly 2³² blocks, about 32 GB, and in CBC mode a collision leaks the XOR of two plaintext blocks. The Sweet32 attacks of 2016 turned this from a textbook observation into a practical recovery of authentication cookies from long-lived HTTPS and VPN connections, and drove the final removal of 3DES from TLS.',
    'Four keys are weak and twelve are semi-weak. A weak key makes all sixteen round keys identical, so encryption becomes its own inverse; encrypt twice and you get the plaintext back. They are easy to avoid, and easy to hit by accident if keys are generated carelessly.',
    'Triple DES does not triple the security. Meet-in-the-middle reduces two-key 3DES to about 2⁸⁰ work rather than 2¹¹², and it is roughly three times slower than DES for a cipher that still has a 64-bit block. It was a bridge, not a destination.',
    'The initial and final permutations contribute nothing cryptographically. They exist because of how the original hardware loaded data, and they are public and fixed; worth knowing, because their presence in the walkthrough can suggest more security than they provide.',
  ],
};
