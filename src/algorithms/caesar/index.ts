import type { AlgorithmDefinition } from '@/core/types';
import { content } from './content';
import { run, type CaesarStepState } from './engine';
import { CaesarVisualizer } from './Visualizer';

/**
 * Caesar cipher — the reference algorithm module. Every field a new algorithm
 * must provide is present here; copy this folder's shape to add another.
 */
const caesar: AlgorithmDefinition<CaesarStepState> = {
  meta: {
    id: 'caesar',
    name: 'Caesar Cipher',
    category: 'classical',
    era: '~50 BC',
    difficulty: 1,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'shift',
      label: 'Shift',
      type: 'int',
      min: 0,
      max: 25,
      default: 3,
      help: 'How many places each letter moves (0–25).',
    },
  ],
  run,
  Visualizer: CaesarVisualizer,
  sample: {
    input: 'The die is cast',
    params: { shift: 3 },
    direction: 'encrypt',
  },
};

export default caesar;
