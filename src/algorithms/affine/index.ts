import type { AlgorithmDefinition } from '@/core/types';
import { content } from './content';
import { run, type AffineStepState } from './engine';
import { AffineVisualizer } from './Visualizer';

const affine: AlgorithmDefinition<AffineStepState> = {
  meta: {
    id: 'affine',
    name: 'Affine Cipher',
    category: 'classical',
    difficulty: 2,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'a',
      label: 'a (multiplier)',
      type: 'int',
      default: 5,
      help: 'Must be coprime with 26.',
    },
    {
      key: 'b',
      label: 'b (shift)',
      type: 'int',
      min: 0,
      max: 25,
      default: 8,
      help: 'Any value 0–25.',
    },
  ],
  run,
  Visualizer: AffineVisualizer,
  sample: { input: 'Affine Cipher', params: { a: 5, b: 8 }, direction: 'encrypt' },
};

export default affine;
