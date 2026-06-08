const PACKS = {
  species: "charwizard-veilrunner.vr-species",
  origins: "charwizard-veilrunner.vr-origins",
  backgrounds: "charwizard-veilrunner.vr-backgrounds",
  archetypes: "charwizard-veilrunner.vr-archetypes",
  classes: "charwizard-veilrunner.vr-classes",
  disciplines: "charwizard-veilrunner.vr-disciplines",
  skills: "charwizard-veilrunner.vr-skills",
  trees: "charwizard-veilrunner.vr-trees"
};
const ATTR_SLOTS = [
  { id: "strength", label: "Strength" },
  { id: "body", label: "Body" },
  { id: "constitution", label: "Constitution" },
  { id: "agility", label: "Agility" },
  { id: "dexterity", label: "Dexterity" },
  { id: "reaction", label: "Reaction" },
  { id: "intelligence", label: "Intelligence" },
  { id: "willpower", label: "Willpower" },
  { id: "wisdom", label: "Wisdom" },
  { id: "focus", label: "Focus" },
  { id: "logic", label: "Logic" },
  { id: "resonance", label: "Resonance" },
  { id: "charisma", label: "Charisma" },
  { id: "insight", label: "Insight" },
  { id: "presence", label: "Presence" }
].map((s) => ({ ...s, base: 1, min: 1, max: 5 }));
function entityFieldMap(descPath) {
  return {
    description: descPath,
    tagline: "flags.charwizard.wizard.tagline",
    heroImg: "flags.charwizard.wizard.heroImg",
    tags: {},
    payloadFields: ["system.bonusSkills", "system.attrBonus", "system.classKey", "system.archetype", "system.grants"]
  };
}
const creationSteps = [
  {
    id: "welcome",
    label: "Welcome",
    variant: "welcome",
    fields: [],
    helpText: "Step into the Veil. Define who you are before the run begins."
  },
  {
    id: "species",
    label: "Species",
    variant: "cinematic-selection",
    fields: [
      {
        id: "choice",
        label: "Species",
        type: "selection",
        required: true,
        dataSource: {
          type: "compendium",
          packs: [PACKS.species],
          itemType: "species",
          fieldMap: entityFieldMap("system.description")
        }
      }
    ]
  },
  {
    id: "origin",
    label: "Origin",
    variant: "card-grid",
    fields: [
      {
        id: "choice",
        label: "Origin",
        type: "selection",
        required: true,
        dataSource: {
          type: "compendium",
          packs: [PACKS.origins],
          itemType: "origin",
          fieldMap: entityFieldMap("system.description")
        }
      }
    ]
  },
  {
    id: "background",
    label: "Background",
    variant: "card-grid",
    fields: [
      {
        id: "choice",
        label: "Background",
        type: "selection",
        required: true,
        dataSource: {
          type: "compendium",
          packs: [PACKS.backgrounds],
          itemType: "background",
          fieldMap: entityFieldMap("system.description")
        }
      }
    ]
  },
  // These filters rely on the source packs storing archetype and class links as document IDs.
  {
    id: "archetype",
    label: "Class",
    variant: "tiered-selection",
    fields: [
      {
        id: "role",
        label: "Archetype",
        type: "selection",
        required: true,
        dataSource: {
          type: "compendium",
          packs: [PACKS.archetypes],
          itemType: "archetype",
          fieldMap: entityFieldMap("system.description")
        }
      },
      {
        id: "class",
        label: "Class",
        type: "selection",
        required: true,
        dataSource: {
          type: "compendium",
          packs: [PACKS.classes],
          itemType: "class",
          filterByField: { stateKey: "archetype.role", docPath: "system.archetype" },
          reloadOn: ["archetype.role"],
          fieldMap: entityFieldMap("system.description")
        }
      },
      {
        id: "discipline",
        label: "Discipline",
        type: "selection",
        required: true,
        dataSource: {
          type: "compendium",
          packs: [PACKS.disciplines],
          itemType: "subclass",
          filterByField: { stateKey: "archetype.class", docPath: "system.parentClass" },
          reloadOn: ["archetype.class"],
          fieldMap: entityFieldMap("system.description")
        }
      }
    ]
  },
  {
    id: "attributes",
    label: "Attributes",
    variant: "allocation",
    fields: [
      {
        id: "scores",
        label: "Attributes",
        type: "allocation",
        budgetSource: { $ref: "attrBudget" },
        slots: ATTR_SLOTS
      }
    ],
    crossFieldRules: [
      {
        message: "You must spend all available attribute points.",
        condition: { type: "eq", field: "attrRemaining", value: 0 }
      }
    ]
  },
  {
    id: "skills",
    label: "Skills",
    variant: "card-grid",
    fields: [
      {
        id: "choice",
        label: "Starting Skills",
        type: "selection",
        required: false,
        maxSelections: 8,
        dataSource: {
          type: "compendium",
          packs: [PACKS.skills],
          itemType: "skill",
          fieldMap: {
            description: "system.description",
            tags: { "Group": "system.group", "Attribute": "system.usesattribute" },
            payloadFields: ["system.group", "system.usesattribute"]
          }
        }
      }
    ],
    crossFieldRules: [
      {
        message: "Select at least your required number of starting skills.",
        condition: { type: "gte", field: "skillsPicked", value: { $ref: "skillCount" } }
      }
    ]
  },
  {
    id: "trees",
    label: "Starting Talent",
    variant: "card-grid",
    fields: [
      {
        id: "choice",
        label: "Starting Talent",
        type: "selection",
        required: true,
        maxSelections: 1,
        dataSource: {
          type: "compendium",
          packs: [PACKS.trees],
          itemType: "feature",
          filterByField: { stateKey: "archetype.role", docPath: "system.archetype" },
          filterBy: { "system.tier": 1 },
          reloadOn: ["archetype.role"],
          fieldMap: {
            description: "system.description",
            tags: { "Tree": "system.treeName", "Tier": "system.tier" },
            payloadFields: ["system.treeType", "system.treeName"]
          }
        }
      }
    ]
  },
  {
    id: "persona",
    label: "Persona Index",
    variant: "form",
    fields: [
      {
        id: "autonomy",
        label: "Autonomy",
        type: "number",
        min: -10,
        max: 10,
        step: 1,
        hint: "Autonomous (−10) to Institutional (+10)"
      },
      {
        id: "empathy",
        label: "Empathy",
        type: "number",
        min: -10,
        max: 10,
        step: 1,
        hint: "Ruthless (−10) to Empathetic (+10)"
      },
      {
        id: "legality",
        label: "Legality",
        type: "number",
        min: -10,
        max: 10,
        step: 1,
        hint: "Criminal (−10) to Lawful (+10)"
      }
    ]
  },
  {
    id: "details",
    label: "Details",
    variant: "form",
    fields: [
      {
        id: "name",
        label: "Character Name",
        type: "text",
        required: true,
        maxLength: 64,
        placeholder: "Enter your character's name"
      },
      {
        id: "pronouns",
        label: "Pronouns",
        type: "select",
        required: false,
        options: [
          { value: "she/her", label: "She / Her" },
          { value: "he/him", label: "He / Him" },
          { value: "they/them", label: "They / Them" },
          { value: "any", label: "Any" },
          { value: "custom", label: "Custom" }
        ]
      },
      {
        id: "pronounsCustom",
        label: "Custom Pronouns",
        type: "text",
        required: false,
        maxLength: 32,
        placeholder: "e.g. xe/xem",
        condition: { type: "eq", field: "details.pronouns", value: "custom" }
      },
      {
        id: "background_detail",
        label: "Character Background",
        type: "richtext",
        required: false,
        rows: 5,
        placeholder: "Who is your character before the run?"
      }
    ]
  }
];
const MODULE_ID$2 = "charwizard-veilrunner";
const ATTR_KEYS$1 = [
  "strength",
  "body",
  "constitution",
  "agility",
  "dexterity",
  "reaction",
  "intelligence",
  "willpower",
  "wisdom",
  "focus",
  "logic",
  "resonance",
  "charisma",
  "insight",
  "presence"
];
function readPiAxis(values, key) {
  const val = values[key];
  const n = typeof val === "number" ? val : 0;
  return Math.max(-10, Math.min(10, Math.round(n)));
}
function readString$1(value) {
  return typeof value === "string" ? value : void 0;
}
function readStringArray$1(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string");
}
function readSelectionLabel(value) {
  if (typeof value !== "object" || value === null) return void 0;
  const label = value["label"];
  return typeof label === "string" ? label : void 0;
}
function readUuid(value) {
  if (typeof value !== "object" || value === null) return void 0;
  const uuid = value["_uuid"];
  return typeof uuid === "string" ? uuid : void 0;
}
function readAttrScore(values, attr) {
  const val = values[`attributes.scores.${attr}`];
  return typeof val === "number" ? Math.max(1, Math.round(val)) : 1;
}
function buildPersonaIndexEffect(autonomy, morality, legality) {
  return {
    name: "Persona Index",
    icon: "modules/charwizard-veilrunner/art/icons/persona-index.webp",
    changes: [
      { key: "flags.veilrunner.pi.autonomy", mode: 5, value: String(autonomy) },
      { key: "flags.veilrunner.pi.empathy", mode: 5, value: String(morality) },
      { key: "flags.veilrunner.pi.legality", mode: 5, value: String(legality) }
    ],
    disabled: false,
    flags: {
      [MODULE_ID$2]: { generated: true, type: "personaIndex" }
    }
  };
}
function buildActorData(values, _derived, _context) {
  const system = {};
  for (const attr of ATTR_KEYS$1) {
    system[attr] = { value: readAttrScore(values, attr) };
  }
  const autonomy = readPiAxis(values, "persona.autonomy");
  const morality = readPiAxis(values, "persona.empathy");
  const legality = readPiAxis(values, "persona.legality");
  system["autonomylevel"] = autonomy;
  system["moralitylevel"] = morality;
  system["legalitylevel"] = legality;
  system["personalityindex"] = piLabel(autonomy, morality, legality);
  const piEffect = buildPersonaIndexEffect(autonomy, morality, legality);
  const flags = {
    [MODULE_ID$2]: {
      speciesUuid: readUuid(values["species.choice._data"]),
      originUuid: readUuid(values["origin.choice._data"]),
      backgroundUuid: readUuid(values["background.choice._data"]),
      archetypeUuid: readUuid(values["archetype.role._data"]),
      classUuid: readUuid(values["archetype.class._data"]),
      disciplineUuid: readUuid(values["archetype.discipline._data"]),
      skillUuids: readStringArray$1(values["skills.choice"]).map((id) => {
        const data = values[`skills.choice._data.${id}`];
        return readUuid(data) ?? id;
      }),
      treeUuids: readStringArray$1(values["trees.choice"]).map((id) => {
        const data = values[`trees.choice._data.${id}`];
        return readUuid(data) ?? id;
      })
    }
  };
  return {
    name: readString$1(values["details.name"]) ?? "Unnamed Runner",
    type: "hero",
    system,
    effects: [piEffect],
    flags
  };
}
function piLabel(autonomy, empathy, legality) {
  const a = autonomy < -3 ? "Autonomous" : autonomy > 3 ? "Institutional" : "Adaptive";
  const m = empathy < -3 ? "Ruthless" : empathy > 3 ? "Empathetic" : "Neutral";
  const l = legality < -3 ? "Criminal" : legality > 3 ? "Lawful" : "Neutral";
  const compound = m === "Neutral" && l === "Neutral" ? "True Neutral" : `${m} ${l}`;
  return `${a} ${compound}`;
}
const outputMapper = {
  map(values, derived, _mode, context) {
    return buildActorData(values);
  },
  summary(values, _derived) {
    const attrRows = ATTR_KEYS$1.map((attr) => ({
      label: attr.charAt(0).toUpperCase() + attr.slice(1),
      value: String(readAttrScore(values, attr))
    }));
    const autonomy = readPiAxis(values, "persona.autonomy");
    const morality = readPiAxis(values, "persona.empathy");
    const legality = readPiAxis(values, "persona.legality");
    return [
      {
        label: "Identity",
        rows: [
          { label: "Name", value: readString$1(values["details.name"]) ?? "Unnamed Runner" },
          { label: "Pronouns", value: readString$1(values["details.pronouns"]) ?? "—" },
          { label: "Species", value: readSelectionLabel(values["species.choice._data"]) ?? "—" },
          { label: "Origin", value: readSelectionLabel(values["origin.choice._data"]) ?? "—" },
          { label: "Background", value: readSelectionLabel(values["background.choice._data"]) ?? "—" }
        ]
      },
      {
        label: "Class",
        rows: [
          { label: "Archetype", value: readSelectionLabel(values["archetype.role._data"]) ?? "—" },
          { label: "Class", value: readSelectionLabel(values["archetype.class._data"]) ?? "—" },
          { label: "Discipline", value: readSelectionLabel(values["archetype.discipline._data"]) ?? "—" }
        ]
      },
      {
        label: "Attributes",
        rows: attrRows
      },
      {
        label: "Persona Index",
        rows: [
          { label: "Autonomy", value: String(autonomy) },
          { label: "Empathy", value: String(morality) },
          { label: "Legality", value: String(legality) },
          { label: "Persona", value: piLabel(autonomy, morality, legality) }
        ]
      }
    ];
  }
};
const MODULE_ID$1 = "charwizard-veilrunner";
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readString(value) {
  return typeof value === "string" ? value : void 0;
}
function readStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string");
}
function readModuleFlags(flags) {
  const empty = {
    speciesUuid: void 0,
    originUuid: void 0,
    backgroundUuid: void 0,
    archetypeUuid: void 0,
    classUuid: void 0,
    disciplineUuid: void 0,
    skillUuids: [],
    treeUuids: []
  };
  if (!flags || !isRecord(flags[MODULE_ID$1])) return empty;
  const mf = flags[MODULE_ID$1];
  return {
    speciesUuid: readString(mf["speciesUuid"]),
    originUuid: readString(mf["originUuid"]),
    backgroundUuid: readString(mf["backgroundUuid"]),
    archetypeUuid: readString(mf["archetypeUuid"]),
    classUuid: readString(mf["classUuid"]),
    disciplineUuid: readString(mf["disciplineUuid"]),
    skillUuids: readStringArray(mf["skillUuids"]),
    treeUuids: readStringArray(mf["treeUuids"])
  };
}
function isCompendiumDoc(value) {
  return isRecord(value) && typeof value["toObject"] === "function";
}
async function attachCompendiumItem(actor, label, uuid) {
  try {
    const doc = await fromUuid(uuid);
    if (!isCompendiumDoc(doc)) {
      console.warn(`[${MODULE_ID$1}] ${label}: fromUuid("${uuid}") returned no document.`);
      return;
    }
    await actor.createEmbeddedDocuments("Item", [doc.toObject()]);
  } catch (err) {
    console.error(`[${MODULE_ID$1}] Failed to attach ${label} from "${uuid}".`, err);
  }
}
async function applyAttributes(actor, system) {
  const ATTR_KEYS2 = [
    "strength",
    "body",
    "constitution",
    "agility",
    "dexterity",
    "reaction",
    "intelligence",
    "willpower",
    "wisdom",
    "focus",
    "logic",
    "resonance",
    "charisma",
    "insight",
    "presence"
  ];
  const update = {};
  for (const attr of ATTR_KEYS2) {
    const entry = system[attr];
    const val = typeof entry === "object" && entry !== null ? entry["value"] : entry;
    if (typeof val === "number") update[`system.${attr}.value`] = val;
  }
  const PI_FIELDS = ["autonomylevel", "moralitylevel", "legalitylevel", "personalityindex"];
  for (const field of PI_FIELDS) {
    const val = system[field];
    if (val !== void 0) update[`system.${field}`] = val;
  }
  if (Object.keys(update).length > 0) await actor.update(update);
}
async function onCreate(actorData) {
  try {
    const created = await Actor.createDocuments([actorData], { skipWizard: true });
    const actor = created[0];
    if (!actor) throw new Error(`[${MODULE_ID$1}] Actor.createDocuments returned nothing.`);
    const flags = actorData.flags;
    const mf = readModuleFlags(isRecord(flags) ? flags : void 0);
    const singles = [
      { label: "species", uuid: mf.speciesUuid },
      { label: "origin", uuid: mf.originUuid },
      { label: "background", uuid: mf.backgroundUuid },
      { label: "archetype", uuid: mf.archetypeUuid },
      { label: "class", uuid: mf.classUuid },
      { label: "discipline", uuid: mf.disciplineUuid }
    ];
    for (const { label, uuid } of singles) {
      if (uuid) await attachCompendiumItem(actor, label, uuid);
    }
    for (const uuid of mf.skillUuids) {
      await attachCompendiumItem(actor, "skill", uuid);
    }
    for (const uuid of mf.treeUuids) {
      await attachCompendiumItem(actor, "tree talent", uuid);
    }
    if (isRecord(actorData.system)) {
      await applyAttributes(actor, actorData.system);
    }
    return actor;
  } catch (err) {
    console.error(`[${MODULE_ID$1}] Failed to create Veilrunner actor.`, err);
    throw err;
  }
}
function onAdvance(_actor, _delta) {
  return Promise.resolve();
}
const ATTR_KEYS = [
  "strength",
  "body",
  "constitution",
  "agility",
  "dexterity",
  "reaction",
  "intelligence",
  "willpower",
  "wisdom",
  "focus",
  "logic",
  "resonance",
  "charisma",
  "intuition",
  "presence"
];
function countSelected(values, key) {
  const val = values[key];
  if (Array.isArray(val)) return val.length;
  if (typeof val === "string" && val.length > 0) return 1;
  return 0;
}
function readPayloadNumber(values, dataKey, payloadKey) {
  const data = values[dataKey];
  if (typeof data !== "object" || data === null) return 0;
  const payload = data["payload"];
  if (typeof payload !== "object" || payload === null) return 0;
  const val = payload[payloadKey];
  return typeof val === "number" ? val : 0;
}
function deriveState(values) {
  const bgBonus = readPayloadNumber(values, "background.choice._data", "system_bonusSkills");
  const classBonus = readPayloadNumber(values, "archetype.class._data", "system_bonusSkills");
  const skillCount = 4 + bgBonus + classBonus;
  const skillsPicked = countSelected(values, "skills.choice");
  const treeCount = 1;
  const treesPicked = countSelected(values, "trees.choice");
  const speciesBonus = readPayloadNumber(values, "species.choice._data", "system_attrBonus");
  const attrBudget = 30 + speciesBonus;
  let attrSpent = 0;
  for (const attr of ATTR_KEYS) {
    const val = values[`attributes.scores.${attr}`];
    const score = typeof val === "number" ? val : 1;
    attrSpent += Math.max(0, score - 1);
  }
  const attrRemaining = attrBudget - attrSpent;
  return {
    skillCount,
    skillsPicked,
    treeCount,
    treesPicked,
    attrBudget,
    attrRemaining
  };
}
const veilrunnerPlugin = {
  systemId: "Veilrunner-System",
  displayName: "Veilrunner",
  compatibleSystemVersion: ">=0.3.0",
  creationSteps,
  advancementSteps: [],
  initialState: () => ({
    "persona.autonomy": 0,
    "persona.empathy": 0,
    "persona.legality": 0
  }),
  outputMapper,
  onCreate,
  onAdvance,
  deriveState,
  layout: "bg3",
  theme: "obsidian"
};
const TEMPLATE = "modules/charwizard-veilrunner/templates/wizard-item-sheet.hbs";
class WizardItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "item", "wizard-item-sheet"],
      template: TEMPLATE,
      width: 640,
      height: 520
    });
  }
  async getData() {
    const base = await super.getData();
    const item = base.item;
    const rawFlags = item.flags?.["charwizard"]?.["wizard"];
    const wiz = rawFlags !== null && typeof rawFlags === "object" && !Array.isArray(rawFlags) ? rawFlags : {};
    const rawTags = wiz["tags"];
    const tags = rawTags !== null && typeof rawTags === "object" && !Array.isArray(rawTags) ? rawTags : void 0;
    const wizFlags = {};
    if (typeof wiz["tagline"] === "string") wizFlags.tagline = wiz["tagline"];
    if (typeof wiz["heroImg"] === "string") wizFlags.heroImg = wiz["heroImg"];
    if (tags !== void 0) wizFlags.tags = tags;
    const rawDesc = item.system["description"];
    const description = typeof rawDesc === "string" ? rawDesc : "";
    return {
      ...base,
      description,
      wizFlags,
      hasTags: tags !== void 0 && Object.keys(tags).length > 0
    };
  }
}
const MODULE_ID = "charwizard-veilrunner";
const CORE_MODULE_ID = "charwizard-core";
function getCoreApi() {
  const coreModule = game.modules.get(CORE_MODULE_ID);
  if (!coreModule?.api) {
    throw new Error(`[${MODULE_ID}] ${CORE_MODULE_ID} API unavailable. Ensure the core module is active.`);
  }
  return coreModule.api;
}
const WIZARD_ITEM_TYPES = ["species", "origin", "background", "archetype", "class", "subclass", "feature"];
Hooks.on("init", () => {
  loadTemplates(["modules/charwizard-veilrunner/templates/wizard-item-sheet.hbs"]);
  for (const type of WIZARD_ITEM_TYPES) {
    Items.registerSheet(MODULE_ID, WizardItemSheet, { types: [type], makeDefault: true, label: `Wizard Item (${type})` });
  }
  try {
    getCoreApi().register(veilrunnerPlugin.systemId, veilrunnerPlugin);
  } catch (err) {
    console.error(`[${MODULE_ID}] Failed to register Veilrunner plugin.`, err);
  }
});
Hooks.on("preCreateActor", (...args) => {
  const data = args[1];
  const options = args[2];
  if (data["type"] !== "hero") return;
  if (options["skipWizard"]) return;
  const prefilledName = typeof data["name"] === "string" ? data["name"] : void 0;
  const initialValues = {};
  if (prefilledName && prefilledName !== "New Actor") {
    initialValues["details.name"] = prefilledName;
  }
  setTimeout(() => {
    try {
      getCoreApi().open({
        mode: "create",
        systemId: veilrunnerPlugin.systemId,
        ...Object.keys(initialValues).length > 0 ? { initialValues } : {}
      });
    } catch (err) {
      console.error(`[${MODULE_ID}] Failed to open character wizard.`, err);
    }
  }, 0);
  return false;
});
//# sourceMappingURL=charwizard-veilrunner.js.map
