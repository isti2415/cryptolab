import type { AlgorithmDefinition } from '@/core/types';
import { content } from './content';
import { run, type OtpStepState } from './engine';
import { OtpVisualizer } from './Visualizer';

const otp: AlgorithmDefinition<OtpStepState> = {
  meta: {
    id: 'otp',
    name: 'One-Time Pad',
    category: 'classical',
    era: '1917',
    difficulty: 2,
  },
  content,
  supportsDecrypt: true,
  params: [
    {
      key: 'pad',
      label: 'Pad (key)',
      type: 'text',
      default: 'XMCKLZURPAQ',
      placeholder: 'random letters ≥ message length',
      help: 'Random letters, at least as long as the message, used once.',
    },
  ],
  run,
  Visualizer: OtpVisualizer,
  sample: { input: 'HELLO', params: { pad: 'XMCKLZURPAQ' }, direction: 'encrypt' },
};

export default otp;
