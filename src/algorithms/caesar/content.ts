import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  formula: [
    {
      label: "encrypt",
      expr: "c = (x + k) mod 26",
      note: "Take the letter’s position in the alphabet, add the key, and wrap at 26. A is 0, so with k = 3 the letter A becomes D.",
    },
    {
      label: "decrypt",
      expr: "x = (c − k) mod 26",
      note: "The same shift the other way. Subtracting k mod 26 is the same as adding 26 − k, which is why one implementation handles both directions given a signed key.",
    },
    {
      label: "key space",
      expr: "k ∈ {0, 1, …, 25}",
      note: "Twenty-six values, of which k = 0 is the identity. That leaves 25 useful keys; few enough to write out every possible decryption by hand in under a minute.",
    },
    {
      label: "composition",
      expr: "Eⱼ(Eₖ(x)) = Eⱼ₊ₖ(x)",
      note: "Two shifts collapse into one. Encrypting with 5 and then with 9 is a single Caesar of 14, so applying the cipher repeatedly, with as many keys as you like, never produces anything outside those same 25 alphabets. This is the property every later cipher is built to escape.",
    },
    {
      label: "breaking it by counting",
      expr: "k̂ = argminₖ Σᵢ (obsᵢ₊ₖ − expᵢ)²",
      note: "Slide the observed letter frequencies against the expected ones for English and keep the shift that fits best. No guessing and no wordlist: one pass over the counts names the key, which is why this is the standard first exercise in cryptanalysis.",
    },
  ],
  symbols: [
    { symbol: "x", meaning: "Plaintext letter as a number, A = 0 through Z = 25" },
    { symbol: "c", meaning: "Ciphertext letter, in the same numbering" },
    { symbol: "k", meaning: "The key: how many places to shift" },
    { symbol: "mod 26", meaning: "Wrap around the 26-letter alphabet, so Z + 1 is A" },
    { symbol: "Eₖ", meaning: "Encryption under key k, as a function on letters" },
    { symbol: "k̂", meaning: "The attacker’s estimate of the key, recovered from letter counts" },
    { symbol: "obs, exp", meaning: "Observed letter frequencies, and those expected for the language" },
  ],
  overview: [
    'The Caesar cipher replaces each letter with the one a fixed number of positions further along the alphabet. That number, the shift, is the entire key, so the whole cipher fits in a sentence and can be worked by hand at conversational speed.',
    'With a shift of 3, A becomes D and B becomes E; letters at the end wrap around, so X, Y and Z become A, B and C. Decryption is the same operation in reverse, which means a single implementation handles both directions given a signed shift.',
    'It belongs to a family called monoalphabetic substitution ciphers: one fixed rule maps the plaintext alphabet onto the ciphertext alphabet, and that rule never changes as the message goes on. Every other cipher on this site is, in some sense, an attempt to escape the consequences of that one property.',
    'The 26 shifts form a group: composing any two gives a third, every shift has an inverse, and doing nothing is one of them. That is a compact way of saying the cipher cannot be strengthened by using it harder. Encrypt with three different keys in sequence and an attacker still faces 25 possibilities, because the three collapse into one. Vigenère is the first cipher on this site to break out of that trap, and it does so by the simplest available means: changing the shift as the message goes on.',
    'Its modern descendant is ROT13, a Caesar shift of 13. Because 13 is exactly half of 26, applying it twice returns the original text, so the same operation both hides and reveals, which is why it became the convention for concealing spoilers and punchlines on Usenet, where nobody pretended it was security.',
  ],
  history: [
    'Suetonius, writing around AD 121 in his life of Julius Caesar, describes Caesar replacing each letter with the one three places further on when he had something confidential to send. The same passage records that Augustus used a shift of one, and did not wrap; he wrote AA where the alphabet ran out at X.',
    'The cipher is far older than its reputation for triviality suggests it should be. For several centuries after Caesar there was no systematic method for breaking substitution ciphers at all, so a shift genuinely protected a message from a reader who had not been told the trick.',
    'That ended in the 9th century with al-Kindi, whose manuscript on deciphering cryptographic messages set out frequency analysis: count how often each ciphertext symbol appears, compare against how often each letter appears in the language, and read the mapping off the result. It is the first known description of statistical cryptanalysis, and it retired the entire monoalphabetic family in one document.',
    'It is also the ancestor of a specific piece of machinery rather than just an idea. Alberti’s cipher disk of 1467 is two concentric alphabets that can be rotated against each other: set the disk once and it is a Caesar, turn it as you write and it is a polyalphabetic cipher. Every rotor machine down to Enigma is a mechanisation of that same rotation, which is why a shift is worth understanding properly before anything else here.',
    'The cipher survives today as a teaching example and as ROT13, and, less happily, inside a long tail of software that shipped a shift where it needed encryption. It is worth knowing precisely because recognising it takes seconds.',
  ],
  weaknesses: [
    'Using it more than once gains nothing, and this is the deeper problem. Because shifts compose into shifts, no amount of layering enlarges the key space: a message encrypted under five different Caesar keys is still a Caesar. A cipher whose repeated application stays inside its own key space cannot be made stronger by iteration, only replaced.',
    'It leaks the shape of the message as well as its statistics. Word boundaries, letter doubling and word lengths all survive the shift intact, so even before counting anything an attacker can see where the short words are, and a three-letter word ending in the most common letter of the ciphertext is very probably "the".',
    'The key space is 25 non-trivial shifts. An attacker does not need a technique at all: they write out all 25 candidate decryptions and read the one that is English. This takes under a minute by hand and microseconds by machine, and no choice of key improves matters, because every key is equally weak.',
    'Even without exhaustion, the cipher preserves the frequency profile of the language exactly; it slides the distribution along without changing its shape. English text is roughly 12% E, 9% T, 8% A; find the peak of the ciphertext distribution, and the offset from E is almost always the key. The frequency panel in the walkthrough shows the two profiles side by side, and the match is visible immediately.',
    'Because the cipher is monoalphabetic, structure leaks even without counting. Doubled letters stay doubled, word shapes are preserved, and a single guessed word (a name, a date, a signature) recovers the key and therefore the entire message, past and future.',
    'Shift 0 is the identity, and shift 13 is its own inverse. Neither is a flaw in the arithmetic so much as a reminder of how little the key is doing: with 25 options, some of them will always be degenerate.',
  ],
  sources: [
    {
      label: 'Suetonius, Life of Julius Caesar, §56',
      url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Suetonius/12Caesars/Julius*.html',
      note: 'The passage describing the shift, and the earliest record of the cipher.',
    },
    {
      label: 'Al-Kindi and frequency analysis',
      url: 'https://en.wikipedia.org/wiki/Al-Kindi#Cryptography',
      note: 'The 9th-century method that made monoalphabetic ciphers obsolete.',
    },
  ],
};
