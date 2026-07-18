import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Public-key encryption built on the difficulty of factoring large numbers.',
  overview: [
    'RSA is a public-key (asymmetric) cipher: encryption and decryption use different keys. From two primes p and q you form a modulus n = p·q and the totient φ(n) = (p−1)(q−1). A public exponent e is chosen coprime with φ(n), and the private exponent d is its inverse modulo φ(n).',
    'Anyone can encrypt a message m with the public key (n, e) by computing c = mᵉ mod n, but only the holder of the private key (n, d) can recover it with m = c^d mod n. This one-way asymmetry solves the problem every earlier cipher had: two parties can communicate securely without first sharing a secret key.',
    'Its security rests on a hard problem — factoring n back into p and q. Multiplying two large primes is easy; splitting the product apart is, as far as we know, infeasible for big enough numbers.',
  ],
  history: [
    'Published in 1977 by Ron Rivest, Adi Shamir and Leonard Adleman at MIT, whose initials give it its name. The same idea had been discovered secretly a few years earlier by Clifford Cocks at GCHQ, but that work stayed classified until 1997.',
    'RSA was the first practical public-key cryptosystem and remains one of the most important, underpinning digital signatures, certificate authorities and the key exchange behind secure web traffic for decades.',
  ],
  weaknesses: [
    '“Textbook” RSA like this lab shows is deterministic and malleable — the same message always encrypts to the same ciphertext, and ciphertexts can be manipulated. Real RSA must use randomised padding (OAEP for encryption, PSS for signatures) to be secure.',
    'Security depends entirely on large keys. The primes here are tiny for teaching; real RSA needs a modulus of 2048 bits or more, and 1024-bit RSA is now considered breakable by well-resourced attackers.',
    'RSA is slow and its keys are large compared with elliptic-curve schemes, so modern systems increasingly prefer ECC. And like all current public-key crypto based on factoring or discrete logs, RSA would be broken by a large quantum computer running Shor’s algorithm — the reason for the push toward post-quantum cryptography.',
  ],
  notes: [
    'This lab uses small primes so the arithmetic is followable, and encrypts one character code at a time (no padding). It demonstrates the mathematics faithfully but is deliberately not secure — never use textbook RSA for anything real.',
  ],
};
