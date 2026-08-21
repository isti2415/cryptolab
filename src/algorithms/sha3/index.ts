import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/sha3.py?code';
import { content } from './content';
import { run, type Sha3StepState } from './engine';
import { Sha3Visualizer } from './Visualizer';

const sha3: AlgorithmDefinition<Sha3StepState> = {
  meta,
  content,
  supportsDecrypt: false,
  params: [
    {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      default: 'sha3-256',
      options: [
        { value: 'sha3-256', label: 'SHA3-256' },
        { value: 'sha3-512', label: 'SHA3-512' },
        { value: 'shake128', label: 'SHAKE128 (32 bytes)' },
        { value: 'shake256', label: 'SHAKE256 (32 bytes)' },
      ],
      help: 'The variants differ only in rate and two padding bits.',
    },
  ],
  run,
  Visualizer: Sha3Visualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: 'abc', params: { variant: 'sha3-256' }, direction: 'encrypt' },
};

export default sha3;
