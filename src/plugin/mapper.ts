import type {
  ActorCreationData,
  ActiveEffectCreationData,
  MapperContext,
  OutputMapper,
  SummaryRow,
  SummarySection,
  WizardMode,
} from '@charwizard-core/types/index';

const MODULE_ID = 'charwizard-veilrunner';

const ATTR_KEYS = [
  'strength', 'body', 'constitution', 'agility', 'dexterity', 'reaction',
  'intelligence', 'willpower', 'wisdom', 'focus',
  'logic', 'resonance',
  'charisma', 'insight', 'presence',
] as const;

function readPiAxis(values: Record<string, unknown>, key: string): number {
  const val = values[key];
  const n = typeof val === 'number' ? val : 0;
  return Math.max(-10, Math.min(10, Math.round(n)));
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function readSelectionLabel(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const label = (value as Record<string, unknown>)['label'];
  return typeof label === 'string' ? label : undefined;
}

// The wizard store keeps the selected compendium payload directly at `${step}.${field}._data`.
function readUuid(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const uuid = (value as Record<string, unknown>)['_uuid'];
  return typeof uuid === 'string' ? uuid : undefined;
}

function readAttrScore(values: Record<string, unknown>, attr: string): number {
  const val = values[`attributes.scores.${attr}`];
  return typeof val === 'number' ? Math.max(1, Math.round(val)) : 1;
}

// The Veilrunner prototype has no schema for Persona Index metadata yet, so this survives in flags.
function buildPersonaIndexEffect(
  autonomy: number,
  morality: number,
  legality: number,
): ActiveEffectCreationData {
  return {
    name: 'Persona Index',
    icon: 'modules/charwizard-veilrunner/art/icons/persona-index.webp',
    changes: [
      { key: 'flags.veilrunner.pi.autonomy', mode: 5, value: String(autonomy) },
      { key: 'flags.veilrunner.pi.empathy', mode: 5, value: String(morality) },
      { key: 'flags.veilrunner.pi.legality', mode: 5, value: String(legality) },
    ],
    disabled: false,
    flags: {
      [MODULE_ID]: { generated: true, type: 'personaIndex' },
    },
  };
}

function buildActorData(
  values: Record<string, unknown>,
  _derived: Record<string, unknown>,
  _context: MapperContext,
): ActorCreationData {
  const system: Record<string, unknown> = {};
  for (const attr of ATTR_KEYS) {
    system[attr] = { value: readAttrScore(values, attr) };
  }

  const autonomy = readPiAxis(values, 'persona.autonomy');
  const morality = readPiAxis(values, 'persona.empathy');
  const legality = readPiAxis(values, 'persona.legality');
  system['autonomylevel']    = autonomy;
  system['moralitylevel']    = morality;
  system['legalitylevel']    = legality;
  system['personalityindex'] = piLabel(autonomy, morality, legality);
  const piEffect = buildPersonaIndexEffect(autonomy, morality, legality);

  const flags: Record<string, unknown> = {
    [MODULE_ID]: {
      speciesUuid:     readUuid(values['species.choice._data']),
      originUuid:      readUuid(values['origin.choice._data']),
      backgroundUuid:  readUuid(values['background.choice._data']),
      archetypeUuid:   readUuid(values['archetype.role._data']),
      classUuid:       readUuid(values['archetype.class._data']),
      disciplineUuid:  readUuid(values['archetype.discipline._data']),
      skillUuids:      readStringArray(values['skills.choice'])
        .map((id) => {
          const data = values[`skills.choice._data.${id}`];
          return readUuid(data) ?? id;
        }),
      treeUuids:       readStringArray(values['trees.choice'])
        .map((id) => {
          const data = values[`trees.choice._data.${id}`];
          return readUuid(data) ?? id;
        }),
    },
  };

  return {
    name: readString(values['details.name']) ?? 'Unnamed Runner',
    type: 'hero',
    system,
    effects: [piEffect],
    flags,
  };
}

// The neutral/compound wording matches the Veilrunner Persona Index design language.
function piLabel(autonomy: number, empathy: number, legality: number): string {
  const a = autonomy < -3 ? 'Autonomous'   : autonomy > 3 ? 'Institutional' : 'Adaptive';
  const m = empathy  < -3 ? 'Ruthless'     : empathy  > 3 ? 'Empathetic'    : 'Neutral';
  const l = legality < -3 ? 'Criminal'     : legality > 3 ? 'Lawful'        : 'Neutral';
  const compound = (m === 'Neutral' && l === 'Neutral') ? 'True Neutral' : `${m} ${l}`;
  return `${a} ${compound}`;
}

export const outputMapper: OutputMapper = {
  map(
    values: Record<string, unknown>,
    derived: Record<string, unknown>,
    _mode: WizardMode,
    context: MapperContext,
  ): ActorCreationData {
    return buildActorData(values, derived, context);
  },

  summary(
    values: Record<string, unknown>,
    _derived: Record<string, unknown>,
  ): SummarySection[] {
    const attrRows: SummaryRow[] = ATTR_KEYS.map((attr) => ({
      label: attr.charAt(0).toUpperCase() + attr.slice(1),
      value: String(readAttrScore(values, attr)),
    }));

    const autonomy = readPiAxis(values, 'persona.autonomy');
    const morality = readPiAxis(values, 'persona.empathy');
    const legality = readPiAxis(values, 'persona.legality');

    return [
      {
        label: 'Identity',
        rows: [
          { label: 'Name',     value: readString(values['details.name']) ?? 'Unnamed Runner' },
          { label: 'Pronouns', value: readString(values['details.pronouns']) ?? '—' },
          { label: 'Species',  value: readSelectionLabel(values['species.choice._data'])  ?? '—' },
          { label: 'Origin',   value: readSelectionLabel(values['origin.choice._data'])   ?? '—' },
          { label: 'Background', value: readSelectionLabel(values['background.choice._data']) ?? '—' },
        ],
      },
      {
        label: 'Class',
        rows: [
          { label: 'Archetype',  value: readSelectionLabel(values['archetype.role._data'])       ?? '—' },
          { label: 'Class',      value: readSelectionLabel(values['archetype.class._data'])       ?? '—' },
          { label: 'Discipline', value: readSelectionLabel(values['archetype.discipline._data'])  ?? '—' },
        ],
      },
      {
        label: 'Attributes',
        rows: attrRows,
      },
      {
        label: 'Persona Index',
        rows: [
          { label: 'Autonomy', value: String(autonomy) },
          { label: 'Empathy',  value: String(morality) },
          { label: 'Legality', value: String(legality) },
          { label: 'Persona',  value: piLabel(autonomy, morality, legality) },
        ],
      },
    ];
  },
};
