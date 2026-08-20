/**
 * RSA visualizer.
 *
 * RSA has no block of data to watch move around, so the ledger of key
 * quantities stays as permanent context with whichever ones the step reads lit
 * up. What has changed is that the mechanisms behind those quantities are now
 * shown rather than asserted: the extended Euclidean algorithm that produces d,
 * the trial-division cost that makes n hard to factor, and the
 * square-and-multiply ladder that actually performs the exponentiation. The
 * page used to state all three in prose and render none of them.
 */

import { ChipTrack } from '@/components/viz/ChipTrack';
import { ValueLedger, type LedgerRow } from '@/components/viz/ValueLedger';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { RsaStepState } from './engine';
import styles from './Visualizer.module.css';

/** Which ledger rows the current step reads or produces. */
function activeRows(s: RsaStepState): Set<string> {
  switch (s.kind) {
    case 'primes':
      return new Set(['p', 'q']);
    case 'modulus':
    case 'trapdoor':
      return new Set(['p', 'q', 'n']);
    case 'totient':
      return new Set(['p', 'q', 'phi']);
    case 'public':
      return new Set(['e', 'phi']);
    case 'private':
      return new Set(['d', 'e', 'phi']);
    case 'char':
      return new Set(s.direction === 'encrypt' ? ['n', 'e'] : ['n', 'd']);
    default:
      return new Set();
  }
}

export function RsaVisualizer({ step }: AlgorithmVisualizerProps<RsaStepState>) {
  const s = step.state;
  const on = activeRows(s);

  const rows: LedgerRow[] = [
    { key: 'p', label: 'p', value: s.p, secret: true, active: on.has('p') },
    { key: 'q', label: 'q', value: s.q, secret: true, active: on.has('q') },
    { key: 'n', label: 'n = p·q', value: s.n, active: on.has('n') },
    { key: 'phi', label: 'φ(n)', value: s.phi, secret: true, active: on.has('phi') },
    { key: 'e', label: 'e (public)', value: s.e, active: on.has('e') },
    { key: 'd', label: 'd (private)', value: s.d, secret: true, active: on.has('d') },
  ];

  return (
    <VizStage>
      <VizStage.Context label="Key material">
        <ValueLedger rows={rows} />
        <p className={styles.legend}>
          <span className={styles.lock}>●</span> stays secret, publishing any
          one of these reveals the private key.
        </p>
      </VizStage.Context>

      <VizStage.Focus label={focusLabel(s)}>
        <Focus state={s} />
      </VizStage.Focus>

      {s.units && s.units.length > 0 && (
        <VizStage.Track label={s.direction === 'encrypt' ? 'Message' : 'Ciphertext'}>
          <ChipTrack
            label="in"
            chips={s.units.map((u, i) => ({
              text: u,
              state: i === s.index ? 'active' : i < (s.index ?? 0) ? 'done' : 'idle',
            }))}
          />
          <ChipTrack
            label="out"
            chips={splitOutput(s).map((u) => ({ text: u, state: 'output' }))}
            placeholder="nothing yet"
          />
        </VizStage.Track>
      )}
    </VizStage>
  );
}

/** Encryption emits space-separated integers; decryption emits characters. */
function splitOutput(s: RsaStepState): string[] {
  if (!s.outputSoFar) return [];
  return s.direction === 'encrypt' ? s.outputSoFar.split(' ') : [...s.outputSoFar];
}

function focusLabel(s: RsaStepState): string {
  switch (s.kind) {
    case 'trapdoor':
      return 'The trapdoor';
    case 'private':
      return 'Extended Euclid';
    case 'char':
      return 'Square and multiply';
    default:
      return 'Setup';
  }
}

function Focus({ state: s }: { state: RsaStepState }) {
  /* ------------------------------------------------------------ trapdoor */
  if (s.trapdoor) {
    return (
      <div className={styles.trapdoor}>
        <div className={styles.direction}>
          <span className={styles.dirLabel}>p × q → n</span>
          <span className={styles.dirCost}>
            {s.trapdoor.forward} multiplication
          </span>
          <span className={styles.bar} style={{ width: '6px' }} />
        </div>
        <div className={styles.direction}>
          <span className={styles.dirLabel}>n → p, q</span>
          <span className={styles.dirCost}>
            up to {s.trapdoor.backward} trial divisions
          </span>
          {/* Bar length is illustrative; the real ratio is unplottable. */}
          <span className={`${styles.bar} ${styles.barSlow}`} />
        </div>
        <p className={styles.note}>
          Trial division finds the factor {s.trapdoor.foundAt} here because these
          primes are tiny. At a real 2048-bit modulus the same search would take
          longer than the age of the universe; that asymmetry, and nothing else,
          is what keeps d secret.
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------ extended Euclid */
  if (s.euclid && s.kind === 'private') {
    return (
      <div className={styles.stack}>
        <table className={styles.euclid}>
          <thead>
            <tr>
              <th scope="col">quotient</th>
              <th scope="col">remainder</th>
              <th scope="col">coefficient of e</th>
            </tr>
          </thead>
          <tbody>
            {s.euclid.map((r, i) => (
              <tr key={i} className={i === s.euclid!.length - 1 ? styles.lastRow : ''}>
                <td>{r.quotient}</td>
                <td>{r.remainder}</td>
                <td>{r.coefficient}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>
          The algorithm stops when the remainder reaches 1; the coefficient
          carried alongside it is e⁻¹, reduced mod φ(n) to give d = {s.d}.
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------- modular exponent */
  if (s.ladder && s.exponentBits) {
    return (
      <div className={styles.stack}>
        <p className={styles.formula}>
          <span className={styles.op}>{s.formula}</span>
        </p>

        {/* Binary is conventionally written high bit first, but the ladder
            consumes the exponent from the low end, so the table below runs in
            the opposite direction to this string. Said, rather than left for
            the reader to trip over. */}
        <div className={styles.exponent}>
          <span className={styles.expLabel}>exponent {s.exponent} =</span>
          <span className={styles.expBits}>
            {[...s.exponentBits].map((b, i) => (
              <span key={i} className={b === '1' ? styles.bitOn : styles.bitOff}>
                {b}
              </span>
            ))}
          </span>
          <span className={styles.expLabel}>in binary, read right to left</span>
        </div>

        <table className={styles.ladder}>
          <thead>
            <tr>
              <th scope="col">bit ↑</th>
              <th scope="col">action</th>
              <th scope="col">running result</th>
              <th scope="col">squared base</th>
            </tr>
          </thead>
          <tbody>
            {s.ladder.map((row) => (
              <tr key={row.bitIndex}>
                <td className={row.bit ? styles.bitOn : styles.bitOff}>{row.bit}</td>
                <td>{row.multiplied ? 'square + multiply' : 'square only'}</td>
                <td className={row.multiplied ? styles.hot : ''}>{row.result}</td>
                <td>{row.base}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>
          One row per exponent bit, low bit first. The base is squared every row;
          it is folded into the result only where the bit is 1, which is why
          exponent size costs bits, not multiplications.
        </p>
      </div>
    );
  }

  /* ----------------------------------------------------------- key setup */
  return (
    <p className={styles.note}>
      {s.kind === 'primes'
        ? 'Both primes are verified with Miller–Rabin before anything else happens; a composite here would produce a key that silently fails to decrypt.'
        : s.kind === 'totient'
          ? 'φ(n) is computable from p and q in one step, and utterly infeasible from n alone, which is exactly why p and q must never be published.'
          : 'The public key (n, e) can be handed to anyone. Only the holder of d can undo what it does.'}
    </p>
  );
}
