import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/playfair.py?code';
import { content } from './content';
import { run, type PlayfairStepState } from './engine';
import { PlayfairVisualizer } from './Visualizer';

const playfair: AlgorithmDefinition<PlayfairStepState> = {
  meta,
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'keyword',
      label: 'Keyword',
      type: 'text',
      default: 'PLAYFAIR EXAMPLE',
      placeholder: 'e.g. MONARCHY',
      help: 'Seeds the 5×5 key square (I/J share a cell).',
    },
  ],
  run,
  Visualizer: PlayfairVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: 'Hide the gold in the tree stump',
    params: { keyword: 'PLAYFAIR EXAMPLE' },
    direction: 'encrypt',
  },
};

export default playfair;
