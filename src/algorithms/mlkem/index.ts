import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/mlkem.py?code';
import { content } from './content';
import { run, type MlkemStepState } from './engine';
import { MlkemVisualizer } from './Visualizer';

const mlkem: AlgorithmDefinition<MlkemStepState> = {
  meta,
  content,
  supportsDecrypt: false,
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
  Visualizer: MlkemVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: '10110011', params: { seed: 12345 }, direction: 'encrypt' },
};

export default mlkem;
