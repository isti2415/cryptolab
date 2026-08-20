import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'The modern standard: a substitution-permutation network on a 4×4 byte grid.',
  formula: [
    {
      label: "the round",
      expr: "AddRoundKey ∘ MixColumns ∘ ShiftRows ∘ SubBytes",
      note: "Read right to left: substitute every byte, rotate the rows, mix the columns, then XOR in the round key. Ten rounds for a 128-bit key, twelve for 192, fourteen for 256.",
    },
    {
      label: "SubBytes",
      expr: "b → affine(b⁻¹ in GF(2⁸))",
      note: "The only non-linear step, and the source of confusion. Each byte is replaced by its multiplicative inverse in the field followed by a fixed affine transform: a construction chosen for provably high resistance to differential and linear cryptanalysis, not an arbitrary table.",
    },
    {
      label: "ShiftRows",
      expr: "row r rotates left by r bytes",
      note: "Row 0 stays put, row 1 moves one byte, row 2 two, row 3 three. That scatters each original column across all four, so MixColumns then mixes bytes that started far apart.",
    },
    {
      label: "MixColumns",
      expr: "each column × a fixed matrix over GF(2⁸)",
      note: "Every output byte of a column depends on all four inputs. With ShiftRows this gives full diffusion, after two rounds every byte of the state depends on every byte of the input. Omitted in the final round so encryption and decryption stay symmetric.",
    },
    {
      label: "key expansion",
      expr: "wᵢ = wᵢ₋₄ ⊕ (i mod 4 = 0 ? g(wᵢ₋₁) : wᵢ₋₁)",
      note: "The 128-bit key becomes 44 words. Every fourth word passes through g first: rotate its bytes, push them through the same S-box, and XOR in a round constant that differs each round; the constants exist to break the symmetry that would otherwise relate the round keys.",
    },
  ],
  symbols: [
    { symbol: "state", meaning: "The 4×4 byte matrix, filled column by column" },
    { symbol: "GF(2⁸)", meaning: "The finite field of 256 elements AES does its arithmetic in" },
    { symbol: "wᵢ", meaning: "The i-th 4-byte word of the expanded key" },
    { symbol: "g", meaning: "RotWord, then SubWord, then XOR with the round constant" },
    { symbol: "Rcon", meaning: "The round constant, doubling in GF(2⁸) each round" },
    { symbol: "∘", meaning: "Function composition, apply the rightmost first" },
  ],
  overview: [
    'AES arranges the sixteen bytes of a 128-bit block into a 4×4 state matrix, filled column by column, and transforms that matrix over ten rounds for a 128-bit key (twelve for 192-bit, fourteen for 256-bit). Unlike DES it is not a Feistel network: every byte is transformed in every round, and each step is individually invertible.',
    'Each round applies four operations. SubBytes replaces every byte using an S-box: the only non-linear step, and the source of what cryptographers call confusion. ShiftRows rotates row r left by r bytes, so the four bytes that started in one column end up spread across all four. MixColumns multiplies each column by a fixed matrix in the finite field GF(2⁸), mixing four bytes into four new bytes where each output depends on every input. AddRoundKey XORs in a round key, and is the only place the key touches the state.',
    'ShiftRows and MixColumns together provide diffusion: after two rounds every byte of the state depends on every byte of the original input. Interleaving that with the non-linear S-box is the central design idea, and it is exactly what the Hill cipher lacked; Hill had diffusion alone and fell to linear algebra.',
    'The S-box is not an arbitrary table. Each entry is the byte’s multiplicative inverse in GF(2⁸) followed by a fixed affine transform, a construction chosen for provably high resistance to differential and linear cryptanalysis. Both the engine and the Python sample compute it from that definition rather than hard-coding 256 numbers, which keeps the derivation honest and rules out table typos.',
    'The eleven round keys come from the key schedule, which expands the 128-bit key into 44 four-byte words. Every fourth word is transformed first: its bytes are rotated, pushed through the same S-box, and XORed with a round constant that differs each round; the constants exist specifically to break the symmetry that would otherwise let related keys produce related schedules.',
  ],
  history: [
    'By the mid-1990s DES was visibly failing, and NIST chose to replace it in the open. The call for candidates went out in 1997, and unusually the whole process was public: fifteen submissions from twelve countries, three open conferences, and an explicit invitation for the world’s cryptographers to attack every entry.',
    'Rijndael, designed by the Belgian cryptographers Joan Daemen and Vincent Rijmen, was selected in October 2000 and standardised as FIPS-197 in November 2001. The competition itself mattered as much as the winner: the transparency gave AES a credibility that no privately designed and publicly mandated cipher could have had, and it became the template for later NIST competitions including SHA-3 and the post-quantum standards.',
    'The NSA approved AES for classified information up to Secret at 128 bits, and up to Top Secret at 192 or 256; the first time a public algorithm was blessed for that purpose.',
    'Hardware caught up quickly. Intel added AES-NI instructions to its Westmere processors in 2010, and equivalents now appear in essentially every mainstream CPU and phone SoC. Beyond the speed, the instructions execute in constant time, which closes an entire class of side-channel attack that plagued software implementations.',
    'AES now secures a large fraction of everything: TLS, disk encryption, Wi-Fi, VPNs, messaging, backups. It is arguably the most heavily analysed algorithm in the history of the field.',
  ],
  weaknesses: [
    'After more than two decades of concentrated attack there is no practical break of full AES. The best known attack on AES-128 is a biclique technique published in 2011 that recovers a key in about 2¹²⁶·¹ operations rather than 2¹²⁸; a speedup of roughly four times over brute force, which is to say completely infeasible. Reduced-round variants fall, which is exactly what the round count is there to prevent.',
    'Related-key attacks exist against the full AES-192 and AES-256, published by Biryukov and Khovratovich in 2009, exploiting the key schedule being simpler for longer keys. They require an attacker to obtain encryptions under keys with chosen relationships, which no sensible protocol permits, so the practical impact is nil, but it is the reason AES-256’s margin against this particular technique is thinner than AES-128’s, an ordering that surprises people.',
    'The real failures are around the cipher, not inside it. Naïve software implementations use lookup tables whose access patterns depend on secret data, leaking the key through CPU cache timing; Bernstein demonstrated a practical remote attack in 2005 and Osvik, Shamir and Tromer extended it in 2006. Constant-time implementations and AES-NI address this, and code that predates that understanding is still in circulation.',
    'AES is a block cipher, not an encryption system. Using it in ECB mode (encrypting each block independently); leaks structure so badly that an encrypted bitmap remains recognisable, the well-known "ECB penguin". A mode of operation is mandatory, and the choice of mode is where most real deployments fail.',
    'Nonce handling is the other recurring failure. In GCM, reusing a nonce with the same key does not merely weaken confidentiality; it exposes the authentication key and lets an attacker forge arbitrary messages. In CTR-style modes, nonce reuse produces the two-time-pad situation that broke Venona.',
    'A large quantum computer would apply Grover’s algorithm and halve the effective key length, taking AES-128 to roughly 2⁶⁴ work. This is why AES-256 is recommended for long-term secrets. Unlike RSA and elliptic curves, AES is not broken by quantum computing; it is merely reduced.',
  ],
};
