import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'playfair',
  name: 'Playfair Cipher',
  category: 'classical',
  era: '1854',
  difficulty: 3,
  tagline: 'Encrypt letters two at a time using a 5×5 key square.',
  related: ['hill', 'vigenere'],
};
