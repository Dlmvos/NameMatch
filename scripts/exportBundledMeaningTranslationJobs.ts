/**
 * Export translation jobs for bundled core meanings that are missing, placeholder, or English duplicates.
 *
 * Output: data/bundled_meaning_translation_jobs.jsonl (one JSON object per line: id, name, en_meaning, locale)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { ALL_NAMES } from '../src/data/names';
import coreMeaningTranslations from '../src/data/coreMeaningTranslations.json';
import {
  BUNDLE_MEANING_LOCALES,
  shouldQueueTranslationJob,
} from './lib/bundledMeaningTranslationPipeline';

const DEFAULT_OUT = path.join(process.cwd(), 'data', 'bundled_meaning_translation_jobs.jsonl');

function main(): void {
  const outPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_OUT;
  mkdirSync(path.dirname(outPath), { recursive: true });

  const translations = coreMeaningTranslations as Record<string, Record<string, string>>;
  const lines: string[] = [];

  for (const name of ALL_NAMES) {
    const id = name.id;
    const enMeaning = name.meaning?.trim() ?? '';
    const row = translations[id] ?? {};

    for (const locale of BUNDLE_MEANING_LOCALES) {
      const current = row[locale];
      if (!shouldQueueTranslationJob(current, locale, enMeaning)) continue;
      lines.push(
        JSON.stringify({
          id,
          name: name.name,
          en_meaning: enMeaning,
          locale,
        }),
      );
    }
  }

  writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${lines.length} job(s) to ${outPath}`);
}

main();
