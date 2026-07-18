import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'A random key as long as the message, used exactly once — provably unbreakable.',
  overview: [
    'The One-Time Pad combines each letter of the message with a letter from a random pad, using the same modular addition as Vigenère: c = (p + pad) mod 26. The crucial difference is the pad — it is random, at least as long as the message, and never reused.',
    'Under those conditions every possible plaintext of the same length is an equally likely explanation of the ciphertext, so the ciphertext reveals nothing at all about the message. This is not merely hard to break — it is mathematically impossible, a property called perfect secrecy.',
  ],
  history: [
    'Frank Miller described the idea in 1882; Gilbert Vernam and Joseph Mauborgne developed the modern form around 1917–1919, originally XORing message bits with a random key tape.',
    'In 1949 Claude Shannon proved that the one-time pad achieves perfect secrecy and that any perfectly secret cipher needs a key at least as long as the message. Pads were used for the highest-security diplomatic and espionage traffic, including the Washington–Moscow hotline.',
  ],
  weaknesses: [
    'The secrecy proof collapses if any rule is broken. Reuse a pad and the two ciphertexts can be combined to cancel the key — this is exactly how the US VENONA project read Soviet messages that reused pad pages.',
    'The pad must be truly random; a pad from a predictable generator is only as strong as that generator, not the pad.',
    'It is wildly impractical: you must securely distribute and store as much key material as you will ever send, and destroy it after one use. This key-distribution problem is precisely what public-key cryptography (like RSA) was invented to solve.',
  ],
  notes: [
    'This lab uses the letter / mod-26 formulation to mirror Vigenère; real pads often XOR raw bytes instead. Supply a pad at least as long as the message — a short pad is rejected rather than silently reused.',
  ],
};
