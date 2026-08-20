import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Encrypt letters two at a time using a 5×5 key square.',
  formula: [
    {
      label: "same row",
      expr: "(r, c) → (r, c+1 mod 5)",
      note: "When both letters of the pair sit in the same row, each is replaced by the letter to its right, wrapping past the end of the row back to its start.",
    },
    {
      label: "same column",
      expr: "(r, c) → (r+1 mod 5, c)",
      note: "When both share a column, each is replaced by the letter below it, wrapping past the bottom back to the top.",
    },
    {
      label: "rectangle",
      expr: "(r₁,c₁),(r₂,c₂) → (r₁,c₂),(r₂,c₁)",
      note: "Otherwise the two letters are opposite corners of a rectangle. Each is replaced by the corner in its own row and the other letter’s column, rows stay, columns swap.",
    },
    {
      label: "decrypt",
      expr: "the same rules, shifting left and up",
      note: "The row and column rules reverse direction; the rectangle rule is its own inverse, since swapping columns twice returns the original.",
    },
  ],
  symbols: [
    { symbol: "(r, c)", meaning: "A letter’s row and column in the 5×5 key square, each 0 to 4" },
    { symbol: "mod 5", meaning: "Wrap around the edge of the square" },
    { symbol: "digraph", meaning: "The pair of letters enciphered together" },
    { symbol: "I/J", meaning: "The two share one cell, so 25 letters fit a 5×5 grid" },
  ],
  overview: [
    'Playfair enciphers pairs of letters rather than single ones. A keyword fills a 5×5 grid (duplicates dropped, then the rest of the alphabet in order), and I and J share a cell so that 25 letters fit. Every pair of plaintext letters is located in that grid and replaced according to where the two letters sit relative to each other.',
    'Three rules cover every case. If the letters share a row, each is replaced by the letter to its right, wrapping past the edge. If they share a column, each is replaced by the letter below, wrapping past the bottom. Otherwise the two letters form the corners of a rectangle, and each is replaced by the corner in its own row and the other letter’s column.',
    'Two letters must never be identical within a pair, because the rules have nothing to say about a letter and itself. A filler (X, or Q when the doubled letter is already X); is inserted to break them apart, and an odd-length message is padded the same way. This is why the digraph stream can be slightly longer than the text you typed.',
    'Working on digraphs is the point. There are 600 possible pairs rather than 26 single letters, and the frequency distribution over pairs is far flatter than over letters, so the straightforward frequency attack that dismantles every monoalphabetic cipher no longer applies directly. It was the first cipher to achieve that while remaining workable in the field with nothing but a memorised keyword and a pencil.',
  ],
  history: [
    'Charles Wheatstone invented it in 1854: the same Wheatstone known for the bridge and for early telegraphy. It carries the name of his friend Lyon Playfair, first Baron Playfair, who promoted it to the Foreign Office and the War Office.',
    'The initial reception was dismissive: officials reportedly objected that it was too complicated for field use. Wheatstone’s response was to show that schoolboys could be taught it in fifteen minutes. He was right, and it was eventually adopted.',
    'It saw genuine service. British forces used it in the Second Boer War and in the First World War, and Australian coastwatchers relied on it in the Pacific during the Second World War, where its virtue was that it required no machine, no table and no codebook; only a keyword in someone’s head, and nothing incriminating to be captured with.',
    'By the Second World War it was understood to be breakable and was used accordingly: for tactical traffic whose value expired in hours. That is a mature use of a weak cipher, and a distinction modern deployments frequently fail to make.',
  ],
  weaknesses: [
    'Enciphering pairs raises the bar rather than clearing it. Digraph frequency analysis works on the same principle as letter frequency analysis: TH, HE, IN and ER are common in English, and their images in the ciphertext are correspondingly common. A few hundred letters of text is generally enough.',
    'The structure leaks in ways that are easy to exploit. A letter never encrypts to itself, reversed digraphs encrypt to reversed digraphs, and the rectangle rule preserves a great deal of positional information about the grid. Each of these is a constraint an attacker can use to prune candidate squares.',
    'Known plaintext is close to fatal. A handful of matched digraphs pins down enough grid relationships to reconstruct the square, and because the square comes from a keyword, partial recovery often suggests the rest by guessing at English.',
    'The filler letters and the I/J merge introduce ambiguity in the other direction: decryption produces a padded, upper-case letter stream that a human has to interpret. Playfair does not round-trip cleanly to the original text.',
    'The key is a memorable word, so the effective key space is a dictionary rather than the 25! arrangements of the grid. Human key choice is a recurring theme in the failure of classical ciphers.',
  ],
};
