/**
 * Hash-based signature visualizer.
 *
 * The tree is the idea, so the tree is drawn: eight one-time keys at the
 * bottom, hashed pairwise up to a single root that is the whole public key.
 * The signing leaf, the sibling nodes carried in the signature, and the root
 * are marked, which makes the authentication path something you follow rather
 * than something you are told about.
 *
 * The focus panel shows the WOTS+ chains, where the actual signing happens:
 * each chunk of the digest says how far along its chain to reveal.
 */

import { Cell } from '@/components/viz/Cell';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { HashSigStepState } from './engine';
import styles from './Visualizer.module.css';

export function HashSigVisualizer({
  step,
}: AlgorithmVisualizerProps<HashSigStepState>) {
  const s = step.state;
  const marks = new Map(
    (s.highlight ?? []).map((h) => [`${h.level}-${h.index}`, h.role]),
  );

  return (
    <VizStage>
      <VizStage.Context label={`Merkle tree · ${s.leaves} one-time keys`}>
        <div className={styles.tree}>
          {[...s.levels].reverse().map((row) => (
            <div className={styles.level} key={row[0].level}>
              <span className={styles.levelLabel}>
                {row[0].level === 0 ? 'leaves' : row[0].level === s.height ? 'root' : `h${row[0].level}`}
              </span>
              <div className={styles.nodes}>
                {row.map((node) => {
                  const role = marks.get(`${node.level}-${node.index}`);
                  return (
                    <span
                      className={`${styles.node} ${role ? styles[role] : ''}`}
                      key={node.index}
                      title={`level ${node.level}, index ${node.index}: ${node.value}`}
                    >
                      {node.value}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className={styles.legend}>
          <span className={`${styles.swatch} ${styles.leaf}`} /> signing leaf
          <span className={`${styles.swatch} ${styles.path}`} /> authentication path
          <span className={`${styles.swatch} ${styles.root}`} /> public key
        </p>
        {s.verified !== undefined && (
          <p className={s.verified ? styles.valid : styles.invalid}>
            {s.verified
              ? 'Reconstructed root matches the public key, signature valid.'
: 'Reconstructed root does not match, signature rejected.'}
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label={s.chunks ? 'WOTS+ chains' : 'The construction'}>
        {s.chunks ? (
          <div className={styles.stack}>
            <div className={styles.chains}>
              {s.chunks.map((value, i) => (
                <div
                  className={`${styles.chain} ${s.chunkIndex === i ? styles.chainOn : ''}`}
                  key={i}
                >
                  <span className={styles.chainName}>
                    {i < 8 ? `m${i}` : `c${i - 8}`}
                  </span>
                  <div className={styles.pips}>
                    {Array.from({ length: s.w }, (_, k) => (
                      <span
                        key={k}
                        className={`${styles.pip} ${
                          k < value ? styles.pipWalked : k === value ? styles.pipHere : ''
                        }`}
                      />
                    ))}
                  </div>
                  <span className={styles.chainValue}>{value}</span>
                </div>
              ))}
            </div>
            <p className={styles.note}>
              Filled pips are the hash steps revealed by the signature; the rest
              stay secret and a verifier walks them. The last two rows are the
              checksum, which moves opposite to the message chunks so that
              forging by walking further forward is impossible.
            </p>
          </div>
        ) : (
          <div className={styles.stack}>
            <Cell state="output">{s.root}</Cell>
            <p className={styles.note}>
              The root is the entire public key, {s.root.length / 2} bytes,
              regardless of how many one-time keys sit beneath it. Each leaf may
              be used exactly once; reusing one reveals enough of the chains to
              forge.
            </p>
          </div>
        )}
      </VizStage.Focus>
    </VizStage>
  );
}
