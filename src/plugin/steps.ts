import type { WizardStep } from '@charwizard-core/types/index';

const PACKS = {
  species:     'charwizard-veilrunner.vr-species',
  origins:     'charwizard-veilrunner.vr-origins',
  backgrounds: 'charwizard-veilrunner.vr-backgrounds',
  archetypes:  'charwizard-veilrunner.vr-archetypes',
  classes:     'charwizard-veilrunner.vr-classes',
  disciplines: 'charwizard-veilrunner.vr-disciplines',
  skills:      'charwizard-veilrunner.vr-skills',
  trees:       'charwizard-veilrunner.vr-trees',
} as const;

const ATTR_SLOTS = [
  { id: 'strength',     label: 'Strength'     },
  { id: 'body',         label: 'Body'         },
  { id: 'constitution', label: 'Constitution' },
  { id: 'agility',      label: 'Agility'      },
  { id: 'dexterity',    label: 'Dexterity'    },
  { id: 'reaction',     label: 'Reaction'     },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'willpower',    label: 'Willpower'    },
  { id: 'wisdom',       label: 'Wisdom'       },
  { id: 'focus',        label: 'Focus'        },
  { id: 'logic',        label: 'Logic'        },
  { id: 'resonance',    label: 'Resonance'    },
  { id: 'charisma',     label: 'Charisma'     },
  { id: 'insight',      label: 'Insight'      },
  { id: 'presence',     label: 'Presence'     },
].map((s) => ({ ...s, base: 1, min: 1, max: 5 }));

function entityFieldMap(descPath: string): import('@charwizard-core/types/index').CompendiumFieldMap {
  return {
    description: descPath,
    tagline: 'flags.charwizard.wizard.tagline',
    heroImg: 'flags.charwizard.wizard.heroImg',
    tags: {},
    payloadFields: ['system.bonusSkills', 'system.attrBonus', 'system.classKey', 'system.archetype', 'system.grants'],
  };
}

