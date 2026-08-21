import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/hill.py?code';
import { content } from './content';
import { run, type HillStepState } from './engine';
import { HillVisualizer } from './Visualizer';

const hill: AlgorithmDefinition<HillStepState> = {
  meta,
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key matrix (2×2)',
      type: 'text',
      default: '3 3 2 5',
      placeholder: 'a b c d',
      help: 'Four numbers, row by row. det must be coprime with 26.',
    },
  ],
  run,
  Visualizer: HillVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: 'HELP', params: { key: '3 3 2 5' }, direction: 'encrypt' },
};

export default hill;
