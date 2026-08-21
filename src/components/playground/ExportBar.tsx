/**
 * Getting the result, and the page, back out.
 *
 * Copy-as-hex and copy-as-Base64 encode the UTF-8 bytes of whatever is in the
 * output box. For a classical cipher that turns "KHOOR" into something you can
 * paste into another tool; for AES, whose output is already hex, it is the hex
 * of those characters, which is why the buttons say what they do rather than
 * promising a conversion nobody asked for.
 *
 * "Copy link" builds its own URL rather than copying the address bar. The
 * address bar is deliberately minimal — it omits anything still at its default,
 * so reading a page does not litter it — but a link that says nothing is a poor
 * thing to hand someone: it looks like the button did nothing, and it pins
 * nothing, so it would drift the day an algorithm's sample input is reworded.
 * The copied link states the whole configuration.
 */

import { useCallback, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { encodeState } from '@/core/permalink';
import type { AnyAlgorithm, Direction, Params, Step } from '@/core/types';
import styles from './ExportBar.module.css';

type Copied = null | 'hex' | 'base64' | 'link' | 'trace';

function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function toHex(text: string): string {
  return Array.from(toBytes(text))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function toBase64(text: string): string {
  const bytes = toBytes(text);
  let binary = '';
  // btoa works on latin-1, so the UTF-8 bytes are fed through one at a time
  // rather than handing it a string with code points above 255.
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** A trace, as a file someone can keep, diff or hand to a marker. */
export function traceToJson(
  algo: AnyAlgorithm,
  input: string,
  params: Params,
  direction: Direction,
  output: string,
  steps: Step[],
): string {
  return JSON.stringify(
    {
      algorithm: { id: algo.meta.id, name: algo.meta.name },
      direction,
      input,
      params,
      output,
      steps: steps.map((s, i) => ({
        n: i + 1,
        phase: s.phase,
        title: s.title,
        description: s.description,
      })),
    },
    null,
    2,
  );
}

export function ExportBar({
  algo,
  input,
  params,
  direction,
  output,
  steps,
  step,
}: {
  algo: AnyAlgorithm;
  input: string;
  params: Params;
  direction: Direction;
  output: string;
  steps: Step[];
  /** Position in the trace, so a shared link lands where the sharer was. */
  step?: number;
}) {
  const [copied, setCopied] = useState<Copied>(null);

  const flash = useCallback((what: Copied) => {
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1400);
  }, []);

  const copy = useCallback(
    async (what: Exclude<Copied, null>, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flash(what);
      } catch {
        /* clipboard blocked; the output and the URL are both readable anyway */
      }
    },
    [flash],
  );

  const downloadTrace = useCallback(() => {
    const json = traceToJson(algo, input, params, direction, output, steps);
    const url = URL.createObjectURL(
      new Blob([json], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `cryptolab-${algo.meta.id}-${direction}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('trace');
  }, [algo, input, params, direction, output, steps, flash]);

  const hasOutput = output.length > 0;

  return (
    <div className={styles.bar}>
      <span className={styles.legend}>Export</span>

      <button
        type="button"
        className={styles.action}
        onClick={() =>
          copy(
            'link',
            `${window.location.origin}${window.location.pathname}${encodeState(
              { input, params, direction, step },
              algo.params,
              algo.sample,
              'explicit',
            )}`,
          )
        }
      >
        <Icon name={copied === 'link' ? 'check' : 'copy'} size={12} />
        {copied === 'link' ? 'Link copied' : 'Copy link'}
      </button>

      <button
        type="button"
        className={styles.action}
        disabled={!hasOutput}
        onClick={() => copy('hex', toHex(output))}
      >
        {copied === 'hex' ? 'Copied' : 'Hex'}
      </button>

      <button
        type="button"
        className={styles.action}
        disabled={!hasOutput}
        onClick={() => copy('base64', toBase64(output))}
      >
        {copied === 'base64' ? 'Copied' : 'Base64'}
      </button>

      <button
        type="button"
        className={styles.action}
        disabled={steps.length === 0}
        onClick={downloadTrace}
      >
        {copied === 'trace' ? 'Downloaded' : 'Trace (.json)'}
      </button>
    </div>
  );
}
