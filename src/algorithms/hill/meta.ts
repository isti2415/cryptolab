import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'hill',
  name: 'Hill Cipher',
  category: 'classical',
  era: '1929',
  difficulty: 3,
  tagline: 'Encrypt blocks of letters with matrix multiplication mod 26.',
  related: ['affine', 'aes'],
};
