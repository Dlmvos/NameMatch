/**
 * Merge generated CSV translations into src/data/coreMeaningTranslations.json.
 * Only overwrites cells that still qualify as missing/fake per shouldQueueTranslationJob;
 * re-validates each generated meaning before write.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { ALL_NAMES } from '../src/data/names';
import coreMeaningTranslations from '../src/data/coreMeaningTranslations.json';
import {
  BUNDLE_MEANING_LOCALES,
  shouldQueueTranslationJob,
  sortCoreMeaningJson,
  validateGeneratedMeaning,
} from './lib/bundledMeaningTranslationPipeline';

const DEFAULT_CSV = path.join(process.cwd(), 'data', 'bundled_meaning_translations.generated.csv');
const OUT_JSON = path.join(process.cwd(), 'src', 'data', 'coreMeaningTranslations.json');

function parseGeneratedCsvLine(line: string): { id: string; locale: string; meaning: string } | null {
  const t = line.trim();
  if (!t || t === 'id,locale,meaning') return null;
  const firstComma = t.indexOf(',');
  if (firstComma < 0) return null;
  const id = t.slice(0, firstComma);
  const rest = t.slice(firstComma + 1);
  const secondComma = rest.indexOf(',');
  if (secondComma < 0) return null;
  const locale = rest.slice(0, secondComma);
  let field = rest.slice(secondComma + 1).trim();
  if (!field.startsWith('"')) return null;
  field = field.slice(1);
  let meaning = '';
  for (let i = 0; i < field.length; i++) {
    const ch = field[i];
    if (ch === '"' && field[i + 1] === '"') {
      meaning += '"';
      i++;
      continue;
    }
    if (ch === '"') break;
    meaning += ch;
  }
  return { id, locale, meaning };
}

function main(): void {
  const csvPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_CSV;
  const raw = readFileSync(csvPath, 'utf8');

  const merged = JSON.parse(JSON.stringify(coreMeaningTranslations)) as Record<
    string,
    Record<string, string>
  >;
  const enById = new Map<string, string>(ALL_NAMES.map((n) => [n.id, (n.meaning ?? '').trim()]));

  let applied = 0;
  let skipped = 0;

  for (const line of raw.split('\n')) {
    const row = parseGeneratedCsvLine(line);
    if (!row) continue;
    const en = enById.get(row.id);
    if (!en) {
      skipped += 1;
      continue;
    }
    if (!(BUNDLE_MEANING_LOCALES as readonly string[]).includes(row.locale)) {
      skipped += 1;
      continue;
    }
    const existing = merged[row.id]?.[row.locale];
    if (!shouldQueueTranslationJob(existing, row.locale, en)) {
      skipped += 1;
      continue;
    }
    const v = validateGeneratedMeaning(row.meaning, row.locale, en);
    if (!v.ok) {
      skipped += 1;
      continue;
    }
    if (!merged[row.id]) merged[row.id] = {};
    merged[row.id][row.locale] = row.meaning.trim();
    applied += 1;
  }

  const sorted = sortCoreMeaningJson(merged);
  writeFileSync(OUT_JSON, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  console.log(`Merged ${applied} cell(s); skipped ${skipped}. Wrote ${OUT_JSON}`);
}

main();
