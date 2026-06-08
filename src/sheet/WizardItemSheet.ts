const TEMPLATE = 'modules/charwizard-veilrunner/templates/wizard-item-sheet.hbs';

interface FoundryItemData {
  name: string;
  img: string;
  system: Record<string, unknown>;
  flags: Record<string, Record<string, unknown>>;
}

interface SheetData {
  item: FoundryItemData;
  data: FoundryItemData;
  editable: boolean;
  description: string;
  wizFlags: {
    tagline?: string;
    heroImg?: string;
    tags?: Record<string, string>;
  };
  hasTags: boolean;
}

declare class ItemSheet {
  static get defaultOptions(): Record<string, unknown>;
  getData(): Promise<{ item: FoundryItemData; data: FoundryItemData; editable: boolean }>;
}
declare namespace foundry {
  namespace utils {
    function mergeObject(a: unknown, b: unknown): Record<string, unknown>;
  }
}

export class WizardItemSheet extends ItemSheet {
  static override get defaultOptions(): Record<string, unknown> {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'item', 'wizard-item-sheet'],
      template: TEMPLATE,
      width: 640,
      height: 520,
    });
  }

  override async getData(): Promise<SheetData> {
    const base = await super.getData();
    const item = base.item;

    const rawFlags = item.flags?.['charwizard']?.['wizard'];
    const wiz = (rawFlags !== null && typeof rawFlags === 'object' && !Array.isArray(rawFlags))
      ? rawFlags as Record<string, unknown>
      : {};

    const rawTags = wiz['tags'];
    const tags = (rawTags !== null && typeof rawTags === 'object' && !Array.isArray(rawTags))
      ? rawTags as Record<string, string>
      : undefined;

    const wizFlags: SheetData['wizFlags'] = {};
    if (typeof wiz['tagline'] === 'string') wizFlags.tagline = wiz['tagline'];
    if (typeof wiz['heroImg'] === 'string')  wizFlags.heroImg  = wiz['heroImg'];
    if (tags !== undefined)                  wizFlags.tags     = tags;

    const rawDesc = item.system['description'];
    const description = typeof rawDesc === 'string' ? rawDesc : '';

    return {
      ...base,
      description,
      wizFlags,
      hasTags: tags !== undefined && Object.keys(tags).length > 0,
    };
  }
}
