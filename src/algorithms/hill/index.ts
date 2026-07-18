import type { AlgorithmDefinition } from '@/core/types';
import { content } from './content';
import { run, type HillStepState } from './engine';
import { HillVisualizer } from './Visualizer';

const hill: AlgorithmDefinition<HillStepState> = {
  meta: {
    id: 'hill',
    name: 'Hill Cipher',
    category: 'classical',
    era: '1929',
    difficulty: 3,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key matrix (2×2)',
      type: 'text',
      default: '3 3 2 5',
      placeholder: 'a b c d',
      help: 'Four numbers, row by row. det must be coprime with 26.',
    },
  ],
  run,
  Visualizer: HillVisualizer,
  sample: { input: 'HELP', params: { key: '3 3 2 5' }, direction: 'encrypt' },
};

export default hill;
