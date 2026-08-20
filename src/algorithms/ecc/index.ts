import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/ecc.py?code';
import { content } from './content';
import { run, type EccStepState } from './engine';
import { EccVisualizer } from './Visualizer';

const ecc: AlgorithmDefinition<EccStepState> = {
  meta: {
    id: 'ecdh',
    name: 'Elliptic Curve (ECDH)',
    category: 'publickey',
    era: '1985',
    difficulty: 5,
  },
  content,
  supportsDecrypt: false,
  takesInput: false,
  params: [
    {
      key: 'curve',
      label: 'Curve',
      type: 'select',
      default: 'small',
      options: [
        { value: 'tiny', label: 'y² = x³ + 7 mod 17 (18 points)' },
        { value: 'small', label: 'y² = x³ + x + 1 mod 263 (260 points)' },
      ],
      help: 'Small enough to plot every point. Real curves have about 2²⁵⁶.',
    },
    {
      key: 'a',
      label: "Alice's scalar",
      type: 'int',
      min: 1,
      default: 47,
      help: 'Private to Alice; never transmitted.',
    },
    {
      key: 'b',
      label: "Bob's scalar",
      type: 'int',
      min: 1,
      default: 131,
      help: 'Private to Bob; never transmitted.',
    },
  ],
  run,
  Visualizer: EccVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: '',
    params: { curve: 'small', a: 47, b: 131 },
    direction: 'encrypt',
  },
};

export default ecc;
