import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'aes',
  name: 'AES',
  category: 'symmetric',
  era: '2001',
  difficulty: 5,
  tagline: 'The modern standard: a substitution-permutation network on a 4×4 byte grid.',
  related: ['des', '3des', 'chacha20'],
};
