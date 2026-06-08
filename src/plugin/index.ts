import type { WizardPlugin } from '@charwizard-core/types/index';
import { creationSteps } from './steps.js';
import { outputMapper } from './mapper.js';
import { onCreate, onAdvance } from './lifecycle.js';
import { deriveState } from './deriveState.js';

export const veilrunnerPlugin: WizardPlugin = {
  systemId: 'Veilrunner-System',
  displayName: 'Veilrunner',
  compatibleSystemVersion: '>=0.3.0',

  creationSteps,
  advancementSteps: [],

  initialState: () => ({
    'persona.autonomy': 0,
    'persona.empathy':  0,
    'persona.legality': 0,
  }),

  outputMapper,
  onCreate,
  onAdvance,
  deriveState,

  layout: 'bg3',
  theme: 'obsidian',
};
