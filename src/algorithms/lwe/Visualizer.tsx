/**
 * LWE visualizer.
 *
 * The whole scheme turns on one comparison: A·s is easy to invert, A·s + e is
 * not. So the context panel shows that equation being built: the matrix, the
 * secret, the tiny error vector, and the published result, with the error
 * column marked, because it is the only thing standing between the reader and
 * Gaussian elimination.
 *
 * The focus panel shows the decision the receiver makes: how far the decrypted
 * value sits from 0 and from q/2, drawn on the ring it actually lives on.
 */

import { Cell } from '@/components/viz/Cell';
import { MatrixOp } from '@/components/viz/MatrixOp';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { LweStepState } from './engine';
import styles from './Visualizer.module.css';

export function LweVisualizer({ step }: AlgorithmVisualizerProps<LweStepState>) {
  const s = step.state;
  const showKey = s.kind === 'secret' || s.kind === 'samples' || s.kind === 'public';

  return (
    <VizStage>
      <VizStage.Context label={`Public key · mod ${s.q}`}>
        <MatrixOp
          terms={[
            { rows: s.a.map((row) => row.map(String)), label: 'A', state: s.kind === 'samples' ? 'active' : 'idle' },
            { rows: s.s.map((v) => [String(v)]), label: 's (secret)', state: 'key' },
            { rows: s.e.map((v) => [String(v)]), label: 'e (error)', state: s.kind === 'public' ? 'active' : 'derived' },
            { rows: s.b.map((v) => [String(v)]), label: 'b (public)', state: 'output' },
          ]}
          operators={['×', '+', '=']}
          workings={
            showKey
              ? [
                  'Without e, this is eight equations in four unknowns, solvable in a moment.',
                  'With e off by at most two per row, the best known attacks are exponential in the dimension.',
                ]
              : undefined
          }
        />
      </VizStage.Context>

      <VizStage.Focus label={focusLabel(s)}>
        {s.kind === 'decrypt' && s.raw != null ? (
          <div className={styles.stack}>
            <Ring q={s.q} value={s.raw} recovered={s.recovered ?? 0} />
            <p className={styles.note}>
              v − u·s = {s.raw}. The two legal answers are 0 and ⌊q/2⌋ ={' '}
              {Math.floor(s.q / 2)}; this landed {s.margin} away from the nearer
              one, so the bit is {s.recovered}. Only the holder of s can compute
              u·s, and without it the value is indistinguishable from noise.
            </p>
          </div>
        ) : s.kind === 'encrypt' && s.u ? (
          <div className={styles.stack}>
            <div className={styles.row}>
              <span className={styles.label}>subset r</span>
              <div className={styles.cells}>
                {s.r!.map((bit, i) => (
                  <Cell key={i} fluid state={bit ? 'active' : 'muted'}>
                    {bit}
                  </Cell>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>u = Aᵀ·r</span>
              <div className={styles.cells}>
                {s.u.map((v, i) => (
                  <Cell key={i} fluid state="output">
                    {v}
                  </Cell>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>v</span>
              <Cell state="output">{s.v}</Cell>
            </div>
            <p className={styles.note}>
              Adding up a random subset of the published equations gives another
              valid noisy equation, so the ciphertext leaks no more than the
              public key already did. The bit is hidden by adding ⌊q/2⌋ or not.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            The message lives in the gap between 0 and q/2. Encryption adds noise
            far smaller than that gap, so rounding recovers it exactly, but if
            the noise ever grew past q/4 the rounding would start giving wrong
            answers. Real lattice schemes spend most of their parameter budget
            keeping that from happening.
          </p>
        )}
      </VizStage.Focus>
    </VizStage>
  );
}

/**
 * Values live on a circle mod q, so the "is it nearer 0 or q/2" decision is
 * genuinely a question about arcs; drawing it as a line would misrepresent
 * the wraparound that makes 96 close to 0.
 */
function Ring({ q, value, recovered }: { q: number; value: number; recovered: number }) {
  const angle = (v: number) => (v / q) * 2 * Math.PI - Math.PI / 2;
  const R = 52;
  const cx = 66;
  const cy = 66;
  const at = (v: number, r = R) => [cx + r * Math.cos(angle(v)), cy + r * Math.sin(angle(v))];
  const [vx, vy] = at(value);
  const [zx, zy] = at(0);
  const [hx, hy] = at(Math.floor(q / 2));

  return (
    <svg viewBox="0 0 132 132" className={styles.ring} role="img" aria-label={`Value ${value} on the ring modulo ${q}`}>
      <circle cx={cx} cy={cy} r={R} className={styles.ringLine} />
      <circle cx={zx} cy={zy} r="4" className={styles.anchor} />
      <circle cx={hx} cy={hy} r="4" className={styles.anchor} />
      <text x={zx} y={zy - 9} className={styles.ringLabel} textAnchor="middle">0</text>
      <text x={hx} y={hy + 15} className={styles.ringLabel} textAnchor="middle">q/2</text>
      <line x1={cx} y1={cy} x2={vx} y2={vy} className={styles.needle} />
      <circle cx={vx} cy={vy} r="5" className={recovered ? styles.markOne : styles.markZero} />
    </svg>
  );
}

function focusLabel(s: LweStepState): string {
  if (s.kind === 'encrypt') return `Bit ${(s.bitIndex ?? 0) + 1}`;
  if (s.kind === 'decrypt') return 'Rounding';
  return 'Why the noise matters';
}
