import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Encrypt letters two at a time using a 5×5 key square.',
  overview: [
    'Playfair encrypts pairs of letters rather than single letters. A keyword builds a 5×5 grid containing the alphabet (with I and J sharing a cell), and the message is broken into two-letter groups called digraphs.',
    'Each digraph is located in the grid and replaced according to three rules: if the letters share a row, shift right; if they share a column, shift down; otherwise they form a rectangle and each letter takes the corner in its own row and the other letter’s column. Because it enciphers pairs, single-letter frequency analysis no longer works directly.',
  ],
  history: [
    'Invented by Charles Wheatstone in 1854 but championed by his friend Lord Playfair, whose name it carries.',
    'It was the first practical digraph substitution cipher and saw real field use by British forces in the Boer War and the First World War, and by Australian coastwatchers in the Second — valued because it needed no tables or machines, just a memorised keyword.',
  ],
  weaknesses: [
    'Enciphering pairs only raises the bar: digraph frequency analysis works instead, since common pairs like TH and HE leave a statistical fingerprint in the ciphertext.',
    'The structure leaks information — reversed digraphs encrypt to reversed digraphs, and a letter never encrypts to itself — which gives cryptanalysts strong footholds. Known-plaintext attacks reconstruct the grid quickly.',
    'The I/J merge and the filler letters introduce ambiguity, so decryption can require judgement to read the original message.',
  ],
  notes: [
    'This implementation folds J into I, inserts a filler (X, or Q after an X) to separate doubled letters and pad odd lengths, and drops case and punctuation. Output is shown in pairs; decryption returns the padded upper-case letter stream.',
  ],
};
