import type { AlgorithmMeta } from '@/core/types';

/**
 * Catalogue entry. This is the ONLY file in the folder loaded eagerly for every
 * algorithm (the nav, the home page cards and the route table all need it), so
 * it must stay small: no engine, no prose, no components.
 */
export const meta: AlgorithmMeta = {
  id: 'hmac',
  name: 'HMAC',
  category: 'hash',
  era: '1996',
  difficulty: 3,
  tagline: 'Turn a hash into a keyed tag, so only the key holder can produce it.',
  related: ['sha256', 'sha3'],
};
