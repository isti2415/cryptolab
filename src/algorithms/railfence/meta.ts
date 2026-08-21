import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'railfence',
  name: 'Rail Fence',
  category: 'classical',
  era: '~1861',
  difficulty: 1,
  tagline: 'Write the message in a zigzag across several rails, then read it off row by row.',
  related: ['playfair', 'des'],
};
