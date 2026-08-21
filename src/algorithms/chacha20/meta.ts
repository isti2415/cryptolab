import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'chacha20',
  name: 'ChaCha20',
  category: 'symmetric',
  era: '2008',
  difficulty: 4,
  tagline: 'A stream cipher of nothing but adds, XORs and rotations, no tables, no timing leaks.',
  related: ['rc4', 'otp', 'aes'],
};
