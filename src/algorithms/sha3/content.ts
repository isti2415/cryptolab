import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  formula: [
    {
      label: "the sponge",
      expr: "absorb into the rate, permute, squeeze from the rate",
      note: "Message blocks are XORed into the first r bytes of a 1600-bit state and the permutation is run after each. The digest is then read back out of the same region. The rest of the state, the capacity, is never touched by the message and never appears in the output.",
    },
    {
      label: "θ (theta)",
      expr: "each bit ⊕ parity of two whole columns",
      note: "The only step that mixes across the entire state. It is why one flipped input bit reaches all 1600 within a couple of rounds.",
    },
    {
      label: "ρ and π",
      expr: "rotate each lane, then move it",
      note: "ρ rotates each 64-bit lane by a fixed offset; π relocates the lanes. Neither changes a single bit’s value; they only decide where it sits, so that χ mixes different neighbours each round.",
    },
    {
      label: "χ (chi)",
      expr: "aₓ ← aₓ ⊕ (¬aₓ₊₁ ∧ aₓ₊₂) along each row",
      note: "The sole non-linear step. Everything else in Keccak is XOR and movement, so this is where all the irreversibility comes from.",
    },
    {
      label: "ι (iota)",
      expr: "one lane ⊕ round constant",
      note: "Breaks the symmetry the other four steps preserve. Without it every round would be identical and the permutation would have structure an attacker could exploit.",
    },
    {
      label: "why no HMAC needed",
      expr: "digest ⊂ state",
      note: "The output is only a slice of a much larger state, and the capacity is unknown. There is nothing to resume from, so SHA-3 is immune to the length extension that forces SHA-2 to be wrapped.",
    },
  ],
  symbols: [
    { symbol: "state", meaning: "1600 bits as a 5×5 grid of 64-bit lanes" },
    { symbol: "rate (r)", meaning: "The bytes the message is absorbed into, 136 for SHA3-256" },
    { symbol: "capacity (c)", meaning: "The remainder, never touched directly; sets the security level" },
    { symbol: "lane", meaning: "One 64-bit word of the state" },
    { symbol: "pad byte", meaning: "0x06 for SHA-3, 0x1F for SHAKE: the domain separator" },
    { symbol: "SHAKE", meaning: "The extendable-output variants, squeezing as many bytes as asked" },
  ],
  overview: [
    'SHA-3 is not a faster SHA-2; it is a different shape entirely. SHA-2 compresses the message block by block into a small chaining value, and the final chaining value is the digest. SHA-3 keeps a large fixed state of 1600 bits and works a sponge: message blocks are XORed into part of that state and stirred, then the digest is read back out of it.',
    'The state is a 5×5 grid of 64-bit lanes. It is split into two regions: the rate, which is where message bytes are absorbed, and the capacity, which the message never touches directly and which never appears in the output. The security level comes from the capacity; SHA3-256 uses a 136-byte rate and 64 bytes of capacity, giving 256 bits of collision resistance.',
    'That split is what makes SHA-3 immune to length extension. A SHA-2 digest is the function’s entire internal state, so an attacker holding H(m) can resume from it and append. A SHA-3 digest is only a slice of a much larger state; the capacity is unknown, so there is nothing to resume from. This is why SHA-3 can be used as a keyed MAC directly, with no HMAC wrapper.',
    'The permutation is 24 rounds of five mappings. θ XORs every bit with the parity of two whole columns: the only step that mixes across the entire state. ρ rotates each lane by a fixed offset and π moves the lanes to new positions; neither changes any bit, only where it sits. χ is the sole non-linear step, turning each bit into a simple boolean function of itself and its two neighbours along a row. ι XORs in a round constant, which exists purely to break the symmetry the other four preserve.',
    'The same permutation also gives SHAKE128 and SHAKE256, extendable-output functions that squeeze as many bytes as you ask for. Those are what the lattice-based post-quantum schemes use to expand seeds into matrices and sample noise, so this page is a prerequisite for the ones after it.',
  ],
  history: [
    'The competition that produced SHA-3 was a reaction to a scare rather than a break. In 2004 and 2005, Xiaoyun Wang’s team demolished MD5 and produced a theoretical collision attack on SHA-1. Since SHA-1 and SHA-2 share a design lineage, NIST worried that whatever killed one might extend to the other, and announced a public competition in 2007 for a structurally different backup.',
    'Sixty-four submissions were reduced to five finalists over five years of public cryptanalysis. Keccak, by Guido Bertoni, Joan Daemen, Michaël Peeters and Gilles Van Assche, was selected in October 2012 and standardised as FIPS 202 in August 2015. Daemen was also co-designer of Rijndael, making him responsible for both AES and SHA-3.',
    'The sponge construction was the reason it won. It was provably resistant to length extension, generalised naturally to extendable output, and shared nothing structurally with SHA-2, so a break of one would say nothing about the other, which was the entire point of running the competition.',
    'The anticlimax is that SHA-2 was never broken. SHA-3 is therefore not a replacement but an insurance policy, and adoption has been correspondingly slow: SHA-256 remains the default nearly everywhere. Where SHA-3 has genuinely taken hold is in its SHAKE variants, which are used throughout the NIST post-quantum standards; ML-KEM and ML-DSA both lean on SHAKE for sampling.',
    'There was one public controversy. In 2013 NIST proposed reducing the capacity to improve performance, which would have lowered the security margin; the cryptographic community objected loudly enough that the original parameters were kept.',
  ],
  weaknesses: [
    'No practical attack exists on full SHA-3. The best published results reach roughly 6 to 8 of the 24 rounds, which is a very large margin; comfortably larger, in round terms, than SHA-2’s.',
    'It is slower than SHA-256 in software on general-purpose CPUs, which is the main reason adoption has been limited. SHA-2 also benefits from hardware instructions on modern processors that SHA-3 largely does not; in dedicated hardware the picture reverses, since Keccak is cheap in gates.',
    'Collision resistance is half the digest length, as always: SHA3-256 gives 128 bits against a birthday attack, not 256. The capacity is sized to match, so this is by design rather than a shortfall.',
    'Like any general-purpose hash it is far too fast for password storage. Billions of evaluations per second on a GPU means a plain SHA-3 of a password is weak; Argon2 or bcrypt is what that job needs.',
    'The SHAKE functions will happily produce as many bytes as asked, which invites misuse: output length is not security level, and squeezing 1024 bytes from SHAKE128 does not give 8192 bits of strength; it gives 128.',
    'Domain separation matters more than it looks. SHA3-256 and SHAKE256 use the same rate and the same permutation, and are kept apart only by two padding bits. An implementation that gets those bits wrong produces digests that look perfectly plausible and match nothing.',
  ],
  sources: [
    {
      label: 'FIPS 202: SHA-3 and SHAKE',
      url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf',
      note: 'The sponge construction, the permutation, and the SHAKE outputs.',
    },
  ],
};
