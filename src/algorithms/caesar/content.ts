import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Shift every letter a fixed number of places down the alphabet.',
  overview: [
    'The Caesar cipher is a substitution cipher: each letter of the message is replaced by the letter a fixed number of positions away in the alphabet. That fixed number is the whole key.',
    'With a shift of 3, A becomes D, B becomes E, and so on; letters near the end wrap around, so X, Y, Z become A, B, C. Decryption is simply the same shift in the opposite direction.',
  ],
  history: [
    'Named for Julius Caesar, who according to Suetonius used a left shift of three to protect messages of military significance around 58–50 BC.',
    'It is the archetypal cipher — simple enough to do in your head, and the ancestor of every substitution cipher that followed. The name ROT13 refers to a Caesar shift of 13, still used today to hide spoilers and punchlines in plain sight.',
  ],
  weaknesses: [
    'There are only 25 possible non-trivial keys, so an attacker can simply try all of them — a brute-force search that takes seconds by hand.',
    'Even without trying every key, the cipher preserves letter frequencies: the most common ciphertext letter usually maps back to E. Frequency analysis breaks it instantly on any reasonable amount of text.',
    'It is a monoalphabetic cipher — the same plaintext letter always encrypts to the same ciphertext letter — which is exactly the structure that makes it easy to break.',
  ],
  notes: [
    'This implementation enciphers the 26 letters A–Z, preserves case, and passes every other character (spaces, digits, punctuation) through unchanged.',
  ],
};
