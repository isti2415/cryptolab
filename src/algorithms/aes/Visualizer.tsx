/**
 * AES visualizer.
 *
 * The old version rendered the 4×4 state with every cell styled identically, so
 * SubBytes, ShiftRows, MixColumns and AddRoundKey were visually
 * indistinguishable: the hex changed and nothing said why. Here the state is
 * permanent context (with the bytes that changed this step marked), and the
 * focus region shows the actual mechanism of whichever operation is running:
 * the S-box being indexed, the rows rotating, the GF(2⁸) matrix multiply, or
 * the round key being XORed in.
 */

import { Cell } from '@/components/viz/Cell';
import { BitField } from '@/components/viz/BitField';
import { LookupTable } from '@/components/viz/LookupTable';
import { MatrixOp } from '@/components/viz/MatrixOp';
import { VizStage } from '@/components/viz/VizStage';
import { XorLane } from '@/components/viz/XorLane';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { AesStepState } from './engine';
import { INV_SBOX, SBOX } from './gf';
import styles from './Visualizer.module.css';

const HEX = '0123456789ABCDEF'.split('');
const hex2 = (b: number) => b.toString(16).padStart(2, '0').toUpperCase();

/** 32 hex chars, column-major, back into [row][col]. */
function toMatrix(hex: string): string[][] {
  const m: string[][] = [[], [], [], []];
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      const i = (c * 4 + r) * 2;
      m[r][c] = hex.slice(i, i + 2);
    }
  return m;
}

/** Column-major byte order: the order AES itself reads the block in. */
function toBytes(hex: string): string[] {
  return Array.from({ length: 16 }, (_, i) => hex.slice(i * 2, i * 2 + 2));
}

const sboxRows = (inverse: boolean) =>
  Array.from({ length: 16 }, (_, r) =>
    Array.from({ length: 16 }, (_, c) => hex2((inverse ? INV_SBOX : SBOX)[r * 16 + c])),
  );

/** The fixed MixColumns matrices, shown as the hex constants AES specifies. */
const MIX = [
  ['02', '03', '01', '01'],
  ['01', '02', '03', '01'],
  ['01', '01', '02', '03'],
  ['03', '01', '01', '02'],
];
const INV_MIX = [
  ['0E', '0B', '0D', '09'],
  ['09', '0E', '0B', '0D'],
  ['0D', '09', '0E', '0B'],
  ['0B', '0D', '09', '0E'],
];

function StateGrid({
  hex,
  prevHex,
  label,
  role = 'state',
}: {
  hex: string;
  prevHex?: string;
  label: string;
  role?: 'state' | 'key';
}) {
  const m = toMatrix(hex);
  const p = prevHex ? toMatrix(prevHex) : undefined;
  return (
    <div className={styles.gridWrap}>
      <span className={styles.gridLabel}>{label}</span>
      <div className={styles.grid}>
        {m.map((row, r) =>
          row.map((v, c) => (
            <Cell
              key={`${r}-${c}`}
              state={
                role === 'key'
                  ? 'key'
                  : p && p[r][c] !== v
                    ? 'changed'
                    : 'idle'
              }
            >
              {v}
            </Cell>
          )),
        )}
      </div>
    </div>
  );
}

