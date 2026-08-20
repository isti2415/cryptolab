import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Kyber; Module-LWE key encapsulation, the first NIST post-quantum standard.',
  formula: [
    {
      label: "the ring",
      expr: "R_q = Z_q[X]/(Xⁿ + 1)",
      note: "Polynomials of degree under n with coefficients mod q. The quotient makes it negacyclic: a term passing degree n wraps round with its sign flipped, since Xⁿ ≡ −1.",
    },
    {
      label: "public key",
      expr: "t = A·s + e  over R_q",
      note: "Structurally identical to plain LWE, but every entry of A, s, e and t is a polynomial rather than a number. That is the only change, and it is what brings a public key from megabytes down to about a kilobyte.",
    },
    {
      label: "encapsulate",
      expr: "u = Aᵀ·r + e₁,   v = tᵀ·r + e₂ + ⌈q/2⌋·m",
      note: "The sender draws their own small vectors and forms the ciphertext pair. Each message bit is scaled by ⌈q/2⌋ into one coefficient of v, exactly as in plain LWE: one bit per coefficient.",
    },
    {
      label: "decapsulate",
      expr: "round(v − sᵀ·u)",
      note: "Only the key holder can compute sᵀ·u. Subtracting it leaves the message plus noise, and each coefficient rounds to whichever of 0 and q/2 it is nearer.",
    },
    {
      label: "why polynomials",
      expr: "k² polynomials instead of a k·n square matrix",
      note: "A plain LWE public key grows with the square of the dimension. A rank-k module over a degree-n ring carries the same weight in k² polynomials, and products in this ring can be computed with a number-theoretic transform; small and fast, at the cost of extra algebraic structure that must be assumed harmless.",
    },
    {
      label: "what the standard adds",
      expr: "Fujisaki–Okamoto transform",
      note: "The construction above is only CPA-secure. Real ML-KEM re-encrypts during decapsulation to check the ciphertext was honestly formed; without that, an attacker who submits malformed ciphertexts and watches the results recovers the key.",
    },
  ],
  symbols: [
    { symbol: "n", meaning: "Ring degree; 256 in FIPS 203, 8 here so coefficients fit on screen" },
    { symbol: "k", meaning: "Module rank: how many polynomials make up a vector" },
    { symbol: "q", meaning: "The coefficient modulus, 3329; Kyber’s real value" },
    { symbol: "A", meaning: "A k×k matrix of polynomials, expanded from a public seed" },
    { symbol: "s, e", meaning: "Secret and error vectors, coefficients from a narrow binomial" },
    { symbol: "u, v", meaning: "The two halves of the ciphertext" },
  ],
  overview: [
    'ML-KEM is a key encapsulation mechanism rather than an encryption scheme. It does not take your message; it produces a shared secret and a ciphertext that lets the key holder recover it. That is what a modern protocol actually needs; the shared secret keys a symmetric cipher, which does the real work.',
    'The mathematics is the Learning With Errors problem with one structural change: the flat matrix of numbers becomes a small matrix of *polynomials*, in the ring Z_q[X]/(Xⁿ + 1). That ring is negacyclic: a term passing degree n wraps around with its sign flipped, since Xⁿ ≡ −1.',
    'The change is entirely about size. A plain LWE public key grows with the square of the dimension and runs to megabytes; a rank-k module over a degree-n ring carries the same weight in k² polynomials, bringing ML-KEM-768 down to 1184 bytes. It also makes multiplication fast, because polynomial products in this ring can be computed with a number-theoretic transform.',
    'Everything else is LWE. The public key is t = A·s + e with s and e small. Encapsulation draws its own small vectors, forms u and v, and hides each message bit by adding ⌈q/2⌋ to a coefficient of v. Decapsulation subtracts sᵀ·u (which only the key holder can compute), and rounds each coefficient to whichever of 0 and q/2 it is nearer.',
    'Correctness is probabilistic, not exact. It holds as long as the accumulated noise stays inside q/4, and the walkthrough shows how much of that budget each run actually consumes. Real parameters push the failure probability to around 2⁻¹⁶⁴.',
    'Real ML-KEM adds one more layer. The construction described above is only CPA-secure; the standard wraps it in the Fujisaki–Okamoto transform, which re-encrypts during decapsulation to check the ciphertext was honestly formed. Without it, an attacker who can submit malformed ciphertexts and observe the results recovers the key.',
  ],
  history: [
    'Kyber was submitted to NIST’s post-quantum competition in 2017 by a team including Peter Schwabe, Joppe Bos, Léo Ducas, Eike Kiltz, Tancrède Lepoint, Vadim Lyubashevsky, John Schanck, Gregor Seiler and Damien Stehlé. It built on a decade of work on Ring-LWE and Module-LWE following Regev’s original scheme.',
    'The competition ran for six years across three rounds of public cryptanalysis. NIST selected Kyber in July 2022 as the sole key-encapsulation mechanism to standardise, citing its balance of speed, key size and confidence in the underlying assumption. It became FIPS 203, ML-KEM, in August 2024.',
    'Deployment moved faster than standardisation. Chrome and Cloudflare began experimenting with hybrid X25519+Kyber key exchange in 2022 and 2023, and by 2024 a substantial share of TLS connections were negotiating it. Signal shipped PQXDH in 2023, and Apple’s iMessage adopted PQ3 in 2024.',
    'The deployments are almost all hybrid; a classical elliptic-curve exchange combined with ML-KEM, so that a break of either leaves the other standing. That caution reflects how much younger lattice cryptanalysis is than the alternatives it is replacing.',
    'The driver is "harvest now, decrypt later": traffic recorded today can be decrypted whenever a large enough quantum computer exists. For anything that must stay secret for decades, waiting is not an option, which is why migration began before the standard was final.',
  ],
  weaknesses: [
    'Decapsulation can fail. Correctness depends on the noise staying under q/4, and there is always a small probability it does not. Real parameters make that around 2⁻¹⁶⁴, but the failure mode is real, and an attacker who can trigger and observe failures learns about the secret key, which is precisely why the Fujisaki–Okamoto transform is mandatory rather than optional.',
    'The CPA-secure core shown here is not safe to use on its own. Submit malformed ciphertexts to a raw K-PKE decapsulation and the responses leak the key. Everything about ML-KEM’s chosen-ciphertext security comes from the transform layered on top.',
    'Keys and ciphertexts are large by comparison. ML-KEM-768 has a 1184-byte public key and 1088-byte ciphertext, against 32 bytes each for X25519. That is a real cost in handshake size, particularly on constrained links, and it is why ML-KEM transports keys rather than data.',
    'Module-LWE assumes more than plain LWE. The algebraic structure that makes the keys small is also structure an attacker might exploit, and the worst-case reduction is correspondingly weaker. No attack is known, but the assumption is younger and stronger than "factoring is hard".',
    'Implementations leak. Lattice schemes sample noise and perform rejection and comparison steps whose timing can depend on secrets; several published attacks recover keys from timing or power traces rather than from the mathematics. The reference implementations go to considerable lengths to be constant-time.',
    'Security estimates are less settled than for RSA or elliptic curves. Lattice attack costs are modelled through BKZ, whose concrete cost is still debated, so quoted security levels have moved as the analysis improved.',
    'This lab is Kyber’s structure at toy parameters and is explicitly not FIPS 203. The ring degree is 8 rather than 256, the module rank is 2, and the Fujisaki–Okamoto transform is absent, so what is shown is the CPA-secure core only. It produces none of the standard’s test vectors and must not be mistaken for an implementation of it.',
  ],
};
