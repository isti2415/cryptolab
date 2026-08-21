import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'lwe',
  name: 'Learning With Errors',
  category: 'pqc',
  era: '2005',
  difficulty: 4,
  tagline: 'Add a little noise to a solvable equation and it becomes the basis of post-quantum cryptography.',
  related: ['ml-kem', 'ml-dsa'],
};
