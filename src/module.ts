import type { CharWizardAPI } from '@charwizard-core/types/index';
import { veilrunnerPlugin } from './plugin/index.js';
import { WizardItemSheet } from './sheet/WizardItemSheet.js';

const MODULE_ID = 'charwizard-veilrunner';
const CORE_MODULE_ID = 'charwizard-core';

function getCoreApi(): CharWizardAPI {
  const coreModule = game.modules.get(CORE_MODULE_ID);
  if (!coreModule?.api) {
    throw new Error(`[${MODULE_ID}] ${CORE_MODULE_ID} API unavailable. Ensure the core module is active.`);
  }
  return coreModule.api as CharWizardAPI;
}

const WIZARD_ITEM_TYPES = ['species', 'origin', 'background', 'archetype', 'class', 'subclass', 'feature'];

Hooks.on('init', () => {
  // @ts-expect-error — loadTemplates is a Foundry global not in our type stubs
  loadTemplates(['modules/charwizard-veilrunner/templates/wizard-item-sheet.hbs']);

  for (const type of WIZARD_ITEM_TYPES) {
    // @ts-expect-error — Items is a Foundry global not in our type stubs
    Items.registerSheet(MODULE_ID, WizardItemSheet, { types: [type], makeDefault: true, label: `Wizard Item (${type})` });
  }

  try {
    getCoreApi().register(veilrunnerPlugin.systemId, veilrunnerPlugin);
  } catch (err: unknown) {
    console.error(`[${MODULE_ID}] Failed to register Veilrunner plugin.`, err);
  }
});

Hooks.on('preCreateActor', (...args: unknown[]) => {
  const data    = args[1] as Record<string, unknown>;
  const options = args[2] as Record<string, unknown>;
  if (data['type'] !== 'hero') return;
  if (options['skipWizard']) return;

  // Capture the name the user typed in the Create Actor dialog so we can
  // pre-populate the wizard's name field, avoiding a double entry.
  const prefilledName = typeof data['name'] === 'string' ? data['name'] : undefined;
  const initialValues: Record<string, unknown> = {};
  if (prefilledName && prefilledName !== 'New Actor') {
    initialValues['details.name'] = prefilledName;
  }

  // Defer wizard launch to the next tick so the hook chain can complete its
  // return-false cancellation before the wizard opens.
  setTimeout(() => {
    try {
      getCoreApi().open({
        mode: 'create',
        systemId: veilrunnerPlugin.systemId,
        ...(Object.keys(initialValues).length > 0 ? { initialValues } : {}),
      });
    } catch (err: unknown) {
      console.error(`[${MODULE_ID}] Failed to open character wizard.`, err);
    }
  }, 0);

  return false;
});
