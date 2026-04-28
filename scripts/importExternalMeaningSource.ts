/**
 * Import external meaning sources into the openMeaningDictionary.json file.
 *
 * Supported formats:
 * 1. usBabyNames SQLite DB (from `npm install usbabynames`)
 *    → npx tsx scripts/importExternalMeaningSource.ts --usbabynames path/to/names.db
 *
 * 2. Behind the Name CSV export (from behindthename.com/api/download.php)
 *    → npx tsx scripts/importExternalMeaningSource.ts --behindthename path/to/names.csv
 *
 * 3. Generic CSV with columns: name, meaning, origin (optional: gender)
 *    → npx tsx scripts/importExternalMeaningSource.ts --csv path/to/file.csv
 *
 * 4. Generic JSON with: { "name": { "meaning": "...", "origin": "..." } } or array format
 *    → npx tsx scripts/importExternalMeaningSource.ts --json path/to/file.json
 *
 * After importing, run the enrichment pipeline:
 *    npx tsx scripts/buildMeaningEnrichmentBatch.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const DICT_PATH = path.join('scripts', 'data', 'openMeaningDictionary.json');

type DictEntry = { meaning: string; origin?: string };
type DictFile = {
  _meta: Record<string, unknown>;
  names: Record<string, DictEntry>;
};

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['']/g, '')
    .replace(/\s+/g, ' ');
}

function loadDictionary(): DictFile {
  if (!existsSync(DICT_PATH)) {
    return {
      _meta: {
        description: 'Curated baby name meanings from established etymological reference sources',
        license: 'Public domain facts — name etymologies are not copyrightable',
        version: '1.0.0',
        created: new Date().toISOString().slice(0, 10),
      },
      names: {},
    };
  }
  return JSON.parse(readFileSync(DICT_PATH, 'utf8')) as DictFile;
}

function saveDictionary(dict: DictFile, newCount: number, source: string): void {
  dict._meta.last_updated = new Date().toISOString().slice(0, 10);
  dict._meta.last_import_source = source;
  writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2) + '\n');
  console.log(`✓ Saved ${Object.keys(dict.names).length} total entries (${newCount} new) → ${DICT_PATH}`);
}

function isPlaceholder(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/national statistics/i.test(t)) return true;
  if (/^(unknown|n\/?a|none|null|\?|-+|\.+)$/i.test(t)) return true;
  if (t.length < 3) return true;
  return false;
}

// ── CSV import ──
function importCsv(filePath: string, dict: DictFile): number {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV file has no data rows');

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const nameCol = header.findIndex((h) => h === 'name' || h === 'first_name' || h === 'given_name');
  const meaningCol = header.findIndex((h) => h === 'meaning' || h === 'description' || h === 'definition');
  const originCol = header.findIndex((h) => h === 'origin' || h === 'language' || h === 'etymology');

  if (nameCol === -1) throw new Error(`No "name" column found. Headers: ${header.join(', ')}`);
  if (meaningCol === -1) throw new Error(`No "meaning" column found. Headers: ${header.join(', ')}`);

  let added = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const name = (cols[nameCol] ?? '').trim();
    const meaning = (cols[meaningCol] ?? '').trim().replace(/^["']|["']$/g, '');
    const origin = originCol >= 0 ? (cols[originCol] ?? '').trim().replace(/^["']|["']$/g, '') : '';

    if (!name || !meaning || isPlaceholder(meaning)) continue;

    const key = normalizeName(name);
    if (key in dict.names) continue; // don't overwrite existing

    dict.names[key] = { meaning, ...(origin ? { origin } : {}) };
    added++;
  }
  return added;
}

// ── JSON import ──
function importJson(filePath: string, dict: DictFile): number {
  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as
    | Record<string, { meaning?: string; origin?: string }>
    | Array<{ name?: string; meaning?: string; origin?: string }>;

  let added = 0;
  const entries = Array.isArray(raw)
    ? raw
    : Object.entries(raw).map(([name, val]) => ({ name, ...val }));

  for (const entry of entries) {
    const name = (entry as any).name;
    const meaning = (entry as any).meaning;
    const origin = (entry as any).origin;

    if (!name || !meaning || isPlaceholder(meaning)) continue;

    const key = normalizeName(name);
    if (key in dict.names) continue;

    dict.names[key] = { meaning, ...(origin ? { origin } : {}) };
    added++;
  }
  return added;
}

// ── Main ──
function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage:');
    console.log('  npx tsx scripts/importExternalMeaningSource.ts --csv path/to/file.csv');
    console.log('  npx tsx scripts/importExternalMeaningSource.ts --json path/to/file.json');
    console.log('  npx tsx scripts/importExternalMeaningSource.ts --behindthename path/to/names.csv');
    console.log('  npx tsx scripts/importExternalMeaningSource.ts --usbabynames path/to/names.db');
    process.exit(1);
  }

  const format = args[0];
  const filePath = args[1];

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const dict = loadDictionary();
  const beforeCount = Object.keys(dict.names).length;
  let added = 0;

  switch (format) {
    case '--csv':
    case '--behindthename':
      added = importCsv(filePath, dict);
      break;
    case '--json':
      added = importJson(filePath, dict);
      break;
    case '--usbabynames':
      console.log('SQLite import requires better-sqlite3. Install it first:');
      console.log('  npm install better-sqlite3');
      console.log('Then run: node -e "...' + '"');
      console.log('\nFor now, export to CSV first:');
      console.log('  sqlite3 names.db ".headers on" ".mode csv" "SELECT name, meaning, origin FROM names WHERE meaning IS NOT NULL" > meanings.csv');
      console.log('  npx tsx scripts/importExternalMeaningSource.ts --csv meanings.csv');
      process.exit(0);
      break;
    default:
      console.error(`Unknown format: ${format}. Use --csv, --json, --behindthename, or --usbabynames`);
      process.exit(1);
  }

  saveDictionary(dict, added, `${format}:${path.basename(filePath)}`);
  console.log(`\nNext step: npx tsx scripts/buildMeaningEnrichmentBatch.ts`);
}

main();
