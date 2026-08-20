import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Add a little noise to a solvable equation and it becomes the basis of post-quantum cryptography.',
  formula: [
    {
      label: "the easy problem",
      expr: "given A and A·s, find s",
      note: "Gaussian elimination: a first-year linear algebra exercise. Nothing is hidden.",
    },
    {
      label: "the hard problem",
      expr: "given A and b = A·s + e, find s",
      note: "Add a small error to each equation and the same problem is believed hard, for classical and quantum computers alike. Elimination works by combining rows, and every combination accumulates the errors until they swamp the signal.",
    },
    {
      label: "public key",
      expr: "b = A·s + e  (mod q)",
      note: "A is uniform and public; s is the secret and e the noise, both small. On its own A says nothing, and b says nothing more.",
    },
    {
      label: "encrypt one bit",
      expr: "u = Aᵀ·r,   v = b·r + m·⌊q/2⌋",
      note: "Add up a random subset of the published equations (the sum is itself a valid noisy equation, so it leaks nothing new), then add ⌊q/2⌋ if the bit is 1. The message lives in the gap between 0 and q/2.",
    },
    {
      label: "decrypt",
      expr: "round(v − u·s) to 0 or ⌊q/2⌋",
      note: "Only the holder of s can compute u·s. What remains is the message plus accumulated noise, and rounding to whichever of the two values is nearer recovers the bit.",
    },
    {
      label: "the budget",
      expr: "noise < q/4",
      note: "Correctness holds only while the accumulated error stays inside a quarter of the modulus. Past that the rounding starts giving wrong answers, which is why lattice schemes can, in principle, fail to decrypt, and why most of their parameter budget goes on preventing it.",
    },
  ],
  symbols: [
    { symbol: "A", meaning: "a public matrix, chosen uniformly at random" },
    { symbol: "s", meaning: "the secret vector: the private key" },
    { symbol: "e", meaning: "the error vector, every entry small (here −2 to +2)" },
    { symbol: "q", meaning: "the modulus; all arithmetic wraps at q" },
    { symbol: "r", meaning: "a random 0/1 vector selecting which equations to add" },
    { symbol: "⌊q/2⌋", meaning: "half the modulus: the gap the message hides in" },
  ],
  overview: [
    'Learning With Errors is the problem underneath ML-KEM and ML-DSA, and it is built on one change to something entirely ordinary. Given a matrix A and the product A·s, recovering the vector s is Gaussian elimination: a first-year linear algebra exercise. Publish A·s + e instead, where every entry of e is off by one or two, and the same problem is believed to be hard.',
    'The noise is what breaks the algebra. Elimination works by subtracting scaled rows from one another, and with errors present every such combination accumulates them; after a handful of steps the noise swamps the signal. There is no known way to recover s that does not, in effect, search.',
    'Regev’s encryption scheme turns that into a cryptosystem. The public key is A and b = A·s + e. To encrypt a single bit, add up a random subset of the published equations (the sum is itself a valid noisy equation, so it leaks nothing new), and then add ⌊q/2⌋ to the result if the bit is 1. To decrypt, subtract u·s, which only the holder of s can compute, and round to whichever of 0 and q/2 is nearer.',
    'The message therefore lives in the *gap* between 0 and q/2, and correctness depends on the accumulated noise staying well inside q/4. That budget is the central design tension in every lattice scheme: more noise means more security and a higher chance of decryption failing.',
    'What makes this interesting for post-quantum cryptography is that Shor’s algorithm does not apply. Shor breaks factoring and discrete logarithms because both are period-finding problems in disguise, and a quantum computer finds periods efficiently. Lattice problems have no such structure, and no quantum algorithm meaningfully better than the classical ones is known.',
    'Regev also proved a worst-case to average-case reduction: breaking randomly generated LWE instances is at least as hard as solving certain lattice problems in the worst case. That is an unusually strong foundation; most cryptography rests on problems merely believed hard on average.',
  ],
  history: [
    'Miklós Ajtai showed in 1996 that certain lattice problems have a worst-case to average-case reduction, which made lattices interesting for cryptography for the first time. Ajtai and Cynthia Dwork built a public-key scheme on that in 1997, though it was far too inefficient to use.',
    'Oded Regev introduced Learning With Errors in 2005, along with the encryption scheme shown here and a quantum reduction from worst-case lattice problems. It was both simpler and more usable than what came before, and it is the paper the entire field traces back to. Regev received the Gödel Prize for it in 2018.',
    'Practical schemes needed more structure. Plain LWE keys are large (the public matrix alone is quadratic in the dimension), so Ring-LWE (Lyubashevsky, Peikert and Regev, 2010) and then Module-LWE replaced the matrix with polynomials, cutting key sizes by orders of magnitude at the cost of extra algebraic structure that must be assumed harmless.',
    'NIST began its post-quantum standardisation process in 2016, and in 2024 published FIPS 203 and 204; ML-KEM and ML-DSA, both Module-LWE schemes descended directly from this construction. A third standard, FIPS 205, took a completely different route and is built only on hash functions.',
    'The urgency is "harvest now, decrypt later": an adversary recording encrypted traffic today can decrypt it whenever a sufficiently large quantum computer arrives. For data that must stay secret for decades, the migration deadline has effectively already passed.',
  ],
  weaknesses: [
    'Decryption can fail. Because correctness depends on the noise staying below q/4, there is always a small probability that it does not. Real parameters push that probability to around 2⁻¹⁴⁰, but it is not zero, and an attacker who can trigger and observe failures learns about the secret, which is why chosen-ciphertext hardening is mandatory rather than optional.',
    'Ciphertexts and keys are large. This toy scheme encrypts one bit into a four-element vector plus a number. Real lattice schemes are far better but still bulky compared with elliptic curves: an ML-KEM-768 public key is 1184 bytes against Curve25519’s 32. That is why they are used to transport symmetric keys, not bulk data.',
    'The extra structure in Ring-LWE and Module-LWE is an assumption, not a theorem. Those variants exist because plain LWE is too slow, but the algebraic structure that makes them fast is also structure an attacker might exploit. No attack is known; the reduction is simply weaker than for plain LWE.',
    'Implementations leak. Lattice schemes involve sampling from noise distributions and rejection loops whose timing can depend on secret values. Several published side-channel attacks recover keys from timing or power traces rather than from the mathematics.',
    'The security estimates are less settled than for factoring. Lattice attacks are analysed through the BKZ algorithm, whose cost model is a matter of ongoing debate, so quoted security levels have shifted as estimates improve. Nobody expects a break; the confidence intervals are simply wider.',
    'And this implementation, specifically, is a toy. Four dimensions and a 97-element field are breakable by exhaustive search in microseconds. Nothing here should be mistaken for a usable scheme.',
  ],
};
