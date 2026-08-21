import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'rc4',
  name: 'RC4',
  category: 'symmetric',
  era: '1987',
  difficulty: 3,
  tagline: 'A 256-byte permutation, stirred by the key and then swapped one byte at a time.',
  related: ['chacha20', 'otp'],
};
