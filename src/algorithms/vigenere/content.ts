import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  formula: [
    {
      label: "encrypt",
      expr: "cᵢ = (xᵢ + k[i mod m]) mod 26",
      note: "Each letter gets its own shift, taken from the keyword by position. The i-th letter uses the (i mod m)-th key letter, so the keyword cycles across the message.",
    },
    {
      label: "decrypt",
      expr: "xᵢ = (cᵢ − k[i mod m]) mod 26",
      note: "Subtract the same key letter that was added. The key position depends only on i, so the receiver needs the keyword and nothing else.",
    },
    {
      label: "the tableau",
      expr: "row r, column c → (r + c) mod 26",
      note: "The 26×26 square is this addition written out in full. Find the row named by the key letter and the column named by the plaintext letter; where they meet is the ciphertext.",
    },
    {
      label: "why it breaks",
      expr: "period = m",
      note: "The key repeats every m letters, so every m-th letter shares one Caesar shift. Recover m (by Kasiski examination or the index of coincidence), and the cipher becomes m independent Caesar ciphers, each solvable by frequency analysis.",
    },
  ],
  symbols: [
    { symbol: "xᵢ, cᵢ", meaning: "The i-th plaintext and ciphertext letters, as numbers" },
    { symbol: "k", meaning: "The keyword, as a sequence of shifts (A = 0, B = 1, …)" },
    { symbol: "m", meaning: "The keyword length, and the period an attacker looks for" },
    { symbol: "i mod m", meaning: "Position within the repeating keyword" },
  ],
  overview: [
    'The Vigenère cipher is a stack of Caesar ciphers used in rotation. A keyword is written repeatedly beneath the message, and each letter is shifted by the amount its key letter names: A shifts by 0, B by 1, and so on. With the keyword LEMON, the first letter shifts by 11, the second by 4, the third by 12, and after five letters the pattern begins again.',
    'This makes it polyalphabetic: the same plaintext letter encrypts differently depending on where it falls. In ATTACKATDAWN under LEMON the three As become L, P and R. That single property defeats the direct frequency attack that breaks every monoalphabetic cipher, because the ciphertext distribution is a blend of several shifted alphabets rather than one.',
    'The traditional working tool is the tableau: a 26×26 square whose row r holds the alphabet shifted by r. To encipher, find the row named by the key letter and the column named by the plaintext letter; the cell where they meet is the ciphertext. The walkthrough shows the real square with that row and column picked out, because the table is where the "sequence of Caesars" idea becomes visible rather than merely stated.',
    'Security scales with key length. A one-letter keyword is exactly Caesar. A keyword as long as the message, randomly chosen and never repeated, is a one-time pad and is unbreakable. Everything practical sits between those poles, and the repetition is what an attacker attacks.',
  ],
  history: [
    'The cipher is named for Blaise de Vigenère, a 16th-century French diplomat, but he did not invent it. The construction was published in 1553 by Giovan Battista Bellaso; Vigenère’s own 1586 work described a stronger autokey variant in which the message itself extends the key, so it never repeats. History attached the weaker cipher to the better-known name and it stayed there.',
    'For roughly three centuries it was regarded as unbreakable, earning the nickname le chiffre indéchiffrable. That reputation was not unreasonable; it defeated the only general technique anyone had.',
    'Charles Babbage broke it around 1854 and never published; the work surfaced later in his notes. Friedrich Kasiski published the first general method in 1863, and it carries his name: find repeated strings in the ciphertext, measure the distances between them, and the key length is very likely a common factor of those distances.',
    'William Friedman added the index of coincidence in the 1920s, giving a statistical rather than combinatorial route to the period, and with it the modern shape of the attack.',
    'The Confederate Army used Vigenère throughout the American Civil War with a brass cipher disc, relying on a handful of fixed phrases as keys. Union cryptanalysts read the traffic routinely; a reminder that a cipher’s theoretical strength and its operational strength are different quantities.',
  ],
  weaknesses: [
    'The keyword repeats, and repetition is structure. Kasiski examination finds repeated ciphertext sequences, factors the gaps between them, and recovers the key length, typically from a few hundred letters of text.',
    'Once the key length m is known the cipher collapses. Take every m-th letter and you have a body of text enciphered with a single Caesar shift; solve each of the m columns independently by frequency analysis. A polyalphabetic cipher with a known period is just several monoalphabetic ciphers standing next to each other.',
    'Short keys are catastrophically weak and memorable keys are worse. A five-letter keyword against a thousand-letter message gives two hundred samples per column, far more than frequency analysis needs, and human-chosen keywords come from a small dictionary an attacker can simply enumerate.',
    'Known plaintext is fatal and immediate: subtracting known plaintext from the matching ciphertext yields key letters directly, and once m of them are recovered the whole message follows.',
    'The autokey variant Vigenère actually proposed avoids the repetition entirely and is genuinely harder to break: a small historical irony, given which cipher carries his name.',
  ],
  sources: [
    {
      label: 'Kasiski examination',
      url: 'https://en.wikipedia.org/wiki/Kasiski_examination',
      note: 'The 1863 method for recovering the key length.',
    },
  ],
};
