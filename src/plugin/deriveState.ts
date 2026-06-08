// payloadFields land under each selected document's `_data.payload` object.
const ATTR_KEYS = [
  'strength', 'body', 'constitution', 'agility', 'dexterity', 'reaction',
  'intelligence', 'willpower', 'wisdom', 'focus',
  'logic', 'resonance',
  'charisma', 'intuition', 'presence',
] as const;

function countSelected(values: Record<string, unknown>, key: string): number {
  const val = values[key];
  if (Array.isArray(val)) return val.length;
  if (typeof val === 'string' && val.length > 0) return 1;
  return 0;
}

function readPayloadNumber(
  values: Record<string, unknown>,
  dataKey: string,
  payloadKey: string,
): number {
  const data = values[dataKey];
  if (typeof data !== 'object' || data === null) return 0;
  const payload = (data as Record<string, unknown>)['payload'];
  if (typeof payload !== 'object' || payload === null) return 0;
  const val = (payload as Record<string, unknown>)[payloadKey];
  return typeof val === 'number' ? val : 0;
}

export function deriveState(
  values: Record<string, unknown>,
): Partial<Record<string, unknown>> {
  const bgBonus    = readPayloadNumber(values, 'background.choice._data', 'system_bonusSkills');
  const classBonus = readPayloadNumber(values, 'archetype.class._data',   'system_bonusSkills');
  const skillCount = 4 + bgBonus + classBonus;
  const skillsPicked = countSelected(values, 'skills.choice');

  const treeCount = 1;
  const treesPicked = countSelected(values, 'trees.choice');

  const speciesBonus = readPayloadNumber(values, 'species.choice._data', 'system_attrBonus');
  const attrBudget = 30 + speciesBonus;

  let attrSpent = 0;
  for (const attr of ATTR_KEYS) {
    const val = values[`attributes.scores.${attr}`];
    const score = typeof val === 'number' ? val : 1;
    attrSpent += Math.max(0, score - 1);
  }
  const attrRemaining = attrBudget - attrSpent;

  return {
    skillCount,
    skillsPicked,
    treeCount,
    treesPicked,
    attrBudget,
    attrRemaining,
  };
}
