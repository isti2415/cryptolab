import { pythonSample, tsEngine } from '@/core/code';
import type { AlgorithmDefinition } from '@/core/types';
import { meta } from './meta';
import engineCode from './engine.ts?code';
import pythonCode from './code/enigma.py?code';
import { content } from './content';
import { run, type EnigmaStepState } from './engine';
import { EnigmaVisualizer } from './Visualizer';

const enigma: AlgorithmDefinition<EnigmaStepState> = {
  meta,
  content,
  // The reflector makes the machine its own inverse, so there is nothing to switch.
  supportsDecrypt: false,
  params: [
    {
      key: 'rotors',
      label: 'Rotors (left to right)',
      type: 'text',
      default: 'I II III',
      help: 'Three different rotors from I–V.',
    },
    {
      key: 'reflector',
      label: 'Reflector',
      type: 'select',
      default: 'B',
      options: [
        { value: 'B', label: 'UKW-B' },
        { value: 'C', label: 'UKW-C' },
      ],
      help: 'The component that makes the machine self-inverse.',
    },
    {
      key: 'positions',
      label: 'Window letters',
      type: 'text',
      default: 'AAA',
      help: 'Starting rotor positions, left to right.',
    },
    {
      key: 'rings',
      label: 'Ring settings',
      type: 'text',
      default: 'AAA',
      help: 'Ringstellung; offsets the wiring from the window letter.',
    },
    {
      key: 'plugboard',
      label: 'Plugboard',
      type: 'text',
      default: 'AV BS CG DL FU HZ IN KM OW RX',
      placeholder: 'AB CD EF',
      help: 'Up to 13 letter pairs. Leave empty for none.',
    },
  ],
  run,
  Visualizer: EnigmaVisualizer,
  code: [pythonSample(pythonCode), tsEngine(engineCode)],
  sample: {
    input: 'ATTACKATDAWN',
    params: {
      rotors: 'I II III',
      reflector: 'B',
      positions: 'AAA',
      rings: 'AAA',
      plugboard: 'AV BS CG DL FU HZ IN KM OW RX',
    },
    direction: 'encrypt',
  },
};

export default enigma;
