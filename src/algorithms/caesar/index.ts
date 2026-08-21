import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/caesar.py?code';
import { content } from './content';
import { run, type CaesarStepState } from './engine';
import { CaesarVisualizer } from './Visualizer';

/**
 * Caesar cipher: the reference algorithm module. Every field a new algorithm
 * must provide is present here; copy this folder's shape to add another.
 */
const caesar: AlgorithmDefinition<CaesarStepState> = {
  meta,
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'shift',
      label: 'Shift',
      type: 'int',
      min: 0,
      max: 25,
      default: 3,
      help: 'How many places each letter moves (0–25).',
    },
  ],
  run,
  Visualizer: CaesarVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: 'The die is cast',
    params: { shift: 3 },
    direction: 'encrypt',
  },
};

export default caesar;
