import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'sha3',
  name: 'SHA-3 / Keccak',
  category: 'hash',
  era: '2015',
  difficulty: 5,
  tagline: 'A sponge: absorb the message into a big state, squeeze the digest back out.',
  related: ['sha256', 'hmac'],
};
