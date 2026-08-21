import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'des',
  name: 'DES',
  category: 'symmetric',
  era: '1977',
  difficulty: 4,
  tagline: 'A 16-round Feistel block cipher: the first modern encryption standard.',
  related: ['3des', 'aes', 'blowfish'],
};
