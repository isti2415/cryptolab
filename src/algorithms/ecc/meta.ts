import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'ecdh',
  name: 'Elliptic Curve (ECDH)',
  category: 'publickey',
  era: '1985',
  difficulty: 5,
  tagline: 'Diffie–Hellman on a curve: the same idea, in a group where attacks work far worse.',
  related: ['diffie-hellman', 'rsa', 'ml-dsa'],
};
