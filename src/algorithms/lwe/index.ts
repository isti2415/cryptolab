import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/lwe.py?code';
import { content } from './content';
import { run, type LweStepState } from './engine';
import { LweVisualizer } from './Visualizer';

const lwe: AlgorithmDefinition<LweStepState> = {
  meta: {
    id: 'lwe',
    name: 'Learning With Errors',
    category: 'pqc',
    era: '2005',
    difficulty: 4,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'seed',
      label: 'Key seed',
      type: 'int',
      min: 1,
      default: 12345,
      help: 'Deterministic, so a walkthrough can be revisited. Not real randomness.',
    },
  ],
  run,
  Visualizer: LweVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: '10110', params: { seed: 12345 }, direction: 'encrypt' },
};

export default lwe;
