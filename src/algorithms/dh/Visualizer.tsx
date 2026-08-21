/**
 * Diffie–Hellman visualizer.
 *
 * Two lanes with a wire between them, because the thing worth seeing is not the
 * arithmetic but *what crosses the gap*. Everything above the wire stays on one
 * machine; everything on it is public. An eavesdropper's view is exactly the
 * middle column, and the point of the diagram is that it is not enough.
 */

import { ValueLedger } from '@/components/viz/ValueLedger';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { DhStepState } from './engine';
import styles from './Visualizer.module.css';

export function DhVisualizer({ step }: AlgorithmVisualizerProps<DhStepState>) {
  const s = step.state;
  const reached = (kinds: DhStepState['kind'][]) => kinds.includes(s.kind);

  const hasA = reached(['publicA', 'publicB', 'exchange', 'sharedA', 'sharedB', 'agree']);
  const hasB = reached(['publicB', 'exchange', 'sharedA', 'sharedB', 'agree']);
  const hasSharedA = reached(['sharedA', 'sharedB', 'agree']);
  const hasSharedB = reached(['sharedB', 'agree']);

  return (
    <VizStage layout="stack">
      <VizStage.Context label="The exchange">
        <div className={styles.lanes}>
          <Party
            name="Alice"
            active={s.party === 'alice' || s.party === 'both'}
            secretLabel="a"
            secret={s.a}
            secretKnown={reached(['secretA']) || hasA}
            publicLabel="A = gᵃ"
            publicValue={hasA ? s.publicA : undefined}
            sharedValue={hasSharedA ? s.sharedA : undefined}
          />

          <div className={styles.wire}>
            <span className={styles.wireLabel}>public channel</span>
            <div className={styles.wireLine} />
            <div className={styles.wireValues}>
              <span className={styles.wireItem}>p = {s.p}</span>
              <span className={styles.wireItem}>g = {s.g}</span>
              {s.sent && (
                <>
                  <span className={`${styles.wireItem} ${styles.wireSent}`}>
                    A = {s.publicA}
                  </span>
                  <span className={`${styles.wireItem} ${styles.wireSent}`}>
                    B = {s.publicB}
                  </span>
                </>
              )}
            </div>
            <span className={styles.wireNote}>
              everything an eavesdropper sees
            </span>
          </div>

          <Party
            name="Bob"
            active={s.party === 'bob' || s.party === 'both'}
            secretLabel="b"
            secret={s.b}
            secretKnown={reached(['secretB']) || hasB}
            publicLabel="B = gᵇ"
            publicValue={hasB ? s.publicB : undefined}
            sharedValue={hasSharedB ? s.sharedB : undefined}
          />
        </div>

        {s.kind === 'agree' && (
          <p className={styles.agree}>
            Both sides hold {s.sharedA}. Nothing carrying that value was ever
            transmitted.
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label={s.ladder ? 'Square and multiply' : 'What is public'}>
        {s.ladder ? (
          <div className={styles.stack}>
            <p className={styles.formula}>
              {s.base}^{s.exponent} mod {s.p}
            </p>
            <table className={styles.ladder}>
              <thead>
                <tr>
                  <th scope="col">bit</th>
                  <th scope="col">action</th>
                  <th scope="col">running result</th>
                </tr>
              </thead>
              <tbody>
                {s.ladder.map((row) => (
                  <tr key={row.bitIndex}>
                    <td className={row.bit ? styles.bitOn : styles.bitOff}>
                      {row.bit}
                    </td>
                    <td>{row.multiplied ? 'square + multiply' : 'square only'}</td>
                    <td className={row.multiplied ? styles.hot : ''}>{row.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.note}>
              One row per exponent bit, low bit first. Going forwards costs a few
              dozen multiplications; going backwards, recovering the exponent
              from the result; is the discrete logarithm problem, and nobody
              knows how to do it quickly.
            </p>
          </div>
        ) : (
          <ValueLedger
            rows={[
              { key: 'p', label: 'p', value: s.p, active: s.kind === 'params' },
              { key: 'g', label: 'g', value: s.g, active: s.kind === 'params' },
              {
                key: 'a',
                label: 'a',
                value: s.a,
                secret: true,
                active: s.kind === 'secretA',
                note: 'Alice only, never transmitted',
              },
              {
                key: 'b',
                label: 'b',
                value: s.b,
                secret: true,
                active: s.kind === 'secretB',
                note: 'Bob only, never transmitted',
              },
              {
                key: 's',
                label: 'shared',
                value: s.kind === 'agree' ? s.sharedA! : '—',
                secret: true,
                active: s.kind === 'agree',
                note: 'derived independently on both sides',
              },
            ]}
          />
        )}
      </VizStage.Focus>
    </VizStage>
  );
}

function Party({
  name,
  active,
  secretLabel,
  secret,
  secretKnown,
  publicLabel,
  publicValue,
  sharedValue,
}: {
  name: string;
  active: boolean;
  secretLabel: string;
  secret: string;
  secretKnown: boolean;
  publicLabel: string;
  publicValue?: string;
  sharedValue?: string;
}) {
  return (
    <div className={`${styles.party} ${active ? styles.partyOn : ''}`}>
      <h5 className={styles.partyName}>{name}</h5>
      <dl className={styles.rows}>
        <Row
          label={`${secretLabel} (secret)`}
          value={secretKnown ? secret: '—'}
          tone="secret"
        />
        <Row label={publicLabel} value={publicValue ?? '—'} tone="public" />
        <Row label="shared" value={sharedValue ?? '—'} tone="shared" />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'secret' | 'public' | 'shared';
}) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={`${styles.rowValue} ${styles[tone]}`}>{value}</dd>
    </div>
  );
}
