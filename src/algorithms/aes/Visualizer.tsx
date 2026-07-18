import { Grid, type GridCell } from '@/components/viz/Grid';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { AesStepState } from './engine';
import styles from './Visualizer.module.css';

/** Rebuild the 4×4 [row][col] byte grid from the column-major hex string. */
function toCells(hex: string): GridCell[][] {
  const cells: GridCell[][] = [[], [], [], []];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      const byte = hex.slice((c * 4 + r) * 2, (c * 4 + r) * 2 + 2);
      cells[r][c] = { text: byte, state: 'secondary' };
    }
  }
  return cells;
}

export function AesVisualizer({ step }: AlgorithmVisualizerProps<AesStepState>) {
  const s = step.state;

  return (
    <div className={styles.viz}>
      <div className={styles.opRow}>
        <span className={styles.op}>{s.op}</span>
        {s.round > 0 && s.kind !== 'final' && (
          <span className={styles.round}>round {s.round} / 10</span>
        )}
      </div>

      <Grid cells={toCells(s.state)} size={2.8} mono ariaLabel="AES state matrix" />

      {s.kind === 'final' && (
        <div className={styles.result} aria-hidden>
          output block <b>{s.outputHex}</b>
        </div>
      )}
    </div>
  );
}
