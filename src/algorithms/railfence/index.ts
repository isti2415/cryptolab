import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/railfence.py?code';
import { content } from './content';
import { run, type RailFenceStepState } from './engine';
import { RailFenceVisualizer } from './Visualizer';

const railfence: AlgorithmDefinition<RailFenceStepState> = {
  meta: {
    id: 'railfence',
    name: 'Rail Fence',
    category: 'classical',
    difficulty: 1,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'rails',
      label: 'Rails',
      type: 'int',
      min: 2,
      max: 12,
      default: 3,
      help: 'How many rows the zigzag runs across (2–12).',
    },
  ],
  run,
  Visualizer: RailFenceVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: 'We are discovered flee at once',
    params: { rails: 3 },
    direction: 'encrypt',
  },
};

export default railfence;
