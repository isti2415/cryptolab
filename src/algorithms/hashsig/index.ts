import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import engineCode from './engine.ts?code';
import pythonCode from './code/hashsig.py?code';
import { content } from './content';
import { run, type HashSigStepState } from './engine';
import { HashSigVisualizer } from './Visualizer';

const hashsig: AlgorithmDefinition<HashSigStepState> = {
  meta: {
    id: 'hash-signatures',
    name: 'Hash-Based Signatures',
    category: 'pqc',
    era: '1979',
    difficulty: 5,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'seed',
      label: 'Key seed',
      type: 'text',
      default: 'cryptolab',
      help: 'Derives all eight one-time key pairs and the root.',
    },
    {
      key: 'leaf',
      label: 'One-time key index',
      type: 'int',
      min: 0,
      max: 7,
      default: 3,
      help: 'Each may be used for exactly one signature.',
    },
  ],
  run,
  Visualizer: HashSigVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: 'attack at dawn',
    params: { seed: 'cryptolab', leaf: 3 },
    direction: 'encrypt',
  },
};

export default hashsig;
