import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/dh.py?code';
import { content } from './content';
import { run, type DhStepState } from './engine';
import { DhVisualizer } from './Visualizer';

const dh: AlgorithmDefinition<DhStepState> = {
  meta: {
    id: 'diffie-hellman',
    name: 'Diffie–Hellman',
    category: 'publickey',
    era: '1976',
    difficulty: 3,
  },
  content,
  supportsDecrypt: false,
  takesInput: false,
  params: [
    {
      key: 'p',
      label: 'Prime p',
      type: 'text',
      default: '2147483647',
      help: 'The public modulus. Real groups are 2048 bits or more.',
    },
    {
      key: 'g',
      label: 'Generator g',
      type: 'text',
      default: '7',
      help: 'Public. Must generate a large subgroup mod p.',
    },
    {
      key: 'a',
      label: "Alice's secret a",
      type: 'text',
      default: '12345',
      help: 'Private to Alice; never transmitted.',
    },
    {
      key: 'b',
      label: "Bob's secret b",
      type: 'text',
      default: '67890',
      help: 'Private to Bob; never transmitted.',
    },
  ],
  run,
  Visualizer: DhVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: '',
    params: { p: '2147483647', g: '7', a: '12345', b: '67890' },
    direction: 'encrypt',
  },
};

export default dh;
