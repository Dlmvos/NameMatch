/**
 * Verify bundled core meaning translations coverage and quality.
 */
import path from 'node:path';

import { ALL_NAMES } from '../src/data/names';
import coreMeaningTranslations from '../src/data/coreMeaningTranslations.json';
import {
  BUNDLE_MEANING_LOCALES,
  endsWithAnyLocaleTag,
  isBlankOrUnknownMeaning,
  meaningEqualsEnglish,
} from './lib/bundledMeaningTranslationPipeline';

const CORE_PATH = path.join(process.cwd(), 'src', 'data', 'coreMeaningTranslations.json');

function main(): void {
  const core = coreMeaningTranslations as Record<string, Record<string, string>>;
  const expectedIds = ALL_NAMES.map((n) => n.id).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  let missingLocale = 0;
  let badPlaceholder = 0;
  let tagSuffix = 0;
  let englishDupLatin = 0;
  const problems: string[] = [];

  for (const id of expectedIds) {
    const name = ALL_NAMES.find((n) => n.id === id);
    const en = (name?.meaning ?? '').trim();
    const row = core[id];
    if (!row) {
      problems.push(`Missing entry for id ${id}`);
      missingLocale += BUNDLE_MEANING_LOCALES.length;
      continue;
    }
    for (const loc of BUNDLE_MEANING_LOCALES) {
      const v = row[loc];
      if (v === undefined || v === null || String(v).trim() === '') {
        missingLocale += 1;
        problems.push(`${id} missing locale ${loc}`);
        continue;
      }
      const t = String(v).trim();
      if (isBlankOrUnknownMeaning(t)) {
        badPlaceholder += 1;
        problems.push(`${id} ${loc}: blank/unknown`);
      }
      if (endsWithAnyLocaleTag(t) || /\[(?:nl|de|fr|es|it|pt|zh|ja|ko|ar)\]/i.test(t)) {
        tagSuffix += 1;
        problems.push(`${id} ${loc}: locale tag`);
      }
      if (meaningEqualsEnglish(t, en, loc)) {
        englishDupLatin += 1;
        problems.push(`${id} ${loc}: equals English`);
      }
    }
  }

  console.log(`Bundled names: ${expectedIds.length}`);
  console.log(`Core file: ${CORE_PATH}`);
  console.log(`Missing/empty locale cells: ${missingLocale}`);
  console.log(`Blank/unknown/n/a cells: ${badPlaceholder}`);
  console.log(`Bracket locale tag issues: ${tagSuffix}`);
  console.log(`Latin-script cells equal to English: ${englishDupLatin}`);

  const maxPrint = 40;
  if (problems.length > 0) {
    console.log(`\nFirst ${Math.min(maxPrint, problems.length)} issue(s):`);
    for (const p of problems.slice(0, maxPrint)) console.log(`  - ${p}`);
    if (problems.length > maxPrint) console.log(`  ... and ${problems.length - maxPrint} more`);
  }

  const ok =
    missingLocale === 0 && badPlaceholder === 0 && tagSuffix === 0 && englishDupLatin === 0;
  process.exit(ok ? 0 : 1);
}

main();
