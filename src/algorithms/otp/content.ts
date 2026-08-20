import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'A random key as long as the message, used exactly once, provably unbreakable.',
  formula: [
    {
      label: "encrypt",
      expr: "cᵢ = (xᵢ + kᵢ) mod 26",
      note: "Identical arithmetic to Vigenère, add a key letter, wrap at 26. Every difference between the two ciphers lies in the conditions on k, not in this line.",
    },
    {
      label: "decrypt",
      expr: "xᵢ = (cᵢ − kᵢ) mod 26",
      note: "Subtract the pad letter that was added. The pad must be at hand, in full, and identical at both ends.",
    },
    {
      label: "conditions",
      expr: "k truly random,  |k| ≥ |x|,  used once",
      note: "These three requirements are the cipher. Each pad letter must be uniformly random and independent, there must be at least as many as message letters, and no pad letter may ever be used twice.",
    },
    {
      label: "perfect secrecy",
      expr: "Pr[x | c] = Pr[x]",
      note: "Seeing the ciphertext leaves the probability of any plaintext exactly what it was before. For every candidate message of the right length there is a pad producing this exact ciphertext, and all were equally likely, so the ciphertext rules nothing out.",
    },
  ],
  symbols: [
    { symbol: "xᵢ, cᵢ", meaning: "the i-th plaintext and ciphertext letters, as numbers" },
    { symbol: "kᵢ", meaning: "the i-th pad letter; random, secret, used exactly once" },
    { symbol: "|k|, |x|", meaning: "lengths of the pad and the message" },
    { symbol: "Pr[x | c]", meaning: "probability the message was x, given the ciphertext is c" },
  ],
  overview: [
    'The one-time pad combines each character of the message with a character of key material, and never reuses that material. Mechanically it is a Vigenère cipher whose keyword is as long as the message; the difference is not in the arithmetic but in the conditions imposed on the key.',
    'Those conditions are what make it the only cipher on this site with a proof rather than a track record. If the pad is truly random, at least as long as the message, kept secret and used exactly once, the ciphertext reveals nothing about the plaintext beyond its length, not to a better algorithm, not to more computing power, not ever.',
    'The reason is easier to see than to state. For any ciphertext and any candidate message of the same length, there exists a pad that maps one to the other, and if the pad was chosen uniformly at random, every one of those pads was equally likely. An intercepted message is consistent with every possible message. The walkthrough constructs one such alternative explicitly: a second, entirely real pad that decrypts the same ciphertext into a different and perfectly sensible sentence.',
    'The cost is that the problem has been moved rather than solved. Two parties who can securely exchange a pad as long as everything they will ever say could have exchanged the messages themselves. That is why the one-time pad is used where key distribution is genuinely feasible and secrecy must be absolute, and essentially nowhere else.',
  ],
  history: [
    'Frank Miller described the scheme for telegraph traffic in an 1882 codebook, a fact that went unnoticed for over a century. Gilbert Vernam of AT&T patented an electromechanical version in 1919 that XORed a paper key tape with teleprinter characters, and Joseph Mauborgne of the US Army Signal Corps added the critical requirements: that the tape be truly random and never repeat.',
    'Claude Shannon supplied the proof in 1949, in Communication Theory of Secrecy Systems, formalising perfect secrecy and showing the one-time pad achieves it; and, less comfortably, that any cipher achieving it needs a key at least as long as the message.',
    'The Moscow–Washington hotline established after the Cuban Missile Crisis used one-time tape, with pads exchanged through embassies. Soviet intelligence used pads throughout the Cold War, and captured pad booklets printed on flash paper are a museum staple.',
    'The most instructive episode is a failure. Between 1942 and 1948, under wartime production pressure, Soviet pad manufacturers duplicated some pages. US Army cryptanalysts noticed, and the Venona project exploited that reuse for decades, exposing espionage networks including the identification of Klaus Fuchs. The cipher was not broken; the discipline was.',
  ],
  weaknesses: [
    'Reuse is total collapse. Encrypt two messages with the same pad and subtracting one ciphertext from the other cancels the key entirely, leaving the difference of two plaintexts, which is readily separable using ordinary language statistics. This is not a weakening; the security proof simply does not apply, and Venona is what that looks like in practice.',
    'The pad must be truly random. Output from a pseudorandom generator turns the pad into a stream cipher whose real key is the generator’s seed, and the proof evaporates: security is then bounded by the seed size, not the pad length.',
    'Key distribution is the whole problem. Pads must be generated, physically transported, stored securely at both ends, tracked so neither side reuses a page, and destroyed after use. Every one of those steps has failed historically, and the cipher offers no help with any of them.',
    'It provides confidentiality and nothing else. Because encryption is a per-character combination, an attacker who knows the plaintext can flip it to any other message of the same length by adjusting the ciphertext: the recipient decrypts the forgery cleanly. Real systems need a separate authentication mechanism; the pad will not detect tampering.',
    'It leaks length. Perfect secrecy covers content, not size, and message length is often enough on its own.',
  ],
};
