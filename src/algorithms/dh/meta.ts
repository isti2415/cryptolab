import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'diffie-hellman',
  name: 'Diffie–Hellman',
  category: 'publickey',
  era: '1976',
  difficulty: 3,
  tagline: 'Two strangers agree a shared secret in public, without ever sending it.',
  related: ['ecdh', 'rsa', 'ml-kem'],
};
