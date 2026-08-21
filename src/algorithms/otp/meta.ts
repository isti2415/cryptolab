import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'otp',
  name: 'One-Time Pad',
  category: 'classical',
  era: '1917',
  difficulty: 2,
  tagline: 'A random key as long as the message, used exactly once, provably unbreakable.',
  related: ['vigenere', 'rc4', 'chacha20'],
};
