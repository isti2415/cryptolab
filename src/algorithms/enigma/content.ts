import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  tagline: 'Rotors that step with every keypress, and a reflector that gave it away.',
  formula: [
    {
      label: "signal path",
      expr: "plug → R → M → L → UKW → L → M → R → plug",
      note: "Current flows from the key through the plugboard, right to left across the three rotors, into the reflector, back left to right through the same rotors by a different path, and out through the plugboard to a lamp.",
    },
    {
      label: "rotor mapping",
      expr: "out = wiring[(in + pos − ring) mod 26] − pos + ring",
      note: "A rotor is a fixed permutation read at an offset. The window letter (pos) rotates the whole mapping; the ring setting (ring) shifts the wiring inside the rotor relative to that window, which is why the two are separate settings.",
    },
    {
      label: "stepping",
      expr: "right always; middle on notch; middle again if on its own notch",
      note: "The right rotor advances on every keypress. When it passes its notch it carries the middle; when the middle sits on its own notch it advances again and takes the left with it: the double-step anomaly, a consequence of the pawl mechanism rather than a design choice.",
    },
    {
      label: "the flaw",
      expr: "E(x) ≠ x  for every x",
      note: "The reflector pairs letters, so the current can never return along the path it came. No letter can encrypt to itself, which let cryptanalysts discard most alignments of a guessed word instantly, and is what the bombe was built to exploit.",
    },
  ],
  symbols: [
    { symbol: "R, M, L", meaning: "Right, middle and left rotors, in signal order" },
    { symbol: "UKW", meaning: "Umkehrwalze, the reflector; what makes the machine self-inverse" },
    { symbol: "pos", meaning: "The letter showing in a rotor’s window" },
    { symbol: "ring", meaning: "Ringstellung, the wiring’s offset from the window letter" },
    { symbol: "notch", meaning: "The window letter at which a rotor advances the next one" },
    { symbol: "plug", meaning: "The Steckerbrett, a reciprocal swap of up to 13 letter pairs" },
  ],
  overview: [
    'Enigma is a polyalphabetic substitution machine. Pressing a key first steps the rotors, then sends current from the key through the plugboard, right to left through three rotors, into the reflector, back left to right through the same three rotors by a different path, through the plugboard again, and out to a lamp.',
    'Because the rotors move before every letter, the substitution alphabet is different each time. The right rotor advances on every keypress; when it passes its notch it carries the middle one, and when the middle passes its notch it carries the left. Three rotors give 26 × 25 × 26 = 16,900 positions before the pattern repeats.',
    'The reflector is the machine’s defining component. Sending the current back through the rotors makes encryption and decryption the same operation; set a second machine identically, type the ciphertext, and the plaintext comes out. That was enormously practical for an army with thousands of operators.',
    'It also introduced the flaw that broke it. Because the reflector pairs letters up, the current can never return along the path it came, so no letter can ever encrypt to itself. That single fact let cryptanalysts rule out most candidate alignments of a guessed word instantly, and it is what the attack was built on.',
    'The stepping has a quirk worth knowing. If the middle rotor is sitting on its own notch, it advances again on the next keypress and carries the left rotor with it: the "double step". It is a consequence of how the pawls engage, not a design intention, and it reduces the period from 26³ to 26 × 25 × 26.',
  ],
  history: [
    'Arthur Scherbius patented Enigma in 1918 as a commercial machine for protecting business correspondence. It sold poorly. The German military adopted and modified it from the late 1920s, adding the plugboard, which multiplied the key space enormously and was the main reason they believed it unbreakable.',
    'The first breaks were Polish. From 1932, Marian Rejewski, Jerzy Różycki and Henryk Zygalski of the Biuro Szyfrów reconstructed the internal wiring using permutation group theory and a fragment of intelligence from a French agent; a genuinely remarkable piece of pure mathematics applied to a machine none of them had seen. They built the "bomba" to automate the search.',
    'In July 1939, five weeks before the invasion of Poland, they handed everything to British and French intelligence. Bletchley Park’s work began from that foundation rather than from scratch, a debt that went publicly unacknowledged for decades.',
    'Alan Turing and Gordon Welchman redesigned the approach for the harder wartime configurations. Turing’s bombe searched for rotor settings consistent with a crib, a guessed plaintext fragment, using the no-letter-maps-to-itself property to discard wrong positions, and Welchman’s diagonal board made it dramatically faster.',
    'The breaks depended heavily on operator error: stereotyped message openings, weather reports with predictable phrasing, repeated indicator settings, and the standing habit of ending messages "HEIL HITLER". The machine’s key space was never the weak point.',
    'Ultra intelligence is generally credited with shortening the war in Europe by a year or more. The work stayed classified until the 1970s, which is why Enigma’s reputation as unbreakable outlived the fact by three decades.',
  ],
  weaknesses: [
    'No letter can encrypt to itself. This is the fatal one. Given a crib, a guessed plaintext fragment, a cryptanalyst can slide it along the ciphertext and immediately discard every position where a letter would have to map to itself, usually eliminating the overwhelming majority of alignments before any real work starts.',
    'The reflector makes the machine self-inverse, which also means the substitution at every position is a set of pairs rather than an arbitrary permutation. That halves the effective structure and is what Turing’s bombe exploited to chain deductions across a crib.',
    'The plugboard looks like the biggest contributor to the key space and is the easiest part to strip away. Welchman’s diagonal board exploited the fact that plugboard connections are reciprocal (if A is plugged to B then B is plugged to A); turning a contradiction anywhere in a chain into a rejection of the whole configuration.',
    'Operator procedure leaked constantly. Early practice repeated the message key twice at the start of a transmission, which gave the Polish team the relationship they needed. Predictable openings, formulaic weather reports and lazy choices of rotor start position (initials, or three adjacent keys): all narrowed the search.',
    'Sending the same message on two different networks, one of which used a weaker cipher, gave direct cribs. So did retransmitting a message after a garbled reception with a new setting.',
    'None of this is about the key space. Around 10²³ configurations was genuinely large for the period; the machine fell to structural properties and human habit, which is the more general lesson.',
  ],
};
