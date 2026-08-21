import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'vigenere',
  name: 'Vigenère Cipher',
  category: 'classical',
  era: '1553',
  difficulty: 2,
  tagline: 'Shift each letter by a different amount, driven by a repeating keyword.',
  related: ['caesar', 'otp', 'enigma'],
};
