import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'ml-dsa',
  name: 'ML-DSA (Dilithium)',
  category: 'pqc',
  era: '2024',
  difficulty: 5,
  tagline: 'Dilithium; lattice signatures that throw away any candidate leaking the key.',
  related: ['lwe', 'ml-kem', 'rsa'],
};
