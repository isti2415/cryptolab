import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/rc4.py?code';
import { content } from './content';
import { run, type Rc4StepState } from './engine';
import { Rc4Visualizer } from './Visualizer';

const rc4: AlgorithmDefinition<Rc4StepState> = {
  meta: {
    id: 'rc4',
    name: 'RC4',
    category: 'symmetric',
    era: '1987',
    difficulty: 3,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'key',
      label: 'Key',
      type: 'text',
      default: 'Key',
      placeholder: 'any text',
      help: 'Any length from 1 to 256 bytes; it is repeated across the schedule.',
    },
  ],
  run,
  Visualizer: Rc4Visualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: 'Plaintext', params: { key: 'Key' }, direction: 'encrypt' },
};

export default rc4;
