import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/aes.py?code';
import { content } from './content';
import { run, type AesStepState } from './engine';
import { AesVisualizer } from './Visualizer';

const aes: AlgorithmDefinition<AesStepState> = {
  meta,
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key (128-bit hex)',
      type: 'text',
      default: '000102030405060708090A0B0C0D0E0F',
      placeholder: '32 hex digits',
      help: 'The 128-bit key, as 32 hexadecimal digits. This lab implements AES-128 only; AES-192 and AES-256 differ solely in the key schedule and round count.',
    },
  ],
  run,
  Visualizer: AesVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: '00112233445566778899AABBCCDDEEFF',
    params: { key: '000102030405060708090A0B0C0D0E0F' },
    direction: 'encrypt',
  },
};

export default aes;
