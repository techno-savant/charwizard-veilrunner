import type { ActorAdvancementData, ActorCreationData } from '@charwizard-core/types/index';

const MODULE_ID = 'charwizard-veilrunner';

interface ModuleFlagData {
  speciesUuid:    string | undefined;
  originUuid:     string | undefined;
  backgroundUuid: string | undefined;
  archetypeUuid:  string | undefined;
  classUuid:      string | undefined;
  disciplineUuid: string | undefined;
  skillUuids:     string[];
  treeUuids:      string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function readModuleFlags(flags: Record<string, unknown> | undefined): ModuleFlagData {
  const empty: ModuleFlagData = {
    speciesUuid: undefined, originUuid: undefined, backgroundUuid: undefined,
    archetypeUuid: undefined, classUuid: undefined, disciplineUuid: undefined,
    skillUuids: [], treeUuids: [],
  };
  if (!flags || !isRecord(flags[MODULE_ID])) return empty;
  const mf = flags[MODULE_ID];
  return {
    speciesUuid:    readString(mf['speciesUuid']),
    originUuid:     readString(mf['originUuid']),
    backgroundUuid: readString(mf['backgroundUuid']),
    archetypeUuid:  readString(mf['archetypeUuid']),
    classUuid:      readString(mf['classUuid']),
    disciplineUuid: readString(mf['disciplineUuid']),
    skillUuids:     readStringArray(mf['skillUuids']),
    treeUuids:      readStringArray(mf['treeUuids']),
  };
}

function isCompendiumDoc(value: unknown): value is { toObject(): Record<string, unknown> } {
  return isRecord(value) && typeof value['toObject'] === 'function';
}

async function attachCompendiumItem(
  actor: Actor,
  label: string,
  uuid: string,
): Promise<void> {
  try {
    const doc = await fromUuid(uuid);
    if (!isCompendiumDoc(doc)) {
      console.warn(`[${MODULE_ID}] ${label}: fromUuid("${uuid}") returned no document.`);
      return;
    }
    await actor.createEmbeddedDocuments('Item', [doc.toObject()]);
  } catch (err: unknown) {
    console.error(`[${MODULE_ID}] Failed to attach ${label} from "${uuid}".`, err);
  }
}

async function applyAttributes(
  actor: Actor,
  system: Record<string, unknown>,
): Promise<void> {
  const ATTR_KEYS = [
    'strength', 'body', 'constitution', 'agility', 'dexterity', 'reaction',
    'intelligence', 'willpower', 'wisdom', 'focus',
    'logic', 'resonance', 'charisma', 'insight', 'presence',
  ];
  const update: Record<string, unknown> = {};
  for (const attr of ATTR_KEYS) {
    // The system schema stores each attribute under `.value`, not as a flat number.
    const entry = system[attr];
    const val = typeof entry === 'object' && entry !== null
      ? (entry as Record<string, unknown>)['value']
      : entry;
    if (typeof val === 'number') update[`system.${attr}.value`] = val;
  }
  const PI_FIELDS = ['autonomylevel', 'moralitylevel', 'legalitylevel', 'personalityindex'] as const;
  for (const field of PI_FIELDS) {
    const val = system[field];
    if (val !== undefined) update[`system.${field}`] = val;
  }
  if (Object.keys(update).length > 0) await actor.update(update);
}

export async function onCreate(actorData: ActorCreationData): Promise<Actor> {
  try {
    // skipWizard prevents module.ts from reopening the wizard during programmatic actor creation.
    const created = await Actor.createDocuments([actorData], { skipWizard: true });
    const actor = created[0];
    if (!actor) throw new Error(`[${MODULE_ID}] Actor.createDocuments returned nothing.`);

    const flags = actorData.flags;
    const mf = readModuleFlags(isRecord(flags) ? flags : undefined);

    const singles: Array<{ label: string; uuid: string | undefined }> = [
      { label: 'species',    uuid: mf.speciesUuid    },
      { label: 'origin',     uuid: mf.originUuid     },
      { label: 'background', uuid: mf.backgroundUuid },
      { label: 'archetype',  uuid: mf.archetypeUuid  },
      { label: 'class',      uuid: mf.classUuid      },
      { label: 'discipline', uuid: mf.disciplineUuid },
    ];
    for (const { label, uuid } of singles) {
      if (uuid) await attachCompendiumItem(actor, label, uuid);
    }
    for (const uuid of mf.skillUuids) {
      await attachCompendiumItem(actor, 'skill', uuid);
    }
    for (const uuid of mf.treeUuids) {
      await attachCompendiumItem(actor, 'tree talent', uuid);
    }

    if (isRecord(actorData.system)) {
      await applyAttributes(actor, actorData.system);
    }

    return actor;
  } catch (err: unknown) {
    console.error(`[${MODULE_ID}] Failed to create Veilrunner actor.`, err);
    throw err;
  }
}

export function onAdvance(_actor: Actor, _delta: ActorAdvancementData): Promise<void> {
  return Promise.resolve();
}

declare function fromUuid(uuid: string): Promise<unknown>;