export const creationSteps: WizardStep[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    variant: 'welcome',
    fields: [],
    helpText: 'Step into the Veil. Define who you are before the run begins.',
  },

  {
    id: 'species',
    label: 'Species',
    variant: 'cinematic-selection',
    fields: [
      {
        id: 'choice',
        label: 'Species',
        type: 'selection',
        required: true,
        dataSource: {
          type: 'compendium',
          packs: [PACKS.species],
          itemType: 'species',
          fieldMap: entityFieldMap('system.description'),
        },
      },
    ],
  },

  {
    id: 'origin',
    label: 'Origin',
    variant: 'card-grid',
    fields: [
      {
        id: 'choice',
        label: 'Origin',
        type: 'selection',
        required: true,
        dataSource: {
          type: 'compendium',
          packs: [PACKS.origins],
          itemType: 'origin',
          fieldMap: entityFieldMap('system.description'),
        },
      },
    ],
  },

  {
    id: 'background',
    label: 'Background',
    variant: 'card-grid',
    fields: [
      {
        id: 'choice',
        label: 'Background',
        type: 'selection',
        required: true,
        dataSource: {
          type: 'compendium',
          packs: [PACKS.backgrounds],
          itemType: 'background',
          fieldMap: entityFieldMap('system.description'),
        },
      },
    ],
  },

  // These filters rely on the source packs storing archetype and class links as document IDs.
  {
    id: 'archetype',
    label: 'Class',
    variant: 'tiered-selection',
    fields: [
      {
        id: 'role',
        label: 'Archetype',
        type: 'selection',
        required: true,
        dataSource: {
          type: 'compendium',
          packs: [PACKS.archetypes],
          itemType: 'archetype',
          fieldMap: entityFieldMap('system.description'),
        },
      },
      {
        id: 'class',
        label: 'Class',
        type: 'selection',
        required: true,
        dataSource: {
          type: 'compendium',
          packs: [PACKS.classes],
          itemType: 'class',
          filterByField: { stateKey: 'archetype.role', docPath: 'system.archetype' },
          reloadOn: ['archetype.role'],
          fieldMap: entityFieldMap('system.description'),
        },
      },
      {
        id: 'discipline',
        label: 'Discipline',
        type: 'selection',
        required: true,
        dataSource: {
          type: 'compendium',
          packs: [PACKS.disciplines],
          itemType: 'subclass',
          filterByField: { stateKey: 'archetype.class', docPath: 'system.parentClass' },
          reloadOn: ['archetype.class'],
          fieldMap: entityFieldMap('system.description'),
        },
      },
    ],
  },

  {
    id: 'attributes',
    label: 'Attributes',
    variant: 'allocation',
    fields: [
      {
        id: 'scores',
        label: 'Attributes',
        type: 'allocation',
        budgetSource: { $ref: 'attrBudget' },
        slots: ATTR_SLOTS,
      },
    ],
    crossFieldRules: [
      {
        message: 'You must spend all available attribute points.',
        condition: { type: 'eq', field: 'attrRemaining', value: 0 },
      },
    ],
  },

  {
    id: 'skills',
    label: 'Skills',
    variant: 'card-grid',
    fields: [
      {
        id: 'choice',
        label: 'Starting Skills',
        type: 'selection',
        required: false,
        maxSelections: 8,
        dataSource: {
          type: 'compendium',
          packs: [PACKS.skills],
          itemType: 'skill',
          fieldMap: {
            description: 'system.description',
            tags: { 'Group': 'system.group', 'Attribute': 'system.usesattribute' },
            payloadFields: ['system.group', 'system.usesattribute'],
          },
        },
      },
    ],
    crossFieldRules: [
      {
        message: 'Select at least your required number of starting skills.',
        condition: { type: 'gte', field: 'skillsPicked', value: { $ref: 'skillCount' } },
      },
    ],
  },

  {
    id: 'trees',
    label: 'Starting Talent',
    variant: 'card-grid',
    fields: [
      {
        id: 'choice',
        label: 'Starting Talent',
        type: 'selection',
        required: true,
        maxSelections: 1,
        dataSource: {
          type: 'compendium',
          packs: [PACKS.trees],
          itemType: 'feature',
          filterByField: { stateKey: 'archetype.role', docPath: 'system.archetype' },
          filterBy: { 'system.tier': 1 },
          reloadOn: ['archetype.role'],
          fieldMap: {
            description: 'system.description',
            tags: { 'Tree': 'system.treeName', 'Tier': 'system.tier' },
            payloadFields: ['system.treeType', 'system.treeName'],
          },
        },
      },
    ],
  },

  {
    id: 'persona',
    label: 'Persona Index',
    variant: 'form',
    fields: [
      {
        id: 'autonomy',
        label: 'Autonomy',
        type: 'number',
        min: -10,
        max: 10,
        step: 1,
        hint: 'Autonomous (−10) to Institutional (+10)',
      },
      {
        id: 'empathy',
        label: 'Empathy',
        type: 'number',
        min: -10,
        max: 10,
        step: 1,
        hint: 'Ruthless (−10) to Empathetic (+10)',
      },
      {
        id: 'legality',
        label: 'Legality',
        type: 'number',
        min: -10,
        max: 10,
        step: 1,
        hint: 'Criminal (−10) to Lawful (+10)',
      },
    ],
  },

  {
    id: 'details',
    label: 'Details',
    variant: 'form',
    fields: [
      {
        id: 'name',
        label: 'Character Name',
        type: 'text',
        required: true,
        maxLength: 64,
        placeholder: 'Enter your character\'s name',
      },
      {
        id: 'pronouns',
        label: 'Pronouns',
        type: 'select',
        required: false,
        options: [
          { value: 'she/her',   label: 'She / Her'   },
          { value: 'he/him',    label: 'He / Him'    },
          { value: 'they/them', label: 'They / Them' },
          { value: 'any',       label: 'Any'         },
          { value: 'custom',    label: 'Custom'      },
        ],
      },
      {
        id: 'pronounsCustom',
        label: 'Custom Pronouns',
        type: 'text',
        required: false,
        maxLength: 32,
        placeholder: 'e.g. xe/xem',
        condition: { type: 'eq', field: 'details.pronouns', value: 'custom' },
      },
      {
        id: 'background_detail',
        label: 'Character Background',
        type: 'richtext',
        required: false,
        rows: 5,
        placeholder: 'Who is your character before the run?',
      },
    ],
  },
];
