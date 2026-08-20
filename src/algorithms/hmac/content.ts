import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Turn a hash into a keyed tag, so only the key holder can produce it.',
  formula: [
    {
      label: "the construction",
      expr: "HMAC(K, m) = H((K′ ⊕ opad) ‖ H((K′ ⊕ ipad) ‖ m))",
      note: "Two nested hashes, each with a differently masked copy of the key in front. The inner one processes the message; the outer one processes only the inner digest.",
    },
    {
      label: "key normalisation",
      expr: "K′ = len(K) > B ? H(K) : K ‖ 0…0",
      note: "A key longer than one hash block is replaced by its own digest; a shorter one is zero-padded up. Note the consequence: a long key and its hash produce identical tags, so they are interchangeable to an attacker.",
    },
    {
      label: "the pads",
      expr: "ipad = 0x36 repeated,  opad = 0x5C repeated",
      note: "Both are one block long. The two constants differ in four of their eight bits, so the two masked keys are unrelated in any way an attacker can use.",
    },
    {
      label: "why nesting works",
      expr: "outer input is a fixed 32 bytes",
      note: "The naive H(K ‖ m) is broken against SHA-2, because a digest is the hash’s entire state and can be resumed. The outer hash here consumes a fixed-length digest, so there is nothing to append, and that, not the XOR masks, is what defeats length extension.",
    },
    {
      label: "verifying",
      expr: "constant-time compare",
      note: "A comparison that returns as soon as two bytes differ leaks how much of a supplied tag was correct, letting an attacker rebuild a valid tag one byte at a time. This is the most common HMAC vulnerability in real code, and it is entirely outside the algorithm.",
    },
  ],
  symbols: [
    { symbol: "H", meaning: "The underlying hash; SHA-256 here, but any will do" },
    { symbol: "K, K′", meaning: "The key as supplied, and normalised to exactly one block" },
    { symbol: "B", meaning: "The hash’s block size: 64 bytes for SHA-256, not its 32-byte output" },
    { symbol: "‖", meaning: "Concatenation" },
    { symbol: "⊕", meaning: "XOR, byte by byte across the block" },
  ],
  overview: [
    'A hash detects change but proves nothing about origin: anyone can compute SHA-256, so anyone can recompute a digest after altering the message. A message authentication code adds a key, so a valid tag can only be produced by someone who holds it.',
    'The obvious way to build one (hash the key followed by the message); is broken against SHA-256, and instructively so. A SHA-256 digest is the hash function’s complete internal state, so an attacker holding H(key ‖ m) can resume from it and compute H(key ‖ m ‖ padding ‖ anything) without ever knowing the key. That is the length-extension attack, and it forged real signatures in real APIs.',
    'HMAC nests two hashes to close it. The inner hash processes the message with one masked copy of the key in front; the outer hash processes the inner digest with a differently masked copy. Because the outer hash consumes a fixed 32 bytes, there is nothing left for an attacker to append; that, rather than the masks themselves, is what defeats the attack.',
    'The key is first normalised to exactly one hash block: hashed down if longer than 64 bytes, zero-padded if shorter. It is then XORed with 0x36 repeated to give the inner key, and with 0x5C repeated for the outer. Those two constants differ in four of their eight bits, so the two masked keys are unrelated in any way an attacker can exploit.',
    'HMAC is deliberately agnostic about its hash. Swap SHA-256 for SHA-1 or SHA-512 and the construction is unchanged, which is why it survived the collapse of MD5 and SHA-1 largely intact; HMAC-MD5 was never broken by the collision attacks that destroyed MD5 signatures.',
  ],
  history: [
    'Mihir Bellare, Ran Canetti and Hugo Krawczyk published HMAC in 1996, and it was standardised as RFC 2104 the following year. Its distinguishing feature at the time was a security proof: HMAC is secure as long as the underlying hash’s compression function is a decent pseudorandom function, which is a much weaker assumption than collision resistance.',
    'That proof turned out to matter enormously. When MD5 and then SHA-1 fell to collision attacks in 2004 and 2005, HMAC built on them did not fall with them; collisions are not the property HMAC depends on. Deployments still migrated, but there was no emergency.',
    'It became infrastructure quickly: NIST standardised it as FIPS 198 in 2002, and it appears in TLS record authentication, IPsec, SSH, JSON Web Tokens, AWS request signing, and as the core of both HKDF and PBKDF2.',
    'The length-extension problem it solves was not theoretical. Flickr’s API signature scheme was broken in 2009 by exactly this attack, and the same flaw has been found repeatedly in home-grown API signing schemes since. SHA-3 and BLAKE2 are designed to resist length extension natively, so a plain keyed hash is safe with them, but with SHA-2, HMAC is the answer.',
  ],
  weaknesses: [
    'Verification must compare in constant time. A comparison that returns as soon as two bytes differ leaks how much of the supplied tag was correct, and an attacker can rebuild a valid tag one byte at a time by timing the responses. This is the most common HMAC vulnerability in real code, and it is entirely outside the algorithm.',
    'It provides authenticity, not confidentiality. HMAC does not hide the message and never claims to; encryption is a separate job, and combining the two safely has its own pitfalls; encrypt-then-MAC is the ordering that is provably sound, and MAC-then-encrypt is where several TLS attacks lived.',
    'Truncating the tag weakens it exactly as much as you truncate. Some protocols use the first 96 or 128 bits, which is a deliberate trade; taking a handful of bytes to save space makes forgery correspondingly easier.',
    'Keys longer than the block size are hashed first, which has a surprising consequence: a 100-byte key and its 32-byte SHA-256 digest produce identical tags. Two keys that look completely different are the same key as far as HMAC is concerned.',
    'The pad is applied to the hash’s *block* size, 64 bytes for SHA-256, not its 32-byte output size. Implementations that confuse the two produce tags that are wrong but look plausible, and interoperate with nothing.',
    'HMAC inherits its hash’s security level, so HMAC-MD5 should not be used in new systems even though it is not broken by MD5 collisions. It also does nothing about replay: a valid tag stays valid forever unless the message includes a nonce or timestamp.',
  ],
};
