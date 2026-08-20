/**
 * ML-DSA visualizer.
 *
 * The rejection loop is what distinguishes this scheme, and it is invisible in
 * the output; a signature does not record how many candidates were thrown
 * away. So the attempts are listed explicitly, with the norm that failed and
 * the bound it had to clear.
 *
 * That list is the teaching point: rejection is not an error path, it is the
 * mechanism. Publishing every candidate would leak the secret key.
 */

import { PolyVecGrid } from '@/components/viz/PolyVecGrid';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { MldsaStepState } from './engine';
import styles from './Visualizer.module.css';

export function MldsaVisualizer({ step }: AlgorithmVisualizerProps<MldsaStepState>) {
  const s = step.state;

  return (
    <VizStage layout="stack">
      <VizStage.Context label={`Keys · Z_${s.q}[X]/(X^${s.n}+1)`}>
        <div className={styles.grids}>
          <PolyVecGrid label="s₁ · secret (small)" rows={s.s1} state="key" centered modulus={s.q} />
          <PolyVecGrid label="s₂ · secret (small)" rows={s.s2} state="key" centered modulus={s.q} />
          <PolyVecGrid label="t = A·s₁ + s₂ · public" rows={s.t} state="output" />
          {s.z && <PolyVecGrid label="z = y + c·s₁ · published" rows={s.z} state="changed" centered modulus={s.q} />}
        </div>

        {s.valid !== undefined && (
          <p className={s.valid ? styles.valid : styles.invalid}>
            {s.valid
              ? 'Recomputed high bits and challenge match, signature valid.'
: 'Challenge does not match, signature rejected.'}
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label="Rejection sampling">
        <div className={styles.stack}>
          {s.attempts.length === 0 ? (
            <p className={styles.note}>
              Signing draws a fresh masking vector, forms a candidate signature,
              and discards it unless it clears two bounds. Rejecting is the
              mechanism, not a failure; publishing every candidate would let an
              attacker average many signatures and recover s₁, which is how
              earlier lattice signature schemes were broken.
            </p>
          ) : (
            <>
              <table className={styles.attempts}>
                <thead>
                  <tr>
                    <th scope="col">try</th>
                    <th scope="col">‖z‖∞</th>
                    <th scope="col">low bits</th>
                    <th scope="col">outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {s.attempts.map((a) => (
                    <tr key={a.index} className={a.accepted ? styles.rowOk : styles.rowBad}>
                      <td>{a.index}</td>
                      <td>{a.zNorm}</td>
                      <td>{a.lowNorm}</td>
                      <td>{a.accepted ? 'accepted' : a.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.note}>
                Bounds: ‖z‖∞ must stay under γ₁ − β = {s.gamma1 - s.beta}, and the
                low bits under γ₂ − β = {s.gamma2 - s.beta}. The number of
                attempts varies with the key and the message, which is why ML-DSA
                signing has no fixed running time.
              </p>
            </>
          )}

          {s.c && (
            <PolyVecGrid
              label={`challenge c · ${s.tau} non-zero coefficients`}
              rows={[s.c]}
              state="derived"
              centered
              modulus={s.q}
            />
          )}
        </div>
      </VizStage.Focus>
    </VizStage>
  );
}
