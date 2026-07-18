import { Grid, type CellState, type GridCell } from '@/components/viz/Grid';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { PlayfairStepState } from './engine';
import styles from './Visualizer.module.css';

function eq(a: [number, number] | undefined, r: number, c: number) {
  return a !== undefined && a[0] === r && a[1] === c;
}

export function PlayfairVisualizer({
  step,
}: AlgorithmVisualizerProps<PlayfairStepState>) {
  const s = step.state;

  const cells: GridCell[][] = s.grid.map((row, r) =>
    row.map((ch, c) => {
      let state: CellState = 'normal';
      if (eq(s.posA, r, c) || eq(s.posB, r, c)) state = 'primary';
      else if (eq(s.posRA, r, c) || eq(s.posRB, r, c)) state = 'secondary';
      return { text: ch === 'I' ? 'I/J' : ch, state };
    }),
  );

  return (
    <div className={styles.viz}>
      <Grid cells={cells} size={2.6} ariaLabel="Playfair key square" />

      {s.kind === 'pair' && (
        <div className={styles.readout} aria-hidden>
          <span className={styles.pair}>
            {s.a}
            {s.b}
          </span>
          <span className={styles.rule}>{s.rule}</span>
          <span className={styles.arrow}>→</span>
          <span className={`${styles.pair} ${styles.out}`}>
            {s.ra}
            {s.rb}
          </span>
        </div>
      )}

      <div className={styles.tracks}>
        <PairTrack label="in" pairs={s.inputPairs} active={s.pairIndex} />
        <PairTrack label="out" pairs={s.outputPairs} active={s.outputPairs.length - 1} out />
      </div>
    </div>
  );
}

function PairTrack({
  label,
  pairs,
  active,
  out = false,
}: {
  label: string;
  pairs: string[];
  active: number;
  out?: boolean;
}) {
  return (
    <div className={styles.trackRow}>
      <span className={styles.trackLabel}>{label}</span>
      <div className={styles.track}>
        {pairs.map((p, i) => (
          <span
            key={i}
            className={`${styles.chip} ${i === active ? (out ? styles.chipJust : styles.chipActive) : ''}`}
          >
            {p}
          </span>
        ))}
        {pairs.length === 0 && <span className={styles.empty}>—</span>}
      </div>
    </div>
  );
}
