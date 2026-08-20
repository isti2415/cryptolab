import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/chacha20.py?code';
import { content } from './content';
import { run, type ChaCha20StepState } from './engine';
import { ChaCha20Visualizer } from './Visualizer';

const chacha20: AlgorithmDefinition<ChaCha20StepState> = {
  meta: {
    id: 'chacha20',
    name: 'ChaCha20',
    category: 'symmetric',
    era: '2008',
    difficulty: 4,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key (256-bit hex)',
      type: 'text',
      default: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      help: '64 hexadecimal digits.',
    },
    {
      key: 'nonce',
      label: 'Nonce (96-bit hex)',
      type: 'text',
      default: '000000000000004a00000000',
      help: '24 hexadecimal digits. Never reuse one with the same key.',
    },
    {
      key: 'counter',
      label: 'Block counter',
      type: 'int',
      min: 0,
      default: 1,
      help: 'The RFC 8439 worked examples start at 1.',
    },
  ],
  run,
  Visualizer: ChaCha20Visualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input:
      "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.",
    params: {
      key: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      nonce: '000000000000004a00000000',
      counter: 1,
    },
    direction: 'encrypt',
  },
};

export default chacha20;
