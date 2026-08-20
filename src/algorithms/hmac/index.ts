import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/hmac_sha256.py?code';
import { content } from './content';
import { run, type HmacStepState } from './engine';
import { HmacVisualizer } from './Visualizer';

const hmac: AlgorithmDefinition<HmacStepState> = {
  meta: {
    id: 'hmac',
    name: 'HMAC',
    category: 'hash',
    era: '1996',
    difficulty: 3,
  },
  content,
  supportsDecrypt: false,
  params: [
    {
      key: 'key',
      label: 'Key',
      type: 'text',
      default: 'Jefe',
      help: 'Any length. Longer than 64 bytes and it is hashed down first.',
    },
    {
      key: 'format',
      label: 'Input format',
      type: 'select',
      default: 'text',
      options: [
        { value: 'text', label: 'Text' },
        { value: 'hex', label: 'Hex' },
      ],
      help: 'Hex lets you reproduce the binary RFC 4231 vectors.',
    },
  ],
  run,
  Visualizer: HmacVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: 'what do ya want for nothing?',
    params: { key: 'Jefe', format: 'text' },
    direction: 'encrypt',
  },
};

export default hmac;
