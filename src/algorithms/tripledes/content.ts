import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  formula: [
    {
      label: "encrypt",
      expr: "C = E(K3, D(K2, E(K1, P)))",
      note: "Three DES operations in encrypt–decrypt–encrypt order. The middle decryption exists purely for compatibility: set all three keys equal and it cancels the first encryption, leaving plain single DES.",
    },
    {
      label: "decrypt",
      expr: "P = D(K1, E(K2, D(K3, C)))",
      note: "Both the order of the keys and each operation reverse. K3 is used first on the way back, which is what makes the two directions mirror images.",
    },
    {
      label: "keying options",
      expr: "K3 = K1 (two-key), or three independent keys",
      note: "Two-key 3DES shortens the key material at some cost in strength and was disallowed by NIST after 2015. Three-key survived until 2023 and is now disallowed for new applications too.",
    },
    {
      label: "why not double",
      expr: "meet-in-the-middle: ≈2⁵⁷ work, not 2¹¹²",
      note: "Encrypt the plaintext under every K1, decrypt the ciphertext under every K2, and look for a match. Double DES therefore buys almost nothing, which is why the answer was three passes, and why three-key 3DES gives about 112 bits rather than 168.",
    },
    {
      label: "what it could not fix",
      expr: "block size still 64 bits",
      note: "Tripling the key does nothing about the block. Ciphertext collisions become likely after about 2³² blocks, around 32 GB, which the Sweet32 attacks turned into practical cookie recovery in 2016.",
    },
  ],
  symbols: [
    { symbol: "E, D", meaning: "A single DES encryption and decryption of one 64-bit block" },
    { symbol: "K1, K2, K3", meaning: "The three 56-bit DES keys" },
    { symbol: "P, C", meaning: "The plaintext and ciphertext block" },
    { symbol: "EDE", meaning: "The encrypt–decrypt–encrypt ordering" },
  ],
  overview: [
    'By the 1990s DES’s 56-bit key was visibly too short, but DES hardware was installed everywhere, in ATMs, payment terminals and smartcards that could not simply be replaced. Triple DES is the answer that ran on what already existed: apply DES three times with two or three keys.',
    'The middle operation is a decryption, which surprises everyone the first time. It is there for backwards compatibility. Set K1 = K2 = K3 and the decryption exactly undoes the first encryption, so the whole construction collapses to plain single DES and a 3DES device can still talk to a DES-only one. Cryptographically the D buys nothing; an E–E–E ordering would be just as strong.',
    'Two keying options survived into practice. Three-key 3DES uses three independent keys; two-key 3DES sets K3 = K1, which shortens the key material at some cost in strength. A third option, all keys equal, is single DES by another name.',
    'Doubling rather than tripling is not an option, and the reason is instructive. Double DES with two keys looks like it should give 112 bits, but a meet-in-the-middle attack (encrypt the plaintext under every K1, decrypt the ciphertext under every K2, look for a match) breaks it in about 2⁵⁷ operations with enough memory. Adding a third pass is what actually raises the bar.',
  ],
  history: [
    'Walter Tuchman of IBM, who had worked on DES itself, proposed the triple construction in 1978. Merkle and Hellman had already shown in 1977 that double encryption was a poor bargain, which is why the answer was three passes rather than two.',
    'It was standardised as ANSI X9.17 in 1985 and folded into the ISO 8732 banking standards, then adopted formally by NIST as part of FIPS 46-3 in 1999; the same revision that acknowledged single DES was no longer adequate.',
    'The payments industry adopted it thoroughly and kept it far longer than anyone else, because EMV chip cards and PIN-processing hardware had it baked in. That installed base is why a cipher designed in the 1970s was still protecting card transactions well into the 2010s.',
    'The end came in two stages. The Sweet32 attacks of 2016 exploited the 64-bit block to recover authentication cookies from long-lived HTTPS and VPN connections, and 3DES was removed from TLS. NIST then deprecated it in SP 800-131A: two-key 3DES was disallowed after 2015, and three-key 3DES was restricted to 2²⁰ blocks per key before being disallowed entirely for new applications after 2023.',
  ],
  weaknesses: [
    'The 64-bit block is the fatal flaw, and tripling the key does nothing about it. By the birthday bound, ciphertext blocks start colliding after roughly 2³² blocks, about 32 GB, and in CBC mode a collision leaks the XOR of two plaintext blocks. Sweet32 turned that into a practical cookie recovery in 2016 against connections that simply stayed open long enough. AES’s 128-bit block moves the same bound out of reach.',
    'Three-key 3DES offers about 112 bits of security rather than 168. A meet-in-the-middle attack against the outer two passes, trading memory for time, is what caps it: the same technique that ruled out double DES, applied one level up.',
    'Two-key 3DES is weaker still. Attacks using large numbers of known plaintexts bring it well below 112 bits, which is why NIST disallowed it a decade before retiring the three-key variant.',
    'It is roughly three times slower than DES, which was already slow in software because its bit permutations map badly onto CPU word operations. AES is faster in software and vastly faster with hardware instructions, so 3DES lost on performance as well as security.',
    'DES’s weak keys are inherited. If K1 or K2 happens to be one of the four DES weak keys, the corresponding pass becomes its own inverse, and careless key generation can produce a configuration far weaker than the key length suggests.',
    'The all-equal-keys mode is a real hazard rather than a curiosity: a misconfiguration that silently produces single DES looks exactly like working 3DES from the outside, and this lab flags it for that reason.',
  ],
  sources: [
    {
      label: 'NIST SP 800-67 Rev. 2: Triple DES',
      url: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-67r2.pdf',
      note: 'Including the deprecation that disallows it for new applications.',
    },
    {
      label: 'Sweet32: Birthday attacks on 64-bit block ciphers',
      url: 'https://sweet32.info/',
      note: 'Why a 64-bit block is the problem, independent of key length.',
    },
  ],
};
