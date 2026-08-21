import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'hash-signatures',
  name: 'Hash-Based Signatures',
  category: 'pqc',
  era: '1979',
  difficulty: 5,
  tagline: 'Signatures from hash functions alone: the most conservative post-quantum option.',
  related: ['sha256', 'ml-dsa'],
};
