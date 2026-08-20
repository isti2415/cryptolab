import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'A stream cipher of nothing but adds, XORs and rotations, no tables, no timing leaks.',
  formula: [
    {
      label: "quarter round",
      expr: "a+=b; d^=a; d⋘16;  c+=d; b^=c; b⋘12;  a+=b; d^=a; d⋘8;  c+=d; b^=c; b⋘7",
      note: "Four words mixed by nothing but addition, XOR and rotation: the \"ARX\" family. No lookup tables means no memory address depends on the key, so the cipher is constant-time on any CPU without special effort.",
    },
    {
      label: "the rounds",
      expr: "10 × (4 column quarter-rounds + 4 diagonal)",
      note: "Odd rounds mix down the columns of the 4×4 state; even rounds mix along the diagonals. Alternating the two is what carries a change in any one word to all sixteen within a few rounds.",
    },
    {
      label: "block function",
      expr: "out = state + rounds(state)",
      note: "The twenty rounds are a reversible permutation, so an attacker seeing the output could run them backwards. Adding the original state back is what makes the block function one-way: a single line, easy to overlook, and essential.",
    },
    {
      label: "encrypt",
      expr: "c = m ⊕ keystream",
      note: "The 64-byte block is XORed with the message; the counter advances for the next block. Encryption and decryption are the same operation, so a nonce must never repeat under one key.",
    },
  ],
  symbols: [
    { symbol: "state", meaning: "sixteen 32-bit words: 4 constants, 8 key, 1 counter, 3 nonce" },
    { symbol: "a, b, c, d", meaning: "the four state words a quarter-round touches" },
    { symbol: "⋘ n", meaning: "rotate left by n bits" },
    { symbol: "constants", meaning: "0x61707865…: the ASCII of \"expand 32-byte k\"" },
    { symbol: "counter", meaning: "block index, so each 64 bytes gets a different keystream" },
  ],
  overview: [
    'ChaCha20 builds a keystream from a 4×4 grid of 32-bit words: four fixed constants that spell "expand 32-byte k" in ASCII, eight words of key, a block counter, and three words of nonce. Twenty rounds stir the grid, the original state is added back, and the sixteen words are serialised into a 64-byte keystream block that is XORed with the message.',
    'Every operation is an addition, an XOR or a rotation: the family known as ARX. There are no S-boxes and no lookup tables of any kind, and that is a deliberate security decision rather than a simplification. A table lookup takes a different amount of time depending on whether the entry is in cache, and if the index depends on the key, that timing leaks the key. ChaCha20 has no data-dependent memory access at all, so it is constant-time on any CPU without special effort.',
    'The rounds alternate. Odd rounds apply four quarter-rounds down the columns of the grid; even rounds apply them along the diagonals. Alternating the two is what carries a change in any one word to all sixteen, and after a handful of rounds every output bit depends on every input bit.',
    'One step is easy to overlook and essential: after the twenty rounds, the original state is added back. The rounds on their own are a reversible permutation, so an attacker who saw the output could simply run them backwards. The final addition is what makes the block function one-way.',
    'Because the counter is part of the state, each 64-byte block of a long message gets a different keystream from the same key and nonce. The nonce is what must be unique per message, and the counter is what makes a message longer than 64 bytes possible.',
  ],
  history: [
    'Daniel J. Bernstein published Salsa20 in 2005 as a submission to the eSTREAM project, a European effort to find stream ciphers worth standardising after the collapse of confidence in RC4. Salsa20 was selected for the eSTREAM portfolio in 2008.',
    'ChaCha20 followed in 2008 as a refinement: the same structure with a rearranged quarter-round that diffuses slightly faster per round, and a different state layout. It was not intended as a replacement so much as an improvement Bernstein preferred.',
    'Google put it into production. In 2013 and 2014, faced with a mobile fleet whose ARM processors had no AES hardware instructions (where AES was both slow and hard to make constant-time); Chrome and Android adopted ChaCha20-Poly1305 for TLS. It was several times faster than AES on those devices.',
    'The IETF standardised the pairing in RFC 7539 in 2015, revised as RFC 8439 in 2018, with a 96-bit nonce and 32-bit counter chosen to fit TLS record numbering. It is now a mandatory-to-implement option in TLS 1.3 alongside AES-GCM.',
    'The timing matters historically: ChaCha20 arrived as a credible alternative in exactly the years RC4 was being dismantled and prohibited, and it is what most of RC4’s traffic moved to. It is also the generator behind Linux’s /dev/urandom and the basis of the XChaCha20 variant used in libsodium and WireGuard.',
  ],
  weaknesses: [
    'Nonce reuse is catastrophic, as it is for every stream cipher. Encrypt two messages with the same key and nonce and the keystream is identical, so XORing the two ciphertexts cancels it and leaves the XOR of the plaintexts. ChaCha20’s 96-bit nonce is large enough to choose randomly with a sensible margin, but the failure mode is absolute, not gradual.',
    'It provides confidentiality and nothing else. On its own ChaCha20 is malleable in the usual XOR way: flip a ciphertext bit and the same plaintext bit flips, undetected. This is why it is essentially always deployed as ChaCha20-Poly1305, where a MAC covers the ciphertext and the construction becomes authenticated encryption.',
    'The 32-bit counter caps a single key-nonce pair at 256 GB. Beyond that the counter wraps and the keystream repeats, which is the nonce-reuse failure by another name. Implementations must enforce the limit rather than assume nobody will reach it.',
    'The best known attacks reach 7 of 20 rounds, and even those are far from practical. The margin is deliberately large (Bernstein argued 8 rounds would likely be enough, and 20 is the conservative choice), so reduced-round variants like ChaCha8 and ChaCha12 exist and are faster, with correspondingly less margin.',
    'Being an ARX design, it resists cache-timing attacks by construction, but it is not automatically safe against every side channel; power analysis and fault injection still apply to any implementation running on hardware an attacker can touch.',
    'It is not a general-purpose random number generator, though it is used to build them. Feeding it a low-entropy key produces a keystream that is exactly as predictable as that key.',
  ],
};
