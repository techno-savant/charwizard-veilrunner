#!/usr/bin/env node

import { ClassicLevel } from '../node_modules/classic-level/index.js';
import { writeFile, rm, mkdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

const PACKS = [
  'vr-species', 'vr-origins', 'vr-backgrounds', 'vr-archetypes',
  'vr-classes',  'vr-disciplines', 'vr-skills', 'vr-trees',
];

for (const packName of PACKS) {
  const dbDir  = join(root, 'packs', packName);
  const outDir = join(root, 'packs', '_source', packName);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const db = new ClassicLevel(dbDir, { valueEncoding: 'utf8' });
  await db.open();

  let count = 0;
  for await (const [, value] of db.iterator()) {
    const doc  = JSON.parse(value);
    const name = (doc.name ?? doc._id).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await writeFile(join(outDir, `${name}.json`), JSON.stringify(doc, null, 2));
    count++;
  }

  await db.close();
  console.log(`✓  ${packName.padEnd(20)} ${count} items`);
}

console.log('\nDone.');
