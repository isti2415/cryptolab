import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'A Feistel cipher whose S-boxes are built from the key, not fixed.',
  formula: [
    {
      label: "round",
      expr: "L ^= Pᵢ;  R ^= f(L);  swap L, R",
      note: "A Feistel round: mix a subkey into the left half, push it through f, XOR the result into the right half, and swap. Sixteen of these, then the final swap is undone and the last two subkeys applied.",
    },
    {
      label: "the f function",
      expr: "f(x) = ((S₁[a] + S₂[b]) ⊕ S₃[c]) + S₄[d]",
      note: "Split the 32-bit word into four bytes and look each up in its own S-box. Mixing addition mod 2³² with XOR is deliberate: the two operations do not distribute over one another, which makes f awkward to attack algebraically.",
    },
    {
      label: "key schedule",
      expr: "521 encryptions to fill 18 + 1024 words",
      note: "The tables start as π, are XORed with the key, and are then overwritten by the cipher’s own output: each encryption feeding the next. There is no shortcut, which is why keying is slow and why bcrypt could be built on it.",
    },
    {
      label: "the tables",
      expr: "P and S initialised from the hex digits of π",
      note: "1042 words of π, chosen as \"nothing up my sleeve\" numbers: no one could have selected them to conceal a weakness. This lab derives them from Machin’s formula rather than embedding them.",
    },
  ],
  symbols: [
    { symbol: "L, R", meaning: "The two 32-bit halves of the 64-bit block" },
    { symbol: "Pᵢ", meaning: "The i-th of 18 subkeys in the P-array" },
    { symbol: "S₁…S₄", meaning: "Four key-dependent S-boxes of 256 entries each" },
    { symbol: "a, b, c, d", meaning: "The four bytes of the word entering f, most significant first" },
    { symbol: "⊕", meaning: "XOR; + is addition modulo 2³²" },
  ],
  overview: [
    'Blowfish is a 16-round Feistel cipher on 64-bit blocks with a key from 32 to 448 bits. Structurally the rounds resemble DES (split the block, run one half through a keyed function, XOR it into the other, swap), but the function inside is entirely different, and so is where its tables come from.',
    'DES has eight fixed S-boxes published in the standard. Blowfish has four S-boxes of 256 entries each, and they are generated from the key. So is the 18-word P-array of subkeys. Nothing an attacker can precompute applies to a key they do not have, because the substitution tables themselves are secret.',
    'The tables start as the hexadecimal digits of π, 1042 words of it, which are "nothing up my sleeve" numbers, chosen so nobody could have selected them to hide a weakness. This lab derives them from Machin’s formula rather than pasting them in, which takes a few tens of milliseconds and makes it checkable that they contain nothing but π.',
    'Key setup then XORs the key into the P-array and, from there, has the cipher rewrite its own tables: encrypt an all-zero block, put the two output halves into P₀ and P₁, feed that output back in, and repeat until all 18 P-words and all 1024 S-box entries have been replaced. That is 521 full encryptions before a single byte of plaintext can move.',
    'The function f splits a 32-bit word into four bytes, looks each up in its own S-box, and combines them with two additions and an XOR. Mixing addition modulo 2³² with XOR is deliberate: the two operations do not distribute over one another, which makes f awkward to attack with algebra.',
    'That expensive key setup is normally a drawback and occasionally the entire point. bcrypt takes Blowfish’s schedule, makes it repeatable a configurable number of times, and uses the cost as the security property; a password hash that can be made slower as hardware gets faster.',
  ],
  history: [
    'Bruce Schneier designed Blowfish in 1993 and placed it in the public domain, explicitly unpatented and free to use. That was a pointed decision: DES was aging, IDEA was patented, and there was no strong, unencumbered block cipher available to anyone who wanted one.',
    'It found its way into a great deal of software during the 1990s and 2000s; OpenSSH, GnuPG, disk encryption tools, password managers, and a long tail of applications that needed a cipher and could not pay for one.',
    'Its most durable descendant is bcrypt, designed by Niels Provos and David Mazières in 1999. bcrypt uses Blowfish’s deliberately expensive key schedule as a password hashing function, with a work factor that can be raised over time. It is still a recommended choice today, decades after Blowfish itself stopped being a sensible cipher for bulk data.',
    'Schneier himself moved on. He designed Twofish for the AES competition in 1998 (128-bit blocks, one of the five finalists), and has since said plainly that people should use Twofish or AES rather than Blowfish. In 2007 he described Blowfish as having "a 64-bit block size, and that’s a problem".',
    'Blowfish was never broken in the sense DES or RC4 were. It simply aged out: the block size stopped being adequate, and better options arrived.',
  ],
  weaknesses: [
    'The 64-bit block is the disqualifying flaw, exactly as it is for DES and 3DES. Ciphertext blocks begin colliding after roughly 2³² blocks, about 32 GB, and in CBC mode a collision leaks the XOR of two plaintext blocks. The Sweet32 attacks of 2016 demonstrated this against 3DES in practice, and Blowfish is vulnerable to precisely the same technique. This is why Schneier recommends against it.',
    'Key setup is slow by design, and that is a real cost in the wrong context. 521 encryptions per key makes Blowfish poorly suited to protocols that rekey often, and it is a denial-of-service consideration anywhere an attacker can force key changes.',
    'The full 16-round cipher has no practical break, but reduced-round variants fall. Vaudenay showed in 1996 that a variant with weak S-boxes could be attacked, and differential attacks reach around 4 rounds of the real cipher. The margin is comfortable; it is simply not what keeps the cipher out of use.',
    'A small fraction of keys produce S-boxes with colliding entries; "weak keys" in Vaudenay’s sense. They do not lead to a practical attack on the full cipher, but they exist and cannot be detected without running the schedule.',
    'The S-boxes need 4 KB of RAM per key, which ruled Blowfish out of the smartcards and embedded hardware of its era and still matters on constrained devices.',
    'None of this makes Blowfish safe to choose today. AES is faster, has a 128-bit block, and has received far more cryptanalytic attention; ChaCha20 is faster still in software without hardware support.',
  ],
};
