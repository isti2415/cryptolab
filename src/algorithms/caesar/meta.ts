import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'caesar',
  name: 'Caesar Cipher',
  category: 'classical',
  era: '~50 BC',
  difficulty: 1,
  tagline: 'Shift every letter a fixed number of places down the alphabet.',
  related: ['affine', 'vigenere'],
};
