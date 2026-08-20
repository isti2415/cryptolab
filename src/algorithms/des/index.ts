import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/des.py?code';
import { content } from './content';
import { run, type DesStepState } from './engine';
import { DesVisualizer } from './Visualizer';

const des: AlgorithmDefinition<DesStepState> = {
  meta: {
    id: 'des',
    name: 'DES',
    category: 'symmetric',
    era: '1977',
    difficulty: 4,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key (64-bit hex)',
      type: 'text',
      default: '133457799BBCDFF1',
      placeholder: '16 hex digits',
      help: 'The 64-bit key, as 16 hexadecimal digits.',
    },
  ],
  run,
  Visualizer: DesVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: '0123456789ABCDEF',
    params: { key: '133457799BBCDFF1' },
    direction: 'encrypt',
  },
};

export default des;
