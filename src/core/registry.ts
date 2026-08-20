/**
 * The algorithm registry: the single place the app learns which algorithms
 * exist. Adding a new algorithm is a two-line change here plus its own folder;
 * nothing else needs to know about it.
 *
 * Ordering follows the pedagogical classical → modern arc.
 */

import type { AnyAlgorithm, Category } from './types';
import caesar from '@/algorithms/caesar';
import railfence from '@/algorithms/railfence';
import enigma from '@/algorithms/enigma';
import affine from '@/algorithms/affine';
import vigenere from '@/algorithms/vigenere';
import otp from '@/algorithms/otp';
import playfair from '@/algorithms/playfair';
import hill from '@/algorithms/hill';
import rc4 from '@/algorithms/rc4';
import blowfish from '@/algorithms/blowfish';
import chacha20 from '@/algorithms/chacha20';
import des from '@/algorithms/des';
import tripledes from '@/algorithms/tripledes';
import aes from '@/algorithms/aes';
import sha256 from '@/algorithms/sha256';
import sha3 from '@/algorithms/sha3';
import hmac from '@/algorithms/hmac';
import dh from '@/algorithms/dh';
import ecc from '@/algorithms/ecc';
import rsa from '@/algorithms/rsa';
import lwe from '@/algorithms/lwe';
import hashsig from '@/algorithms/hashsig';
import mlkem from '@/algorithms/mlkem';
import mldsa from '@/algorithms/mldsa';

export const algorithms: AnyAlgorithm[] = [
  caesar,
  affine,
  vigenere,
  otp,
  playfair,
  hill,
  railfence,
  enigma,
  rc4,
  blowfish,
  chacha20,
  des,
  tripledes,
  aes,
  sha256,
  sha3,
  hmac,
  dh,
  ecc,
  rsa,
  lwe,
  mlkem,
  mldsa,
  hashsig,
];

const byId = new Map(algorithms.map((a) => [a.meta.id, a]));

export function getAlgorithm(id: string): AnyAlgorithm | undefined {
  return byId.get(id);
}

/** Display order and labels for the category groups. */
export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  {
    id: 'classical',
    title: 'Classical',
    blurb: 'Pen-and-paper ciphers, from Caesar to the eve of the computer age.',
  },
  {
    id: 'symmetric',
    title: 'Symmetric',
    blurb: 'Block and stream ciphers: one shared key encrypts and decrypts.',
  },
  {
    id: 'hash',
    title: 'Hashes & MACs',
    blurb: 'One-way functions, and what you build on them to detect tampering.',
  },
  {
    id: 'publickey',
    title: 'Public key',
    blurb: 'Different keys to encrypt and decrypt, and to agree a secret in the open.',
  },
  {
    id: 'pqc',
    title: 'Post-quantum',
    blurb: 'Schemes designed to survive an adversary with a quantum computer.',
  },
];

/** Algorithms grouped for navigation, in `CATEGORIES` order, empties dropped. */
export function algorithmGroups() {
  return CATEGORIES.map((c) => ({
    ...c,
    items: algorithms.filter((a) => a.meta.category === c.id),
  })).filter((g) => g.items.length > 0);
}
