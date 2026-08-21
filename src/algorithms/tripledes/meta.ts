import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: '3des',
  name: 'Triple DES',
  category: 'symmetric',
  era: '1978',
  difficulty: 4,
  tagline: 'DES three times over: the stopgap that kept a broken key length usable.',
  related: ['des', 'aes'],
};
