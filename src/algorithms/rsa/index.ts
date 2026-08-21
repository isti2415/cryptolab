import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/rsa.py?code';
import { content } from './content';
import { run, type RsaStepState } from './engine';
import { RsaVisualizer } from './Visualizer';

const rsa: AlgorithmDefinition<RsaStepState> = {
  meta,
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'p',
      label: 'Prime p',
      type: 'text',
      default: '61',
      help: 'A prime number (kept secret).',
    },
    {
      key: 'q',
      label: 'Prime q',
      type: 'text',
      default: '53',
      help: 'A different prime (kept secret).',
    },
    {
      key: 'e',
      label: 'Public exponent e',
      type: 'text',
      default: '17',
      help: 'Coprime with φ(n) = (p−1)(q−1).',
    },
  ],
  run,
  Visualizer: RsaVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: 'Hi', params: { p: '61', q: '53', e: '17' }, direction: 'encrypt' },
};

export default rsa;
