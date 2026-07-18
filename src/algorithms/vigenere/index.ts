import type { AlgorithmDefinition } from '@/core/types';
import { content } from './content';
import { run, type VigenereStepState } from './engine';
import { VigenereVisualizer } from './Visualizer';

const vigenere: AlgorithmDefinition<VigenereStepState> = {
  meta: {
    id: 'vigenere',
    name: 'Vigenère Cipher',
    category: 'classical',
    era: '1553',
    difficulty: 2,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'keyword',
      label: 'Keyword',
      type: 'text',
      default: 'LEMON',
      placeholder: 'e.g. LEMON',
      help: 'Letters only; repeats across the message.',
    },
  ],
  run,
  Visualizer: VigenereVisualizer,
  sample: { input: 'Attack at dawn', params: { keyword: 'LEMON' }, direction: 'encrypt' },
};

export default vigenere;
