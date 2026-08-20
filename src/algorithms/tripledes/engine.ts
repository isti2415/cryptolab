/**
 * Triple DES (3DES / TDEA), DES applied three times.
 *
 * When DES's 56-bit key became too short, the industry needed something that
 * ran on the DES hardware already deployed everywhere. Triple DES is that
 * compromise: encrypt, decrypt, encrypt, with two or three keys.
 *
 * The middle step is a *decryption* purely for backwards compatibility. Setting
 * all three keys equal makes the D undo the first E, so the whole thing
 * collapses to plain single DES and a 3DES device can still talk to a DES one.
 * It buys nothing cryptographically.
 *
 * The block operation itself is imported from the DES engine rather than
 * reimplemented, so there is exactly one DES on this site.
 */

import { desBlockHex, type DesRound } from '@/algorithms/des/engine';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

const HEX16 = /^[0-9a-fA-F]{16}$/;
const clean = (raw: unknown) => String(raw ?? '').replace(/\s+/g, '').toUpperCase();

export interface TripleDesPass {
  /** 1, 2 or 3, position in the EDE chain. */
  index: number;
  /** 'E' or 'D'. */
  op: 'E' | 'D';
  keyName: string;
  keyHex: string;
  inputHex: string;
  outputHex: string;
}

export interface TripleDesStepState {
  kind: 'setup' | 'pass' | 'round' | 'final';
  direction: Direction;
  keys: { name: string; hex: string }[];
  /** The three passes, filled in as they complete. */
  passes: TripleDesPass[];
  /** Which pass this step belongs to (1-based), if any. */
  activePass?: number;
  /** Round detail inside the active pass. */
  round?: DesRound;
  blockHex: string;
  outputHex?: string;
  /** True when K1 = K2 = K3, i.e. the whole thing degenerates to single DES. */
  degenerate: boolean;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<TripleDesStepState> {
  const dataHex = clean(input);
  const keyHex = clean(params.key);

  if (!HEX16.test(dataHex)) {
    return {
      output: '',
      steps: [],
      error: {
        message: `The ${direction === 'encrypt' ? 'plaintext' : 'ciphertext'} must be exactly 16 hexadecimal digits (one 64-bit block). Got ${dataHex.length}.`,
      },
    };
  }

  // Keying option 1 is three independent keys; option 2 sets K3 = K1.
  if (keyHex.length !== 32 && keyHex.length !== 48) {
    return {
      output: '',
      steps: [],
      error: {
        paramKey: 'key',
        message: `The key must be 32 hexadecimal digits (two-key 3DES, where K3 = K1) or 48 (three-key). Got ${keyHex.length}.`,
      },
    };
  }
  if (!/^[0-9A-F]+$/.test(keyHex)) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'key', message: 'The key must be hexadecimal.' },
    };
  }

  const k1 = keyHex.slice(0, 16);
  const k2 = keyHex.slice(16, 32);
  const k3 = keyHex.length === 48 ? keyHex.slice(32, 48) : k1;
  const twoKey = keyHex.length === 32;
  const degenerate = k1 === k2 && k2 === k3;

  const keys = [
    { name: 'K1', hex: k1 },
    { name: 'K2', hex: k2 },
    { name: twoKey ? 'K3 = K1' : 'K3', hex: k3 },
  ];

  /*
   * Encryption is E(K3, D(K2, E(K1, P))); decryption reverses both the order of
   * the keys and each operation, giving D(K1, E(K2, D(K3, C))).
   */
  const plan: { key: { name: string; hex: string }; decrypt: boolean }[] =
    direction === 'encrypt'
      ? [
          { key: keys[0], decrypt: false },
          { key: keys[1], decrypt: true },
          { key: keys[2], decrypt: false },
        ]
      : [
          { key: keys[2], decrypt: true },
          { key: keys[1], decrypt: false },
          { key: keys[0], decrypt: true },
        ];

  const steps: Step<TripleDesStepState>[] = [];
  const passes: TripleDesPass[] = [];
  const base = { direction, keys, degenerate };

  steps.push({
    id: 'setup',
    title: `${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'} block ${dataHex}`,
    description: degenerate
      ? 'All three keys are identical, so the middle decryption undoes the first encryption exactly and this reduces to plain single DES: the backwards-compatibility mode, and not a secure configuration.'
      : `${twoKey ? 'Two-key' : 'Three-key'} Triple DES runs the block through DES three times: encrypt with K1, decrypt with K2, encrypt with K3. The middle step is a decryption only so that setting every key equal collapses to single DES.`,
    phase: 'Setup',
    state: { ...base, kind: 'setup', passes: [], blockHex: dataHex },
  });

  let block = dataHex;

  plan.forEach((pass, i) => {
    const rounds: DesRound[] = [];
    const inputHex = block;
    block = desBlockHex(inputHex, pass.key.hex, pass.decrypt, rounds);

    const record: TripleDesPass = {
      index: i + 1,
      op: pass.decrypt ? 'D' : 'E',
      keyName: pass.key.name,
      keyHex: pass.key.hex,
      inputHex,
      outputHex: block,
    };
    passes.push(record);

    const phase = `Pass ${i + 1} · ${record.op}(${record.keyName})`;

    steps.push({
      id: `p${i}-start`,
      title: `${record.op === 'E' ? 'Encrypt' : 'Decrypt'} ${inputHex} with ${record.keyName}`,
      description: `A full sixteen-round DES ${record.op === 'E' ? 'encryption' : 'decryption'} under ${record.keyName} = ${pass.key.hex}. Its output becomes the input to the next pass.`,
      phase,
      state: {
        ...base,
        kind: 'pass',
        passes: passes.map((p) => ({ ...p })),
        activePass: i + 1,
        blockHex: inputHex,
      },
    });

    for (const round of rounds) {
      steps.push({
        id: `p${i}-r${round.round}`,
        title: `Pass ${i + 1} · round ${round.round}`,
        description: `Lₙ = Rₙ₋₁ and Rₙ = Lₙ₋₁ ⊕ f(Rₙ₋₁, K${round.round}): the same Feistel round the DES page walks through in full detail.`,
        phase,
        state: {
          ...base,
          kind: 'round',
          passes: passes.map((p) => ({ ...p })),
          activePass: i + 1,
          round,
          blockHex: round.L + round.R,
        },
      });
    }
  });

  steps.push({
    id: 'final',
    title: `Output block ${block}`,
    description: degenerate
      ? 'The result is identical to what single DES would have produced, which is the whole point of the EDE ordering, and the reason this configuration provides 56 bits of security, not 168.'
      : `Three DES operations, ${twoKey ? 'two' : 'three'} independent keys, one 64-bit block out. Note that the block size never changed: that is the weakness Triple DES could not fix.`,
    phase: 'Output',
    state: {
      ...base,
      kind: 'final',
      passes: passes.map((p) => ({ ...p })),
      blockHex: block,
      outputHex: block,
    },
  });

  return { output: block, steps };
}
