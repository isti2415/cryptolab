import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/otp.py?code';
import { content } from './content';
import { run, type OtpStepState } from './engine';
import { OtpVisualizer } from './Visualizer';

const otp: AlgorithmDefinition<OtpStepState> = {
  meta,
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
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: { input: 'HELLO', params: { pad: 'XMCKLZURPAQ' }, direction: 'encrypt' },
};

export default otp;
