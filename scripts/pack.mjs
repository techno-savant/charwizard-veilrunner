#!/usr/bin/env node

import { ClassicLevel } from '../node_modules/classic-level/index.js';
import { readdir, readFile, rm, mkdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

const PACKS = [
  'vr-species', 'vr-origins', 'vr-backgrounds', 'vr-archetypes',
  'vr-classes',  'vr-disciplines', 'vr-skills', 'vr-trees',
];

const DEFAULT_ICONS = {
  species:    'icons/svg/mystery-man.svg',
  origin:     'icons/svg/globe.svg',
  background: 'icons/svg/book.svg',
  archetype:  'icons/svg/shield.svg',
  class:      'icons/svg/sword.svg',
  subclass:   'icons/svg/d20-highlight.svg',
  skill:      'icons/svg/lightning.svg',
  feature:    'icons/svg/runes.svg',
};

for (const packName of PACKS) {
  const srcDir = join(root, 'packs', '_source', packName);
  const outDir = join(root, 'packs', packName);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const db = new ClassicLevel(outDir, { valueEncoding: 'utf8' });
  await db.open();

  const files = (await readdir(srcDir)).filter(f => f.endsWith('.json'));
  const batch = db.batch();

  for (const file of files) {
    const raw = await readFile(join(srcDir, file), 'utf8');
    const doc = JSON.parse(raw);
    // Generated pack entries still point at unfinished module art, so normalize them to stable defaults.
    const defaultIcon = DEFAULT_ICONS[doc.type];
    const imgIsBroken = !doc.img
      || doc.img === 'icons/svg/item-bag.svg'
      || doc.img.startsWith('modules/charwizard-veilrunner/art/');
    if (defaultIcon && imgIsBroken) {
      doc.img = defaultIcon;
    }
    batch.put(`!items!${doc._id}`, JSON.stringify(doc));
  }

  await batch.write();
  await db.close();
  console.log(`✓  ${packName.padEnd(20)} ${files.length} items`);
}

console.log('\nDone.');
