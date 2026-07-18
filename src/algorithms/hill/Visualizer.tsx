import { Grid, type GridCell } from '@/components/viz/Grid';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { HillStepState } from './engine';
import styles from './Visualizer.module.css';

export function HillVisualizer({ step }: AlgorithmVisualizerProps<HillStepState>) {
  const s = step.state;

  const matrixCells: GridCell[][] = s.matrix.map((row) =>
    row.map((n) => ({ text: String(n), state: 'secondary' as const })),
  );

  const vec = (v: [number, number] | undefined, active: boolean): GridCell[][] =>
    (v ?? [0, 0]).map((n) => [
      { text: v ? String(n) : '·', state: active ? ('primary' as const) : ('normal' as const) },
    ]);

  return (
    <div className={styles.viz}>
      <div className={styles.equation}>
        <div className={styles.term}>
          <span className={styles.termLabel}>
            {s.direction === 'encrypt' ? 'key K' : 'K⁻¹'}
          </span>
          <Grid cells={matrixCells} size={2.4} mono ariaLabel="key matrix" />
        </div>

        <span className={styles.op}>×</span>

        <div className={styles.term}>
          <span className={styles.termLabel}>{s.inChars ?? 'block'}</span>
          <Grid cells={vec(s.inVec, s.kind === 'block')} size={2.4} mono ariaLabel="input vector" />
        </div>

        <span className={styles.op}>=</span>

        <div className={styles.term}>
          <span className={`${styles.termLabel} ${styles.outLabel}`}>{s.outChars ?? '?'}</span>
          <Grid cells={vec(s.outVec, s.kind === 'block')} size={2.4} mono ariaLabel="output vector" />
        </div>
      </div>

      {s.kind === 'block' && (
        <div className={styles.calc} aria-hidden>
          <span>{s.calc0} (mod 26)</span>
          <span>{s.calc1} (mod 26)</span>
        </div>
      )}

      <div className={styles.tracks}>
        <BlockTrack label="in" blocks={s.inputBlocks} active={s.blockIndex} />
        <BlockTrack label="out" blocks={s.outputBlocks} active={s.outputBlocks.length - 1} out />
      </div>
    </div>
  );
}

function BlockTrack({
  label,
  blocks,
  active,
  out = false,
}: {
  label: string;
  blocks: string[];
  active: number;
  out?: boolean;
}) {
  return (
    <div className={styles.trackRow}>
      <span className={styles.trackLabel}>{label}</span>
      <div className={styles.track}>
        {blocks.map((b, i) => (
          <span
            key={i}
            className={`${styles.chip} ${i === active ? (out ? styles.chipJust : styles.chipActive) : ''}`}
          >
            {b}
          </span>
        ))}
        {blocks.length === 0 && <span className={styles.empty}>—</span>}
      </div>
    </div>
  );
}
