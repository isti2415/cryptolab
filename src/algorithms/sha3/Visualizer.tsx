/**
 * SHA-3 visualizer.
 *
 * The sponge is the idea worth showing, so the state is drawn as the 5×5 grid
 * of lanes it actually is, split visibly into the rate: the part the message
 * is XORed into, and the capacity, which the message never touches and the
 * output never reveals. That split is the whole security argument, and it is
 * also why SHA-3 needs no HMAC wrapper.
 */

import { Cell } from '@/components/viz/Cell';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { Sha3StepState } from './engine';
import styles from './Visualizer.module.css';

const PHASE_NOTE: Record<string, string> = {
  theta: 'Mixes across the whole state; the only step that does.',
  'rho-pi': 'Moves bits without changing them: rotate, then relocate.',
  chi: 'The one non-linear step. Everything else is XOR and movement.',
  iota: 'Breaks the symmetry the other four steps preserve.',
};

export function Sha3Visualizer({ step }: AlgorithmVisualizerProps<Sha3StepState>) {
  const s = step.state;
  /* Lanes are 8 bytes each, so this many of the 25 hold message data. */
  const rateLanes = s.rate / 8;

  return (
    <VizStage>
      <VizStage.Context label="State · 5 × 5 lanes of 64 bits">
        <div className={styles.grid}>
          {s.lanes.map((lane, i) => (
            <Cell
              key={i}
              fluid
              state={i < rateLanes ? (s.kind === 'absorb' ? 'active' : 'idle') : 'muted'}
              title={i < rateLanes ? `lane ${i}, rate`: `lane ${i}, capacity`}
            >
              {lane.slice(0, 4)}
            </Cell>
          ))}
        </div>
        <p className={styles.legend}>
          <span className={styles.swatchRate} /> rate · {s.rate} bytes, where the
          message goes
          <span className={styles.swatchCap} /> capacity · {s.capacity} bytes,
          never touched directly
        </p>
        {s.digest && (
          <p className={styles.digest}>
            <span className={styles.label}>digest</span>
            <span className={styles.digestValue}>{s.digest}</span>
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label={s.phase ? `${s.phase}` : focusLabel(s)}>
        {s.phase ? (
          <div className={styles.stack}>
            <p className={styles.phaseNote}>{PHASE_NOTE[s.phase]}</p>
            <p className={styles.note}>
              Round {(s.round ?? 0) + 1} of 24. Each round applies θ, then ρ and
              π together, then χ, then ι, and the permutation runs in full after
              every absorbed block.
            </p>
          </div>
        ) : s.blockBytes ? (
          <div className={styles.stack}>
            <div className={styles.bytes}>
              {s.blockBytes.slice(0, 32).map((b, i) => (
                <Cell key={i} fluid state="key">
                  {b.toString(16).padStart(2, '0').toUpperCase()}
                </Cell>
              ))}
            </div>
            <p className={styles.note}>
              First 32 of {s.rate} bytes XORed into the rate. {s.messageLength}{' '}
              message byte{s.messageLength === 1 ? '' : 's'} padded to{' '}
              {s.paddedLength}.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            {s.kind === 'squeeze'
              ? 'The digest is a slice of the state, not the whole of it. An attacker holding it cannot reconstruct the capacity, so cannot resume the permutation, which is exactly the length-extension attack that SHA-2 is vulnerable to and this construction is not.'
              : `${s.variant} keeps a fixed 1600-bit state and absorbs the message into part of it, rather than compressing block by block into a chaining value the way SHA-2 does.`}
          </p>
        )}
      </VizStage.Focus>
    </VizStage>
  );
}

function focusLabel(s: Sha3StepState): string {
  if (s.kind === 'squeeze') return 'Squeezing';
  if (s.blockBytes) return 'Absorbing';
  return 'The sponge';
}
