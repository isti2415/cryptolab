import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Write the message in a zigzag across several rails, then read it off row by row.',
  formula: [
    {
      label: "rail of position i",
      expr: "j = i mod (2r − 2);  rail = j < r ? j : 2r − 2 − j",
      note: "The zigzag runs down to the bottom rail and back up to the top. The cycle is 2r − 2 rather than 2r because the top and bottom rails are visited once per cycle while every rail between them is visited twice.",
    },
    {
      label: "ciphertext",
      expr: "rails read top to bottom, left to right",
      note: "Once the message is written along the zigzag, the ciphertext is simply each rail read off in order. No letter is changed, only where it sits.",
    },
    {
      label: "decrypt",
      expr: "count each rail, refill, retrace",
      note: "The shape of the fence depends only on the message length and the rail count, not on any letter. So the receiver can work out exactly how many letters belong to each rail before placing one, fill the rails in order, then follow the zigzag back.",
    },
  ],
  symbols: [
    { symbol: "i", meaning: "position of a letter in the message, counting from 0" },
    { symbol: "r", meaning: "the number of rails: the entire key" },
    { symbol: "2r − 2", meaning: "the period of the zigzag" },
    { symbol: "transposition", meaning: "a cipher that reorders letters rather than replacing them" },
  ],
  overview: [
    'Every other classical cipher on this site substitutes: it replaces each letter with a different one. The rail fence replaces nothing. It writes the message diagonally down and back up across a set of rails, then reads the rails off one at a time. The letters that come out are exactly the letters that went in, in a different order.',
    'That makes it a transposition cipher, and it fails to a completely different attack than everything else here. Frequency analysis is useless against it: the ciphertext has precisely the letter distribution of the plaintext, because it is the plaintext, merely reordered. What gives it away instead is that the distribution looks like ordinary English while the text does not read as English; a strong signal that the letters have merely been rearranged.',
    'The key is a single number: how many rails. The zigzag repeats with a period of 2r − 2, since the top and bottom rails are visited once per cycle while every rail between them is visited twice going down and coming back up.',
    'Decryption is more interesting than it first looks. The shape of the fence depends only on the message length and the rail count, not on any of the letters, so the receiver can work out exactly how many letters belong to each rail before placing a single one. Measure the rails, refill them in order, then trace the zigzag back.',
  ],
  history: [
    'Transposition is at least as old as substitution. The Spartan scytale, described by Plutarch and dated to around the 7th to 5th century BC, wrapped a leather strip around a rod of a particular diameter and wrote across the turns; unwound, the letters were scrambled, and only a rod of matching diameter reassembled them. That is a transposition cipher with the rod as the key.',
    'The rail fence itself is a folk cipher with no clear inventor, familiar from puzzle books and children’s codes. Its more serious relatives were used in earnest: the Union army employed route ciphers during the American Civil War, in which the message was written into a grid and read out along an agreed path, often with null words inserted to confuse the shape.',
    'Columnar transposition (write into a grid, then read the columns in an order given by a keyword); remained militarily relevant far longer. The German ADFGVX cipher of the First World War combined a substitution step with a columnar transposition specifically because neither alone was sufficient, and it took Georges Painvin months of work to break it.',
    'The lasting idea is the combination. Substitution hides which letters are present; transposition hides where they are. Modern block ciphers do both in every round (AES’s SubBytes is substitution and its ShiftRows is transposition), because each covers the other’s weakness.',
  ],
  weaknesses: [
    'The key is a single small number. With a practical range of two to a dozen rails, an attacker simply tries every one and reads whichever output is English. There is nothing to search.',
    'It leaks its own nature immediately. Because the letters are unchanged, the ciphertext has a perfectly normal English letter distribution (roughly 12% E, 9% T), while being unreadable. Any cryptanalyst seeing normal frequencies in unreadable text concludes "transposition" before doing anything else, and the rail fence is the first thing they try.',
    'It preserves letter counts exactly, so an attacker knows the message length and can often anchor on expected words. Short messages are worse still: with few letters the fence barely folds and fragments of the original order survive intact in the output.',
    'Used alone it provides no confusion whatsoever. There is no relationship between key and letter identity at all, only between key and position, so a single correct guess about position is not narrowed by anything else.',
    'Real transposition ciphers mitigated some of this with keyword-driven column orders, multiple passes and null padding. The rail fence has none of those, which is what makes it a teaching cipher rather than a historical one.',
  ],
};
