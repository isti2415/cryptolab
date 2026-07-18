/**
 * The algorithm registry — the single place the app learns which algorithms
 * exist. Adding a new algorithm is a two-line change here plus its own folder;
 * nothing else needs to know about it.
 *
 * Ordering follows the pedagogical classical → modern arc.
 */

import type { AnyAlgorithm } from './types';
import caesar from '@/algorithms/caesar';
import affine from '@/algorithms/affine';
import vigenere from '@/algorithms/vigenere';
import otp from '@/algorithms/otp';
import playfair from '@/algorithms/playfair';
import hill from '@/algorithms/hill';
import des from '@/algorithms/des';
import aes from '@/algorithms/aes';
import rsa from '@/algorithms/rsa';

export const algorithms: AnyAlgorithm[] = [
  caesar,
  affine,
  vigenere,
  otp,
  playfair,
  hill,
  des,
  aes,
  rsa,
];

const byId = new Map(algorithms.map((a) => [a.meta.id, a]));

export function getAlgorithm(id: string): AnyAlgorithm | undefined {
  return byId.get(id);
}

export function algorithmsByCategory() {
  return {
    classical: algorithms.filter((a) => a.meta.category === 'classical'),
    modern: algorithms.filter((a) => a.meta.category === 'modern'),
  };
}
