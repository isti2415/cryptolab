/**
 * DES visualizer.
 *
 * DES is a cipher made almost entirely of fixed wiring, so the wiring is what
 * gets drawn. Every permutation (PC-1, PC-2, IP, E, P, FP), is a
 * `PermutationWiring` diagram rather than a hex string that silently becomes a
 * different hex string, and the eight S-boxes are shown as the lookup tables
 * they are, with the row and column the round actually read.
 *
 * The context region carries what a learner keeps needing: the two halves, the
 * round counter, and the full sixteen-key schedule with the live key lit and
 * its real hex visible (it used to exist only in a `title` tooltip).
 */

import { BitField } from '@/components/viz/BitField';
import { Cell } from '@/components/viz/Cell';
import { LookupTable } from '@/components/viz/LookupTable';
import { PermutationWiring } from '@/components/viz/PermutationWiring';
import { VizStage } from '@/components/viz/VizStage';
import { XorLane } from '@/components/viz/XorLane';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { DesStepState } from './engine';
import { SBOX } from './tables';
import styles from './Visualizer.module.css';

const bit = (b: number) => (b ? '1' : '0');
const nibbles = (hex: string) => hex.split('');

/** Group 48 bits into the eight 6-bit chunks the S-boxes consume. */
function sixes(bits: number[]): string[] {
  return bits.map(bit);
}

