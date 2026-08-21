import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'sha256',
  name: 'SHA-256',
  category: 'hash',
  era: '2001',
  difficulty: 4,
  tagline: 'Compress any message to 256 bits, with no way back.',
  related: ['sha3', 'hmac', 'hash-signatures'],
};
