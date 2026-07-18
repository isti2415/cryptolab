import type { AlgorithmVisualizerProps } from '@/core/types';
import type { DesStepState } from './engine';
import styles from './Visualizer.module.css';

export function DesVisualizer({ step }: AlgorithmVisualizerProps<DesStepState>) {
  const s = step.state;
  const activeRound = s.kind === 'round' ? s.round! : s.kind === 'ip' ? 0 : -1;

  return (
    <div className={styles.viz}>
      <div className={styles.halves}>
        <Half label="L" hex={s.L} />
        <div className={styles.mid}>
          {s.kind === 'round' ? (
            <>
              <span className={styles.op}>⊕ f</span>
              <span className={styles.key}>Kₙ {s.subkeyHex}</span>
            </>
          ) : (
            <span className={styles.phase}>{phaseLabel(s.kind)}</span>
          )}
        </div>
        <Half label="R" hex={s.R} accent />
      </div>

      {s.kind === 'final' && (
        <div className={styles.result} aria-hidden>
          output block <b>{s.outputHex}</b>
        </div>
      )}

      <div className={styles.schedule}>
        <span className={styles.scheduleLabel}>subkeys</span>
        <div className={styles.chips}>
          {s.allSubkeys.map((k, i) => (
            <span
              key={i}
              className={`${styles.chip} ${i + 1 === activeRound ? styles.chipActive : ''}`}
              title={k}
            >
              K{i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function phaseLabel(kind: DesStepState['kind']) {
  switch (kind) {
    case 'setup':
      return 'input block';
    case 'ip':
      return 'after IP';
    case 'final':
      return 'swap + FP';
    default:
      return '';
  }
}

function Half({ label, hex, accent = false }: { label: string; hex: string; accent?: boolean }) {
  return (
    <div className={styles.half}>
      <span className={styles.halfLabel}>{label}</span>
      <div className={`${styles.word} ${accent ? styles.wordAccent : ''}`}>
        {hex.split('').map((h, i) => (
          <span key={i} className={styles.nib}>
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}
