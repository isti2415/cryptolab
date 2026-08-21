import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'blowfish',
  name: 'Blowfish',
  category: 'symmetric',
  era: '1993',
  difficulty: 4,
  tagline: 'A Feistel cipher whose S-boxes are built from the key, not fixed.',
  related: ['des', 'aes'],
};
