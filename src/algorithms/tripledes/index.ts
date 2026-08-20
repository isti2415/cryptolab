import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/tripledes.py?code';
import { content } from './content';
import { run, type TripleDesStepState } from './engine';
import { TripleDesVisualizer } from './Visualizer';

const tripledes: AlgorithmDefinition<TripleDesStepState> = {
  meta: {
    id: '3des',
    name: 'Triple DES',
    category: 'symmetric',
    era: '1978',
    difficulty: 4,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key (32 or 48 hex)',
      type: 'text',
      default: '133457799BBCDFF10E329232EA6D0D73AABB09182736CCDD',
      help: '32 digits for two-key 3DES (K3 = K1), 48 for three independent keys.',
    },
  ],
  run,
  Visualizer: TripleDesVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: '0123456789ABCDEF',
    params: { key: '133457799BBCDFF10E329232EA6D0D73AABB09182736CCDD' },
    direction: 'encrypt',
  },
};

export default tripledes;
