import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'ml-kem',
  name: 'ML-KEM (Kyber)',
  category: 'pqc',
  era: '2024',
  difficulty: 5,
  tagline: 'Kyber; Module-LWE key encapsulation, the first NIST post-quantum standard.',
  related: ['lwe', 'diffie-hellman', 'ml-dsa'],
};
