/**
 * SHA-256 visualizer.
 *
 * Eight registers and a schedule of 64 words is all the state there is, so both
 * are permanent context: the registers with the two that a round actually
 * rewrites picked out, and the schedule filling in as it is derived.
 *
 * The focus region takes apart the one round the step is on. T₁ and T₂ are
 * sums of five and two terms respectively, and seeing those terms: the round
 * constant, the schedule word, the choice and majority functions, is the
 * difference between "the registers changed" and understanding what mixed them.
 */

import { Cell } from '@/components/viz/Cell';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import { hex32, type Sha256StepState } from './engine';
import styles from './Visualizer.module.css';

const NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function Sha256Visualizer({
  step,
  prev,
}: AlgorithmVisualizerProps<Sha256StepState>) {
  const s = step.state;
  const before = prev?.state.registers;

  return (
    <VizStage>
      <VizStage.Context label="State">
        <div className={styles.registers}>
          {s.registers.map((v, i) => (
            <div className={styles.register} key={i}>
              <span className={styles.registerName}>{NAMES[i]}</span>
              <Cell
                state={
                  before && before[i] !== v ? 'changed' : s.kind === 'digest' ? 'output' : 'idle'
                }
              >
                {hex32(v)}
              </Cell>
            </div>
          ))}
        </div>

        <div className={styles.hashRow}>
          <span className={styles.rowLabel}>
            running hash{s.blockCount > 1 ? ` · block ${(s.block ?? 0) + 1}/${s.blockCount}` : ''}
          </span>
          <span className={styles.hashValue}>
            {s.hash.map(hex32).join(' ')}
          </span>
        </div>

        {s.digest && (
          <p className={styles.digest}>
            <span className={styles.rowLabel}>digest</span>
            <span className={styles.digestValue}>{s.digest}</span>
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label={s.round ? `Round ${s.round.t + 1}` : focusLabel(s)}>
        {s.round ? (
          <div className={styles.stack}>
            <Sum
              label="T₁"
              terms={[
                ['h', hex32(s.registers[7])],
                ['Σ₁(e)', hex32(s.round.sigma1)],
                ['Ch(e,f,g)', hex32(s.round.chosen)],
                [`K${s.round.t}`, hex32(s.round.k)],
                [`W${s.round.t}`, hex32(s.round.w)],
              ]}
              total={hex32(s.round.t1)}
            />
            <Sum
              label="T₂"
              terms={[
                ['Σ₀(a)', hex32(s.round.sigma0)],
                ['Maj(a,b,c)', hex32(s.round.majority)],
              ]}
              total={hex32(s.round.t2)}
            />
            <p className={styles.note}>
              Ch picks bits from f where e is 1 and from g where it is 0. Maj
              takes whichever bit two of a, b and c agree on. Neither is
              reversible, which is what keeps the round from running backwards.
            </p>
          </div>
        ) : s.schedule.length > 0 ? (
          <div className={styles.stack}>
            <div className={styles.schedule}>
              {s.schedule.map((w, i) => (
                <span
                  key={i}
                  className={`${styles.word} ${
                    s.scheduleRange && i >= s.scheduleRange[0] && i <= s.scheduleRange[1]
                      ? styles.wordOn
                      : ''
                  }`}
                >
                  <span className={styles.wordIndex}>W{i}</span>
                  {hex32(w)}
                </span>
              ))}
            </div>
            <p className={styles.note}>
              Sixty-four words: the first sixteen are the block itself, the rest
              derived from it. One round consumes one word.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            {s.kind === 'pad'
              ? `${s.messageBytes.length} bytes in, ${s.paddedLength} after padding. The length is encoded into the last eight bytes, so two messages that differ only in trailing zeros cannot collide through padding alone.`
: 'The eight initial constants are the fractional parts of the square roots of the first eight primes; chosen so that nobody could have selected them to hide a weakness.'}
          </p>
        )}
      </VizStage.Focus>
    </VizStage>
  );
}

function focusLabel(s: Sha256StepState): string {
  if (s.kind === 'pad') return 'Padding';
  if (s.kind === 'digest') return 'Result';
  if (s.kind === 'block') return 'Feed-forward';
  return 'Initial state';
}

function Sum({
  label,
  terms,
  total,
}: {
  label: string;
  terms: [string, string][];
  total: string;
}) {
  return (
    <div className={styles.sum}>
      <span className={styles.sumLabel}>{label}</span>
      <div className={styles.sumTerms}>
        {terms.map(([name, value], i) => (
          <span className={styles.term} key={name}>
            {i > 0 && <span className={styles.plus}>+</span>}
            <span className={styles.termName}>{name}</span>
            <span className={styles.termValue}>{value}</span>
          </span>
        ))}
      </div>
      <span className={styles.sumTotal}>= {total}</span>
    </div>
  );
}
