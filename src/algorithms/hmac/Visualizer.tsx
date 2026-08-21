/**
 * HMAC visualizer.
 *
 * The nesting is the algorithm, so the nesting is the picture: two hashes, one
 * inside the other, with a differently-masked copy of the key in front of each.
 * The focus region shows the XOR that produces those masks, because "⊕ ipad" is
 * otherwise just a name for something invisible.
 */

import { BitField } from '@/components/viz/BitField';
import { VizStage } from '@/components/viz/VizStage';
import { XorLane } from '@/components/viz/XorLane';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { HmacStepState } from './engine';
import styles from './Visualizer.module.css';

const hex = (b: number) => b.toString(16).padStart(2, '0').toUpperCase();
/** Only the head of a 64-byte block is worth rendering; the tail is zeros. */
const HEAD = 12;

export function HmacVisualizer({ step }: AlgorithmVisualizerProps<HmacStepState>) {
  const s = step.state;

  const stages: { id: HmacStepState['kind'][]; label: string; value?: string }[] = [
    { id: ['ipad'], label: 'K ⊕ ipad', value: s.innerKey ? preview(s.innerKey) : undefined },
    { id: ['inner'], label: 'SHA-256(… ‖ message)', value: s.innerDigest },
    { id: ['opad'], label: 'K ⊕ opad', value: s.outerKey ? preview(s.outerKey) : undefined },
    { id: ['outer', 'tag'], label: 'SHA-256(… ‖ inner)', value: s.tag },
  ];

  return (
    <VizStage>
      <VizStage.Context label="The nesting">
        <ol className={styles.chain}>
          {stages.map((stage) => {
            const active = stage.id.includes(s.kind);
            return (
              <li
                key={stage.label}
                className={`${styles.stage} ${active ? styles.stageOn : ''} ${
                  stage.value ? styles.stageDone : ''
                }`}
              >
                <span className={styles.stageLabel}>{stage.label}</span>
                <span className={styles.stageValue}>{stage.value ?? '—'}</span>
              </li>
            );
          })}
        </ol>
        <p className={styles.note}>
          The outer hash consumes a fixed 32 bytes, so there is nothing an
          attacker can append. That is what defeats length extension, not the
          XOR masks themselves.
        </p>
      </VizStage.Context>

      <VizStage.Focus label={focusLabel(s)}>
        {s.kind === 'ipad' && s.innerKey ? (
          <PadLane block={s.blockKey} masked={s.innerKey} pad="36" name="ipad" />
        ) : s.kind === 'opad' && s.outerKey ? (
          <PadLane block={s.blockKey} masked={s.outerKey} pad="5C" name="opad" />
        ) : (
          <div className={styles.stack}>
            <BitField
              label="key"
              cells={s.blockKey.slice(0, HEAD).map((b) => ({
                text: hex(b),
                state: 'key',
              }))}
              size="2em"
            />
            <p className={styles.note}>
              {s.keyWasHashed
                ? 'The key was longer than 64 bytes, so it was replaced by its own SHA-256 digest. A long key and its hash therefore produce identical tags.'
                : s.keyWasPadded
                  ? `Padded with zeros from ${s.rawKey.length} bytes to the 64-byte block size. Note that this is the hash's block size, not its 32-byte output; getting that wrong is a classic implementation bug.`
                  : 'The key is exactly one block, so it is used as-is.'}
              {' '}First {HEAD} of 64 bytes shown.
            </p>
          </div>
        )}
      </VizStage.Focus>
    </VizStage>
  );
}

function PadLane({
  block,
  masked,
  pad,
  name,
}: {
  block: number[];
  masked: number[];
  pad: string;
  name: string;
}) {
  return (
    <div className={styles.stack}>
      <XorLane
        a={block.slice(0, HEAD).map(hex)}
        b={new Array(HEAD).fill(pad)}
        result={masked.slice(0, HEAD).map(hex)}
        labels={{ a: 'key', b: name, result: `K ⊕ ${name}` }}
        size="2em"
      />
      <p className={styles.note}>
        0x36 and 0x5C differ in four of their eight bits, so the two masked keys
        are unrelated in any way an attacker can use. First {HEAD} of 64 bytes
        shown; the pattern repeats across the whole block.
      </p>
    </div>
  );
}

function preview(bytes: number[]): string {
  return bytes.slice(0, 8).map(hex).join(' ') + ' …';
}

function focusLabel(s: HmacStepState): string {
  if (s.kind === 'ipad' || s.kind === 'opad') return 'Masking the key';
  if (s.kind === 'keyprep') return 'Key preparation';
  return 'The key';
}
