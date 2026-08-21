import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'rsa',
  name: 'RSA',
  category: 'publickey',
  era: '1977',
  difficulty: 5,
  tagline: 'Public-key encryption built on the difficulty of factoring large numbers.',
  related: ['diffie-hellman', 'ecdh', 'ml-dsa'],
};
