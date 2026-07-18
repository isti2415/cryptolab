import type { AlgorithmDefinition } from '@/core/types';
import { content } from './content';
import { run, type PlayfairStepState } from './engine';
import { PlayfairVisualizer } from './Visualizer';

const playfair: AlgorithmDefinition<PlayfairStepState> = {
  meta: {
    id: 'playfair',
    name: 'Playfair Cipher',
    category: 'classical',
    era: '1854',
    difficulty: 3,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'keyword',
      label: 'Keyword',
      type: 'text',
      default: 'PLAYFAIR EXAMPLE',
      placeholder: 'e.g. MONARCHY',
      help: 'Seeds the 5×5 key square (I/J share a cell).',
    },
  ],
  run,
  Visualizer: PlayfairVisualizer,
  sample: {
    input: 'Hide the gold in the tree stump',
    params: { keyword: 'PLAYFAIR EXAMPLE' },
    direction: 'encrypt',
  },
};

export default playfair;
