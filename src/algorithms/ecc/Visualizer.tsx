/**
 * ECDH visualizer.
 *
 * The plot is the point of the page: over F_p an elliptic curve is a scatter of
 * dots rather than the smooth arc every textbook draws, and showing the real
 * thing avoids teaching a picture that stops being true the moment the field is
 * finite. The generator, the public points and the shared point are marked as
 * the exchange proceeds.
 *
 * The focus region carries the double-and-add ladder, which is the elliptic
 * counterpart of RSA's square-and-multiply, and the place a naive
 * implementation leaks the private scalar through timing.
 */

import { CurvePlot } from '@/components/viz/CurvePlot';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { EccStepState, Point } from './engine';
import styles from './Visualizer.module.css';

const fmt = (pt: Point) => (pt === null ? '∞' : `(${pt.x}, ${pt.y})`);

export function EccVisualizer({ step }: AlgorithmVisualizerProps<EccStepState>) {
  const s = step.state;

  return (
    <VizStage>
      <VizStage.Context label={`${s.curve.label}`}>
        <CurvePlot
          points={s.points}
          modulus={s.curve.p}
          marks={s.highlight.map((h) => ({ point: h.point, role: h.role }))}
        />
        <dl className={styles.legend}>
          <Row label="G" value={fmt(s.curve.g)} tone="generator" />
          <Row label="order" value={String(s.order ?? '?')} />
          <Row label="A = a·G" value={s.kind === 'curve' || s.kind === 'secrets' ? '—': fmt(s.publicA)} tone="public" />
          <Row label="B = b·G" value={s.kind === 'curve' || s.kind === 'secrets' || s.kind === 'publicA' ? '—': fmt(s.publicB)} tone="public" />
          <Row
            label="shared"
            value={s.kind === 'sharedA' || s.kind === 'sharedB' || s.kind === 'agree' ? fmt(s.shared): '—'}
            tone="shared"
          />
        </dl>
      </VizStage.Context>

      <VizStage.Focus label={s.rungs ? 'Double and add' : 'The group'}>
        {s.rungs && s.scalar != null ? (
          <div className={styles.stack}>
            <p className={styles.formula}>
              {s.scalar} · {fmt(s.basePoint ?? null)}, scalar in binary{' '}
              {s.scalar.toString(2)}
            </p>
            <table className={styles.ladder}>
              <thead>
                <tr>
                  <th scope="col">bit</th>
                  <th scope="col">after doubling</th>
                  <th scope="col">after add</th>
                </tr>
              </thead>
              <tbody>
                {s.rungs.map((rung) => (
                  <tr key={rung.bitIndex}>
                    <td className={rung.bit ? styles.bitOn : styles.bitOff}>{rung.bit}</td>
                    <td>{fmt(rung.afterDouble)}</td>
                    <td className={rung.added ? styles.hot : ''}>{fmt(rung.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.note}>
              High bit first: double every rung, add the base point only where
              the bit is set. Because the add is conditional, a naive
              implementation takes a different amount of time depending on the
              secret scalar, which is exactly how real private keys have been
              recovered by timing.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            Over the real numbers the group law is geometric: draw a line through
            two points, take the third place it meets the curve, and reflect it
            across the horizontal axis. Over a finite field the dots scatter and
            the picture stops helping, but the algebra is unchanged, and the
            symmetry about the dashed line is still visible, because that
            reflection is what gives every point an inverse.
          </p>
        )}
      </VizStage.Focus>
    </VizStage>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'generator' | 'public' | 'shared';
}) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>
        {tone && <span className={`${styles.swatch} ${styles[tone]}`} />}
        {label}
      </dt>
      <dd className={styles.rowValue}>{value}</dd>
    </div>
  );
}
