import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/blowfish.py?code';
import { content } from './content';
import { run, type BlowfishStepState } from './engine';
import { BlowfishVisualizer } from './Visualizer';

const blowfish: AlgorithmDefinition<BlowfishStepState> = {
  meta: {
    id: 'blowfish',
    name: 'Blowfish',
    category: 'symmetric',
    era: '1993',
    difficulty: 4,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key (hex, 4–56 bytes)',
      type: 'text',
      default: 'FEDCBA9876543210',
      help: '8 to 112 hexadecimal digits.',
    },
  ],
  run,
  Visualizer: BlowfishVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: '0123456789ABCDEF',
    params: { key: 'FEDCBA9876543210' },
    direction: 'encrypt',
  },
};

export default blowfish;
