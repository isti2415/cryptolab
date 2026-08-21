import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/sha256.py?code';
import { content } from './content';
import { run, type Sha256StepState } from './engine';
import { Sha256Visualizer } from './Visualizer';

const sha256: AlgorithmDefinition<Sha256StepState> = {
  meta,
  content,
  supportsDecrypt: false,
  params: [],
  run,
  Visualizer: Sha256Visualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: 'abc', params: {}, direction: 'encrypt' },
};

export default sha256;
