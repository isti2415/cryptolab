/**
 * GF(2⁸) arithmetic and the AES S-box, computed from first principles rather
 * than hard-coded, so the numbers are derived by the same definitions AES uses:
 * a byte's multiplicative inverse in the field, followed by the fixed affine
 * transform. This keeps the implementation honest and free of table typos.
 */

/** Russian-peasant multiplication in GF(2⁸) with the AES reduction poly 0x11B. */
export function gmul(a: number, b: number): number {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

// Exp/log tables using the generator 0x03, for fast multiplicative inverses.
const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x = gmul(x, 3);
  }
  EXP[255] = EXP[0];
})();

export function gInverse(b: number): number {
  return b === 0 ? 0 : EXP[(255 - LOG[b]) % 255];
}

function rotl8(x: number, n: number): number {
  return ((x << n) | (x >> (8 - n))) & 0xff;
}

export const SBOX = new Uint8Array(256);
export const INV_SBOX = new Uint8Array(256);
(() => {
  for (let b = 0; b < 256; b++) {
    const inv = gInverse(b);
    const s =
      inv ^ rotl8(inv, 1) ^ rotl8(inv, 2) ^ rotl8(inv, 3) ^ rotl8(inv, 4) ^ 0x63;
    SBOX[b] = s & 0xff;
    INV_SBOX[SBOX[b]] = b;
  }
})();
