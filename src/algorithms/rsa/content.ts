import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  formula: [
    {
      label: "the modulus",
      expr: "n = p·q",
      note: "Two secret primes multiplied together. n is published; recovering p and q from it is the factoring problem, and everything RSA claims rests on that being infeasible.",
    },
    {
      label: "the totient",
      expr: "φ(n) = (p−1)(q−1)",
      note: "How many numbers below n share no factor with it. Trivial to compute from p and q, and infeasible from n alone, which is precisely why the primes must never be published.",
    },
    {
      label: "the key pair",
      expr: "e coprime with φ(n);   d = e⁻¹ mod φ(n)",
      note: "The public exponent e is chosen freely; the private exponent d is its modular inverse, found by the extended Euclidean algorithm. Because e·d ≡ 1 (mod φ(n)), raising to e and then to d returns the original value.",
    },
    {
      label: "encrypt",
      expr: "c = mᵉ mod n",
      note: "Anyone with the public key (n, e) can do this. Textbook RSA as shown here is deterministic, so the same message always gives the same ciphertext, which is why real systems randomise the padding first.",
    },
    {
      label: "decrypt",
      expr: "m = c^d mod n",
      note: "Only the holder of d can reverse it. That d follows from φ(n), which follows from p and q, is the whole chain; break any link and the private key falls out.",
    },
    {
      label: "computing it",
      expr: "square-and-multiply, one step per exponent bit",
      note: "m^65537 is not 65537 multiplications. Walk the bits of the exponent, squaring each step and folding the base in where a bit is set, so cost scales with the exponent’s size rather than its value.",
    },
  ],
  symbols: [
    { symbol: "p, q", meaning: "The two secret primes" },
    { symbol: "n", meaning: "The public modulus: all arithmetic happens mod n" },
    { symbol: "φ(n)", meaning: "Euler’s totient; secret, because knowing it gives d" },
    { symbol: "e", meaning: "The public exponent, commonly 65537" },
    { symbol: "d", meaning: "The private exponent, e⁻¹ mod φ(n)" },
    { symbol: "m, c", meaning: "The message and ciphertext, as numbers below n" },
  ],
  overview: [
    'RSA is asymmetric: encryption and decryption use different keys. Two secret primes p and q give a modulus n = p·q and Euler’s totient φ(n) = (p−1)(q−1). A public exponent e is chosen coprime with φ(n), and the private exponent d is its modular inverse, so that e·d ≡ 1 (mod φ(n)). The public key is (n, e); the private key is (n, d).',
    'Encryption raises the message to the power e mod n; decryption raises the result to the power d. That these undo each other follows from Euler’s theorem: raising to e and then to d is raising to something congruent to 1 modulo φ(n), which returns the original value. Anyone can encrypt with the public key, and only the holder of d can reverse it.',
    'This solved a problem every earlier cipher had. Symmetric ciphers require both parties to already share a secret, which means the secret has to be distributed somehow, by courier, by meeting, by trusting a channel. Public-key cryptography lets two parties who have never met establish confidentiality over a channel an adversary is watching.',
    'Nobody computes mᵉ by multiplying m by itself e times. Square-and-multiply walks the exponent bit by bit, squaring the running base each step and folding it into the result only where a bit is set, so cost scales with the number of bits in the exponent rather than its value. The walkthrough traces that ladder row by row, and it is why a 2048-bit exponentiation is merely slow rather than impossible.',
    'Security rests on an asymmetry of effort, not on secrecy of method. Multiplying p by q is one operation. Recovering p and q from n is, as far as anyone knows publicly, infeasible once the numbers are large enough, and knowing p and q is the same as knowing φ(n), which is the same as knowing d.',
  ],
  history: [
    'Ron Rivest, Adi Shamir and Leonard Adleman published the algorithm at MIT in 1977, after Whitfield Diffie and Martin Hellman had proposed public-key cryptography in 1976 without a concrete construction for it. The story is that Rivest and Shamir proposed schemes and Adleman broke them, repeatedly, until one survived.',
    'Martin Gardner described it in Scientific American in August 1977, along with a challenge: a 129-digit modulus and $100 for whoever factored it. Gardner estimated it would take on the order of 40 quadrillion years. RSA-129 was factored in 1994 by a distributed effort of around 600 volunteers using the quadratic sieve over eight months: an object lesson in how badly humans estimate algorithmic progress.',
    'The idea had been discovered earlier and kept quiet. Clifford Cocks, working at GCHQ, described essentially the same scheme in a 1973 internal note; James Ellis had proposed the concept of non-secret encryption in 1970 and Malcolm Williamson had found the Diffie–Hellman construction. None of it could be published, and the work was only declassified in 1997.',
    'Factoring records have advanced steadily: RSA-155 (512 bits) in 1999, RSA-768 in 2009, and RSA-250, 829 bits, in February 2020, using the general number field sieve and roughly 2,700 core-years. 1024-bit RSA is considered within reach of well-resourced attackers and is deprecated; 2048 bits is the current floor and 3072 or more is recommended for long-lived keys.',
    'The MIT patent expired in September 2000. Shor’s algorithm, published in 1994, would break RSA outright on a sufficiently large quantum computer, which is the direct reason for the post-quantum standardisation effort.',
  ],
  weaknesses: [
    'Textbook RSA, what this lab implements, is deterministic. The same message always encrypts to the same ciphertext under the same key, so an attacker who can guess the plaintext can simply encrypt candidates and compare. Encrypting one character at a time, as here, makes it a substitution cipher with expensive arithmetic: there are only as many possible ciphertexts as there are characters.',
    'It is also malleable. Because (m₁·m₂)ᵉ ≡ c₁·c₂ (mod n), an attacker can multiply a ciphertext by a chosen factor and predictably transform the plaintext without ever decrypting it. Real systems use randomised padding (OAEP for encryption, PSS for signatures) precisely to destroy both determinism and malleability. RSA without padding is not a weaker RSA; it is a different and broken thing.',
    'Padding schemes themselves have been a rich source of failures. Bleichenbacher showed in 1998 that PKCS#1 v1.5 could be attacked by feeding a server modified ciphertexts and watching which ones it rejected, recovering the plaintext from the error responses alone. Variants of that attack have resurfaced repeatedly, most recently against TLS implementations decades later.',
    'Key generation is a common failure point. Primes must be large, random, and independently generated. Surveys of deployed TLS and SSH keys have found large numbers sharing a prime factor with another key, because devices generated keys at first boot with insufficient entropy, and two moduli sharing a factor are both recovered instantly by computing a gcd. The ROCA vulnerability in 2017 broke keys from a widely deployed Infineon library whose prime generation left an exploitable structure.',
    'RSA is slow and its keys are large compared with elliptic-curve alternatives at equivalent security, which is why modern protocols increasingly prefer ECDH and Ed25519.',
    'A cryptographically relevant quantum computer running Shor’s algorithm would factor n efficiently and break RSA completely, not weaken it. Data encrypted today can be captured and stored against that possibility, which is why migration to post-quantum schemes is being planned now rather than later.',
    'This lab uses small primes so the arithmetic stays legible, and encrypts one character code at a time with no padding. It demonstrates the mathematics faithfully and is deliberately, explicitly not secure. Never use textbook RSA for anything real.',
  ],
  sources: [
    {
      label: 'Rivest, Shamir and Adleman (1978)',
      url: 'https://people.csail.mit.edu/rivest/Rsapaper.pdf',
      note: 'The original paper.',
    },
    {
      label: 'RFC 8017 (PKCS #1 v2.2): OAEP and PSS',
      url: 'https://www.rfc-editor.org/rfc/rfc8017',
      note: 'The padding this lab deliberately omits, and why it is mandatory.',
    },
    {
      label: 'Bleichenbacher (1998)',
      url: 'https://link.springer.com/content/pdf/10.1007/BFb0055716.pdf',
      note: 'The padding-oracle attack on PKCS #1 v1.5.',
    },
  ],
};