export function AesVisualizer({
  step,
  prev,
}: AlgorithmVisualizerProps<AesStepState>) {
  const s = step.state;
  const prevHex = prev?.state.state;

  return (
    <VizStage>
      <VizStage.Context label={`State${s.roundKey ? ' and round key' : ''}`}>
        <div className={styles.matrices}>
          <StateGrid hex={s.state} prevHex={prevHex} label="state" />
          {s.roundKey && (
            <StateGrid hex={s.roundKey} label={`round key ${s.round}`} role="key" />
          )}
        </div>
        {s.outputHex && (
          <p className={styles.output}>
            <span className={styles.outputLabel}>output block</span>
            <span className={styles.outputValue}>{s.outputHex}</span>
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label={focusLabel(s)}>
        <Focus state={s} prevHex={prevHex} />
      </VizStage.Focus>
    </VizStage>
  );
}

function focusLabel(s: AesStepState): string {
  if (s.kind === 'schedule') return 'Key expansion';
  if (s.kind === 'setup') return 'Block layout';
  if (s.kind === 'final') return 'Result';
  return s.op;
}

function Focus({ state: s, prevHex }: { state: AesStepState; prevHex?: string }) {
  /* --------------------------------------------------------- key schedule */
  if (s.kind === 'schedule') {
    const d = s.schedule;
    if (!d) {
      return (
        <p className={styles.note}>
          The four words of the key become round key 0 unchanged, no transform
          is applied until the next one.
        </p>
      );
    }
    const chain: [string, string][] = [
      ['w' + (d.round * 4 - 1), d.prevWord],
      ['RotWord', d.rotated],
      ['SubWord', d.subbed],
      [`⊕ Rcon ${d.rcon}`, d.afterRcon],
    ];
    return (
      <div className={styles.chain}>
        {chain.map(([label, value]) => (
          <div className={styles.chainRow} key={label}>
            <span className={styles.chainLabel}>{label}</span>
            <BitField
              cells={splitWord(value).map((t) => ({ text: t, state: 'derived' }))}
              size="2em"
            />
          </div>
        ))}
        <div className={styles.chainRow}>
          <span className={styles.chainLabel}>⊕ w{(d.round - 1) * 4}</span>
          <BitField
            cells={splitWord(d.fromWord).map((t) => ({ text: t, state: 'key' }))}
            size="2em"
          />
        </div>
        <div className={styles.chainResult}>
          <span className={styles.chainLabel}>round key {d.round}</span>
          <div className={styles.words}>
            {d.words.map((word, i) => (
              <span className={styles.word} key={i}>
                <span className={styles.wordIndex}>w{d.round * 4 + i}</span>
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- SubBytes */
  if (s.sboxLookup) {
    const l = s.sboxLookup;
    return (
      <div className={styles.focusStack}>
        <p className={styles.lookupLine}>
          <Cell state="idle">{l.from}</Cell>
          <span className={styles.arrow}>→</span>
          <Cell state="output">{l.to}</Cell>
          <span className={styles.note}>
            row {HEX[l.row]}, column {HEX[l.col]}, shown for the byte at
            row&nbsp;{l.cell[0]}, column&nbsp;{l.cell[1]}; all sixteen bytes are
            substituted the same way.
          </span>
        </p>
        <LookupTable
          rows={sboxRows(l.inverse)}
          rowHeaders={HEX}
          colHeaders={HEX}
          corner={l.inverse ? 'S⁻¹' : 'S'}
          active={{ row: l.row, col: l.col }}
          dense
        />
      </div>
    );
  }

  /* ------------------------------------------------------------ ShiftRows */
  if (s.shifts && prevHex) {
    const before = toMatrix(prevHex);
    const after = toMatrix(s.state);
    return (
      <div className={styles.rows}>
        {before.map((row, r) => (
          <div className={styles.shiftRow} key={r}>
            <span className={styles.chainLabel}>
              row {r} {r === 0 ? '· fixed' : `· ${s.shifts![r] < 0 ? '→' : '←'} ${Math.abs(s.shifts![r])}`}
            </span>
            <BitField cells={row.map((t) => ({ text: t, state: 'done' }))} size="2em" />
            <span className={styles.arrow}>→</span>
            <BitField
              cells={after[r].map((t, c) => ({
                text: t,
                state: r === 0 || t === row[c] ? 'idle' : 'changed',
              }))}
              size="2em"
            />
          </div>
        ))}
      </div>
    );
  }

  /* ----------------------------------------------------------- MixColumns */
  if (s.column != null && prevHex) {
    const before = toMatrix(prevHex);
    const after = toMatrix(s.state);
    const c = s.column;
    const inverse = s.op.startsWith('Inv');
    return (
      <div className={styles.focusStack}>
        <MatrixOp
          terms={[
            { rows: inverse ? INV_MIX : MIX, label: inverse ? 'inverse matrix' : 'fixed matrix' },
            { rows: [0, 1, 2, 3].map((r) => [before[r][c]]), label: `column ${c}`, state: 'idle' },
            { rows: [0, 1, 2, 3].map((r) => [after[r][c]]), label: 'mixed', state: 'output' },
          ]}
          operators={['×', '=']}
          workings={[
            'Every product is a GF(2⁸) multiplication and every sum is an XOR, not ordinary arithmetic.',
            `Each of the four output bytes depends on all four input bytes of the column. All four columns are mixed this way; column ${c} is shown.`,
          ]}
        />
      </div>
    );
  }

  /* ---------------------------------------------------------- AddRoundKey */
  if (s.roundKey && prevHex && s.kind === 'op') {
    return (
      <XorLane
        a={toBytes(prevHex)}
        b={toBytes(s.roundKey)}
        result={toBytes(s.state)}
        labels={{ a: 'state', b: `key ${s.round}`, result: 'new state' }}
        size="1.9em"
        groupEvery={4}
      />
    );
  }

  /* ------------------------------------------------------- setup / output */
  return (
    <BitField
      cells={toBytes(s.state).map((t) => ({ text: t, state: s.outputHex ? 'output' : 'idle' }))}
      label={s.outputHex ? 'out' : 'in'}
      size="2em"
      groupEvery={4}
    />
  );
}

function splitWord(word: string): string[] {
  return [0, 1, 2, 3].map((i) => word.slice(i * 2, i * 2 + 2));
}
