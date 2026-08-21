import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'enigma',
  name: 'Enigma',
  category: 'classical',
  era: '1918',
  difficulty: 4,
  tagline: 'Rotors that step with every keypress, and a reflector that gave it away.',
  related: ['vigenere', 'rc4'],
};
