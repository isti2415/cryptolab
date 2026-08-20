/**
 * HMAC-SHA-256 (RFC 2104).
 *
 * A hash tells you whether data changed. It cannot tell you *who* changed it,
 * because anyone can compute a hash. A MAC adds a key, so only someone holding
 * it can produce a valid tag.
 *
 * The obvious construction (hash the key followed by the message), is broken
 * against Merkle–Damgård hashes like SHA-256, because a digest is the hash's
 * entire internal state and an attacker can resume from it and append. HMAC's
 * nested structure exists specifically to close that door: the outer hash sees
 * only a fixed-length digest, so there is nothing to extend.
 *
 * The hash itself is imported from the SHA-256 engine rather than duplicated.
 */

import { sha256Bytes, sha256Hex } from '@/algorithms/sha256/engine';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

/** SHA-256's block size, which is what the key is padded to, not its output size. */
const BLOCK = 64;
const IPAD = 0x36;
const OPAD = 0x5c;

export interface HmacStepState {
  kind: 'setup' | 'keyprep' | 'ipad' | 'inner' | 'opad' | 'outer' | 'tag';
  /** The key as supplied, then as normalised to one block. */
  rawKey: number[];
  blockKey: number[];
  keyWasHashed: boolean;
  keyWasPadded: boolean;
  messageBytes: number[];
  /** K ⊕ ipad and K ⊕ opad, once computed. */
  innerKey?: number[];
  outerKey?: number[];
  innerDigest?: string;
  tag?: string;
}

const hex = (b: number) => b.toString(16).padStart(2, '0');

function parseHex(raw: string): number[] | null {
  const clean = raw.replace(/\s+/g, '');
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) return null;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

const encode = (text: string): number[] => [...new TextEncoder().encode(text)];

export function run(
  input: string,
  params: Params,
  _direction: Direction,
): AlgorithmResult<HmacStepState> {
  const format = String(params.format ?? 'text');
  const keyRaw = String(params.key ?? '');

  let rawKey: number[];
  if (format === 'hex') {
    const parsed = parseHex(keyRaw);
    if (parsed === null) {
      return {
        output: '',
        steps: [],
        error: { paramKey: 'key', message: 'The key must be an even number of hexadecimal digits.' },
      };
    }
    rawKey = parsed;
  } else {
    rawKey = encode(keyRaw);
  }

  const messageBytes = format === 'hex' ? (parseHex(input) ?? encode(input)) : encode(input);

  if (messageBytes.length > 200) {
    return {
      output: '',
      steps: [],
      error: {
        message: `That is ${messageBytes.length} bytes. Keep it under 200 so the two inner hashes stay traceable; HMAC itself has no length limit.`,
      },
    };
  }

  /*
   * A key longer than one block is hashed down to 32 bytes first; a shorter one
   * is zero-padded up. Both end up exactly one block, which is what makes the
   * two XOR masks well defined.
   */
  const keyWasHashed = rawKey.length > BLOCK;
  const reduced = keyWasHashed ? sha256Bytes(rawKey) : rawKey;
  const keyWasPadded = reduced.length < BLOCK;
  const blockKey = [...reduced, ...new Array(BLOCK - reduced.length).fill(0)];

  const innerKey = blockKey.map((b) => b ^ IPAD);
  const outerKey = blockKey.map((b) => b ^ OPAD);

  const innerDigestBytes = sha256Bytes([...innerKey, ...messageBytes]);
  const innerDigest = innerDigestBytes.map(hex).join('');
  const tag = sha256Hex([...outerKey, ...innerDigestBytes]);

  const base = { rawKey, blockKey, keyWasHashed, keyWasPadded, messageBytes };
  const steps: Step<HmacStepState>[] = [];
  const push = (
    kind: HmacStepState['kind'],
    phase: string,
    title: string,
    description: string,
    extra: Partial<HmacStepState> = {},
  ) => steps.push({ id: kind, title, description, phase, state: { ...base, kind, ...extra } });

  push(
    'setup',
    'Setup',
    `Key of ${rawKey.length} byte${rawKey.length === 1 ? '' : 's'}, message of ${messageBytes.length}`,
    'HMAC turns a hash into a keyed authentication tag. Only someone holding the key can produce a tag that verifies, which is what a bare hash cannot offer, anyone can hash anything.',
  );

  push(
    'keyprep',
    'Key preparation',
    keyWasHashed
      ? `Key longer than 64 bytes, hashed down to 32`
      : keyWasPadded
        ? `Key padded with zeros to 64 bytes`
        : `Key is already exactly one block`,
    keyWasHashed
      ? 'A key longer than the hash block size is replaced by its own digest. Note the consequence: a 64-byte key and its 32-byte hash produce identical tags, so the two are interchangeable to an attacker.'
      : 'The key is zero-padded up to the 64-byte block size. Note that this is the hash’s block size, not its 32-byte output size: a common implementation mistake.',
  );

  push(
    'ipad',
    'Inner hash',
    'K ⊕ ipad',
    'The block-sized key is XORed with 0x36 repeated. The two pads differ in exactly half their bits, which is what stops the inner and outer keys being related in any usable way.',
    { innerKey },
  );

  push(
    'inner',
    'Inner hash',
    `SHA-256((K ⊕ ipad) ‖ message) = ${innerDigest.slice(0, 16)}…`,
    'The message is hashed with the inner key prepended. This digest is never published; it is only ever fed into the second hash.',
    { innerKey, innerDigest },
  );

  push(
    'opad',
    'Outer hash',
    'K ⊕ opad',
    'The same block-sized key, now XORed with 0x5c repeated.',
    { innerKey, outerKey, innerDigest },
  );

  push(
    'outer',
    'Outer hash',
    `SHA-256((K ⊕ opad) ‖ inner digest)`,
    'The outer hash consumes a fixed 32-byte input, so there is nothing an attacker can append to it. That, and not the XOR masks, is what defeats length extension.',
    { innerKey, outerKey, innerDigest },
  );

  push(
    'tag',
    'Tag',
    `HMAC = ${tag.slice(0, 16)}…`,
    'The result is the authentication tag. Verifying means recomputing it and comparing, and that comparison must be constant-time, or the timing of the mismatch leaks the correct tag one byte at a time.',
    { innerKey, outerKey, innerDigest, tag },
  );

  return { output: tag, steps };
}
