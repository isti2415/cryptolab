import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/vigenere.py?code';
import { content } from './content';
import { run, type VigenereStepState } from './engine';
import { VigenereVisualizer } from './Visualizer';

const vigenere: AlgorithmDefinition<VigenereStepState> = {
  meta,
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'keyword',
      label: 'Keyword',
      type: 'text',
      default: 'LEMON',
      placeholder: 'e.g. LEMON',
      help: 'Letters only; repeats across the message.',
    },
  ],
  run,
  Visualizer: VigenereVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: 'Attack at dawn', params: { keyword: 'LEMON' }, direction: 'encrypt' },
};

export default vigenere;
