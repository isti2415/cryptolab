import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/mldsa.py?code';
import { content } from './content';
import { run, type MldsaStepState } from './engine';
import { MldsaVisualizer } from './Visualizer';

const mldsa: AlgorithmDefinition<MldsaStepState> = {
  meta,
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
  Visualizer: MldsaVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: 'attack at dawn',
    params: { seed: 12345 },
    direction: 'encrypt',
  },
};

export default mldsa;
