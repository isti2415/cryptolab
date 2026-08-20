/**
 * Scatter plot of an elliptic curve over a finite field.
 *
 * Over the real numbers an elliptic curve is a smooth arc and the group law is
 * visibly geometric; draw a line, take the third intersection, reflect. Over
 * F_p that picture shatters into a cloud of dots, and pretending otherwise is a
 * common way these diagrams mislead.
 *
 * So this draws what is actually there: every point of the curve, with the ones
 * in play marked. The symmetry about the horizontal midline is real and worth
 * noticing; it is the reflection step of the group law, and the reason every
 * point has an inverse.
 */

import styles from './CurvePlot.module.css';

export interface PlotPoint {
  x: number;
  y: number;
}

export interface PlotMark {
  point: PlotPoint | null;
  role: 'generator' | 'public' | 'shared' | 'working';
  label?: string;
}

interface CurvePlotProps {
  /** Every affine point on the curve. */
  points: PlotPoint[];
  /** The field modulus, which sets both axis ranges. */
  modulus: number;
  marks?: PlotMark[];
}

const SIZE = 320;
const PAD = 14;

export function CurvePlot({ points, modulus, marks = [] }: CurvePlotProps) {
  const scale = (v: number) => PAD + (v / (modulus - 1)) * (SIZE - 2 * PAD);
  // Screen y grows downward; flipping keeps the field's y axis pointing up so
  // the curve's symmetry reads correctly.
  const sy = (v: number) => SIZE - scale(v);

  const marked = new Map(
    marks
      .filter((m) => m.point !== null)
      .map((m) => [`${m.point!.x},${m.point!.y}`, m]),
  );

  const dot = points.length > 120 ? 1.7 : 3;

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={styles.svg}
        role="img"
        aria-label={`${points.length} points on the curve over a field of ${modulus} elements`}
      >
        <rect x="0" y="0" width={SIZE} height={SIZE} className={styles.field} rx="6" />
        {/* The axis of reflection: P and −P sit symmetrically about it. */}
        <line
          x1={PAD}
          y1={sy((modulus - 1) / 2)}
          x2={SIZE - PAD}
          y2={sy((modulus - 1) / 2)}
          className={styles.axis}
        />

        {points.map((p) => {
          const key = `${p.x},${p.y}`;
          if (marked.has(key)) return null;
          return (
            <circle key={key} cx={scale(p.x)} cy={sy(p.y)} r={dot} className={styles.point} />
          );
        })}

        {[...marked.values()].map((m) => (
          <g key={`${m.point!.x},${m.point!.y}`}>
            <circle
              cx={scale(m.point!.x)}
              cy={sy(m.point!.y)}
              r={dot + 3.5}
              className={`${styles.halo} ${styles[m.role]}`}
            />
            <circle
              cx={scale(m.point!.x)}
              cy={sy(m.point!.y)}
              r={dot + 0.8}
              className={`${styles.mark} ${styles[m.role]}`}
            />
          </g>
        ))}
      </svg>

      {marks.some((m) => m.point === null) && (
        <p className={styles.infinity}>
          One of the points in play is the point at infinity, which has no
          position on the plot; it is the group's identity element.
        </p>
      )}
    </div>
  );
}