export function DesVisualizer({ step }: AlgorithmVisualizerProps<DesStepState>) {
  const s = step.state;

  return (
    <VizStage>
      <VizStage.Context label="Block and key schedule">
        <div className={styles.halves}>
          <BitField
            label="L"
            cells={nibbles(s.L).map((t) => ({ text: t, state: 'idle' }))}
            size="1.9em"
          />
          <BitField
            label="R"
            cells={nibbles(s.R).map((t) => ({ text: t, state: 'idle' }))}
            size="1.9em"
          />
        </div>

        {/*
          Sixteen keys as a compact grid with the live one lit, and its real hex
          spelled out below. Listing all sixteen hex values at once built a
          16-row tower that crowded out the visualization beside it; hiding them
          all in tooltips (the previous behaviour) made the schedule sixteen
          indistinguishable chips.
        */}
        <div className={styles.schedule}>
          <span className={styles.scheduleLabel}>
            round keys{s.direction === 'decrypt' ? ' · applied in reverse' : ''}
          </span>
          <div className={styles.keys}>
            {s.allSubkeys.map((k, i) => {
              const live = s.round === i + 1;
              return (
                <span
                  key={i}
                  className={`${styles.key} ${live ? styles.keyOn : ''}`}
                  title={`K${i + 1} = ${k}`}
                >
                  K{i + 1}
                </span>
              );
            })}
          </div>
          <div className={styles.keyValue}>
            {s.round && s.subkeyHex ? (
              <>
                <span className={styles.keyValueLabel}>K{s.round}</span>
                <span className={styles.keyValueHex}>{s.subkeyHex}</span>
              </>
            ) : (
              <span className={styles.keyValueLabel}>
                no round key in play yet
              </span>
            )}
          </div>
        </div>

        {s.outputHex && (
          <p className={styles.output}>
            <span className={styles.outputLabel}>output block</span>
            <span className={styles.outputValue}>{s.outputHex}</span>
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label={focusLabel(s)}>
        <Focus state={s} />
      </VizStage.Focus>
    </VizStage>
  );
}

function focusLabel(s: DesStepState): string {
  switch (s.kind) {
    case 'pc1':
      return 'Permuted Choice 1';
    case 'subkey':
      return `Round key ${s.round}`;
    case 'ip':
      return 'Initial permutation';
    case 'expand':
      return 'E · expansion';
    case 'xor':
      return 'Key mixing';
    case 'sbox':
      return 'S-box substitution';
    case 'mix':
      return 'P · permutation and swap';
    case 'final':
      return 'Final permutation';
    default:
      return 'Input block';
  }
}

function Focus({ state: s }: { state: DesStepState }) {
  /* -------------------------------------------------------- key schedule */
  if (s.kind === 'subkey' && s.schedule?.c && s.schedule.cBefore) {
    const { cBefore, dBefore, c, d, shift } = s.schedule;
    return (
      <div className={styles.stack}>
        <div className={styles.rotate}>
          <BitField label="C before" cells={cBefore.map((b) => ({ text: bit(b), state: 'key' }))} size="1.15em" />
          <BitField label={`C ≪ ${shift}`} cells={c.map((b) => ({ text: bit(b), state: 'derived' }))} size="1.15em" />
          <BitField label="D before" cells={dBefore!.map((b) => ({ text: bit(b), state: 'key' }))} size="1.15em" />
          <BitField label={`D ≪ ${shift}`} cells={d!.map((b) => ({ text: bit(b), state: 'derived' }))} size="1.15em" />
        </div>
        {s.permutation && <Wiring perm={s.permutation} cellW={13} />}
      </div>
    );
  }

  /* ------------------------------------------------------- key mixing */
  if (s.kind === 'xor' && s.feistel) {
    const f = s.feistel;
    return (
      <XorLane
        a={sixes(f.expanded)}
        b={sixes(f.key)}
        result={sixes(f.xored)}
        labels={{ a: 'E(R)', b: `K${s.round}`, result: 'to S-boxes' }}
        size="1.15em"
        groupEvery={6}
      />
    );
  }

  /* ---------------------------------------------------------- S-boxes */
  if (s.kind === 'sbox' && s.feistel) {
    const f = s.feistel;
    const first = f.boxes[0];
    return (
      <div className={styles.stack}>
        <div className={styles.boxes}>
          {f.boxes.map((b) => (
            <div className={styles.box} key={b.box}>
              <span className={styles.boxName}>S{b.box + 1}</span>
              <span className={styles.boxBits}>{b.inBits.map(bit).join('')}</span>
              <span className={styles.boxCoord}>
                row {b.row} · col {b.col}
              </span>
              <Cell state="output">{b.value.toString(2).padStart(4, '0')}</Cell>
            </div>
          ))}
        </div>
        <p className={styles.note}>
          S1 shown in full below; the other seven work identically against their
          own tables.
        </p>
        <LookupTable
          rows={SBOX[0].map((row) => row.map((v) => String(v)))}
          rowHeaders={['0', '1', '2', '3']}
          colHeaders={Array.from({ length: 16 }, (_, i) => String(i))}
          corner="S1"
          active={{ row: first.row, col: first.col }}
        />
      </div>
    );
  }

  /* ------------------------------------------- P permutation + the swap */
  if (s.kind === 'mix' && s.feistel && s.prevL) {
    const f = s.feistel;
    return (
      <div className={styles.stack}>
        {s.permutation && <Wiring perm={s.permutation} cellW={15} />}
        <XorLane
          a={s.prevL.map(bit)}
          b={f.permuted.map(bit)}
          result={s.prevL.map((b, i) => bit(b ^ f.permuted[i]))}
          labels={{ a: 'L₍ₙ₋₁₎', b: 'f(R,K)', result: 'Rₙ' }}
          bState="derived"
          size="1.15em"
          groupEvery={8}
        />
      </div>
    );
  }

  /* ------------------------------------------------- plain permutations */
  if (s.permutation) return <Wiring perm={s.permutation} cellW={s.permutation.input.length > 56 ? 12 : 14} />;

  /* ------------------------------------------------------------- setup */
  return (
    <div className={styles.stack}>
      <BitField
        label="block"
        cells={nibbles(s.plaintextHex).map((t) => ({ text: t, state: 'idle' }))}
        size="1.9em"
      />
      <BitField
        label="key"
        cells={nibbles(s.keyHex).map((t) => ({ text: t, state: 'key' }))}
        size="1.9em"
      />
    </div>
  );
}

function Wiring({
  perm,
  cellW,
}: {
  perm: NonNullable<DesStepState['permutation']>;
  cellW: number;
}) {
  return (
    <PermutationWiring
      input={perm.input.map(bit)}
      output={perm.output.map(bit)}
      source={perm.source}
      dropped={perm.dropped}
      labels={{
        input: `in · ${perm.input.length} bits`,
        output: `${perm.label} · ${perm.output.length} bits`,
      }}
      cellW={cellW}
    />
  );
}
