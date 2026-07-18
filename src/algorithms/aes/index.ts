import type { AlgorithmDefinition } from '@/core/types';
import { content } from './content';
import { run, type AesStepState } from './engine';
import { AesVisualizer } from './Visualizer';

const aes: AlgorithmDefinition<AesStepState> = {
  meta: {
    id: 'aes',
    name: 'AES',
    category: 'modern',
    era: '2001',
    difficulty: 5,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key (128-bit hex)',
      type: 'text',
      default: '000102030405060708090A0B0C0D0E0F',
      placeholder: '32 hex digits',
      help: 'The 128-bit key, as 32 hexadecimal digits.',
    },
  ],
  run,
  Visualizer: AesVisualizer,
  sample: {
    input: '00112233445566778899AABBCCDDEEFF',
    params: { key: '000102030405060708090A0B0C0D0E0F' },
    direction: 'encrypt',
  },
};

export default aes;
