/**
 * The interactive console: input, parameter fields, direction, and the live
 * output. It is fully generic — it renders whatever `params` an algorithm
 * declares and calls the same `run()` the walkthrough uses, so the output shown
 * here is by construction the output the walkthrough arrives at.
 */

import type {
  AlgorithmResult,
  AnyAlgorithm,
  Direction,
  Params,
} from '@/core/types';
import styles from './Console.module.css';

interface ConsoleProps {
  algo: AnyAlgorithm;
  input: string;
  params: Params;
  direction: Direction;
  result: AlgorithmResult;
  onInputChange: (v: string) => void;
  onParamChange: (key: string, v: string | number) => void;
  onDirectionChange: (d: Direction) => void;
}

export function Console({
  algo,
  input,
  params,
  direction,
  result,
  onInputChange,
  onParamChange,
  onDirectionChange,
}: ConsoleProps) {
  const err = result.error;

  return (
    <section className={styles.console} aria-label="Interactive playground">
      {/* Controls bar: direction + parameters, compact and wrapping. */}
      <div className={styles.controls}>
        {algo.supportsDecrypt && (
          <div className={styles.control}>
            <span className={styles.label}>Mode</span>
            <div className={styles.toggle} role="group" aria-label="Direction">
              {(['encrypt', 'decrypt'] as Direction[]).map((d) => (
                <button
                  key={d}
                  className={`${styles.toggleBtn} ${direction === d ? styles.toggleOn : ''}`}
                  aria-pressed={direction === d}
                  onClick={() => onDirectionChange(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {algo.params.map((p) => {
          const value = params[p.key];
          const invalid = err?.paramKey === p.key;
          const describedBy = p.help ? `${p.key}-help` : undefined;
          return (
            <div key={p.key} className={styles.control}>
              <label className={styles.label} htmlFor={`pg-${p.key}`}>
                {p.label}
              </label>
              {p.type === 'select' ? (
                <select
                  id={`pg-${p.key}`}
                  className={`${styles.input} ${invalid ? styles.inputBad : ''}`}
                  value={String(value ?? p.default)}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(e) => onParamChange(p.key, e.target.value)}
                >
                  {p.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`pg-${p.key}`}
                  className={`${styles.input} ${p.type === 'int' ? styles.inputNum : ''} ${invalid ? styles.inputBad : ''}`}
                  type={p.type === 'int' ? 'number' : 'text'}
                  inputMode={p.type === 'int' ? 'numeric' : undefined}
                  min={p.type === 'int' ? p.min : undefined}
                  max={p.type === 'int' ? p.max : undefined}
                  value={String(value ?? '')}
                  placeholder={p.type === 'text' ? p.placeholder : undefined}
                  spellCheck={false}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(e) => onParamChange(p.key, e.target.value)}
                />
              )}
              {p.help && (
                <span id={describedBy} className={styles.help}>
                  {p.help}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Input → output, read left-to-right (stacks on narrow screens). */}
      <div className={styles.io}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pg-input">
            {direction === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
          </label>
          <textarea
            id="pg-input"
            className={styles.textarea}
            value={input}
            spellCheck={false}
            rows={4}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type a message…"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.outputHead}>
            <label className={styles.label}>
              {direction === 'encrypt' ? 'Ciphertext' : 'Plaintext'}
            </label>
            {!err && result.output && (
              <button
                className={styles.copy}
                onClick={() => navigator.clipboard?.writeText(result.output)}
                title="Copy output"
              >
                copy
              </button>
            )}
          </div>
          {err ? (
            <p className={styles.error} role="alert">
              <span className={styles.errBadge}>error</span> {err.message}
            </p>
          ) : (
            <output className={styles.result}>
              {result.output || <span className={styles.placeholder}>—</span>}
            </output>
          )}
        </div>
      </div>
    </section>
  );
}
