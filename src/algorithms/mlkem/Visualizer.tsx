/**
 * ML-KEM visualizer.
 *
 * The thing that trips people up about module lattices is the shape of the
 * data, so the shape is what gets drawn: a rank-2 module over a degree-8 ring
 * is two rows of eight numbers, and the public matrix is four such rows. Once
 * that is visible the arithmetic is just LWE again.
 *
 * The focus panel carries the noise budget, because correctness here is not
 * exact; it is "the error stayed under q/4", and that margin is worth seeing
 * as a number.
 */

import { PolyVecGrid } from '@/components/viz/PolyVecGrid';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { MlkemStepState } from './engine';
import styles from './Visualizer.module.css';

export function MlkemVisualizer({ step }: AlgorithmVisualizerProps<MlkemStepState>) {
  const s = step.state;
  const budget = Math.round(s.q / 4);

  return (
    <VizStage layout="stack">
      <VizStage.Context label={`Public key · Z_${s.q}[X]/(X^${s.n}+1)`}>
        <div className={styles.grids}>
          <PolyVecGrid
            label="A · public matrix"
            rows={s.a.flat()}
            state={s.kind === 'matrix' ? 'active' : 'idle'}
          />
          <PolyVecGrid
            label="s · secret (small)"
            rows={s.s}
            rowLabels={['s₀', 's₁']}
            state={s.kind === 'secret' ? 'active' : 'key'}
            centered
            modulus={s.q}
          />
          <PolyVecGrid
            label="e · error (small)"
            rows={s.e}
            rowLabels={['e₀', 'e₁']}
            state={s.kind === 'secret' ? 'active' : 'derived'}
            centered
            modulus={s.q}
          />
          <PolyVecGrid
            label="t = A·s + e · published"
            rows={s.t}
            rowLabels={['t₀', 't₁']}
            state={s.kind === 'public' ? 'active' : 'output'}
          />
        </div>
      </VizStage.Context>

      <VizStage.Focus label={focusLabel(s)}>
        {s.u && s.v ? (
          <div className={styles.stack}>
            <PolyVecGrid label="u = Aᵀ·r + e₁" rows={s.u} rowLabels={['u₀', 'u₁']} state="output" />
            <PolyVecGrid label="v = tᵀ·r + e₂ + ⌈q/2⌋·m" rows={[s.v]} state="output" />
            {s.raw && s.margins && (
              <>
                <PolyVecGrid
                  label="v − sᵀ·u"
                  rows={[s.raw]}
                  state="changed"
                  centered
                  modulus={s.q}
                />
                <div className={styles.budget}>
                  <span className={styles.budgetLabel}>
                    worst coefficient sat {Math.max(...s.margins)} from its target
                  </span>
                  <div className={styles.bar}>
                    <span
                      className={styles.fill}
                      style={{ width: `${(Math.max(...s.margins) / budget) * 100}%` }}
                    />
                  </div>
                  <span className={styles.budgetLabel}>
                    budget is q/4 = {budget}; beyond it, rounding starts giving wrong bits
                  </span>
                </div>
                <p className={styles.result}>
                  recovered {s.recovered!.join('')} · sent {s.bits.join('')}
                </p>
              </>
            )}
          </div>
        ) : (
          <p className={styles.note}>
            Kyber is LWE with the flat matrix of numbers replaced by a small
            matrix of polynomials. A plain LWE public key grows with the square
            of the dimension; a rank-{s.k} module over a degree-{s.n} ring carries
            the same weight in {s.k * s.k} polynomials. That is the entire reason
            these schemes are usable.
          </p>
        )}
      </VizStage.Focus>
    </VizStage>
  );
}

function focusLabel(s: MlkemStepState): string {
  if (s.kind === 'decaps' || s.kind === 'done') return 'Decapsulation';
  if (s.kind === 'encaps' || s.kind === 'encaps-noise') return 'Ciphertext';
  return 'Why polynomials';
}
