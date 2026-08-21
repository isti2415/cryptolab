import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'affine',
  name: 'Affine Cipher',
  category: 'classical',
  era: 'antiquity',
  difficulty: 2,
  tagline: 'Multiply, then shift: a Caesar cipher with a scaling factor.',
  related: ['caesar', 'hill'],
};
