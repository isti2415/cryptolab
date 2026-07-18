import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Shift each letter by a different amount, driven by a repeating keyword.',
  overview: [
    'The Vigenère cipher is polyalphabetic: rather than one fixed shift, it uses a keyword whose letters give a sequence of shifts. Write the keyword repeatedly beneath the message, then shift each plaintext letter forward by the value of the key letter above it.',
    'Because the shift changes from position to position, the same plaintext letter can become several different ciphertext letters. This defeats the simple frequency analysis that breaks monoalphabetic ciphers like Caesar and Affine.',
  ],
  history: [
    'The method was first described by Giovan Battista Bellaso in 1553, but was later misattributed to Blaise de Vigenère, whose name stuck.',
    'For three centuries it was reputed unbreakable, earning the nickname “le chiffre indéchiffrable” (the indecipherable cipher). It was widely used, including by the Confederate Army during the American Civil War.',
  ],
  weaknesses: [
    'Charles Babbage (c. 1854) and Friedrich Kasiski (1863) independently broke it: repeated substrings in the ciphertext reveal the key length, after which the message splits into several Caesar ciphers — one per key position — each solvable by frequency analysis.',
    'A short key relative to the message is the fatal flaw. The shorter and more repetitive the key, the more structure leaks. (When the key is truly as long as the message and never reused, it becomes the One-Time Pad — which is unbreakable.)',
  ],
  notes: [
    'Only letters are enciphered; case is preserved and other characters pass through. Non-letters do not consume a key letter, keeping the key aligned to the letters of the message.',
  ],
};
