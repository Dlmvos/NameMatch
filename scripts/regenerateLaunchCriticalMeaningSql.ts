import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SQL_PATH = path.join('scripts', 'data', 'meaning-enrichment', 'launch-critical-meaning-updates.sql');

const UPDATE_REGEX =
  /UPDATE baby_names SET meaning = ('(?:''|[^'])*'), meaning_source = ('(?:''|[^'])*'), meaning_confidence = ([0-9.]+)\s+WHERE (?:name = |lower\(name\) = lower\()('(?:''|[^'])*')\)? AND gender = ('(?:''|[^'])*') AND (?:meaning IS NULL|\(meaning IS NULL OR btrim\(meaning\) = ''\))(?:\s+AND meaning_verified IS DISTINCT FROM true)?;/gi;

function main(): void {
  const raw = readFileSync(SQL_PATH, 'utf8');
  let updates = 0;

  const regenerated = raw.replace(
    UPDATE_REGEX,
    (_match, meaning, meaningSource, meaningConfidence, name, gender) => {
      updates += 1;
      return [
        `UPDATE baby_names SET meaning = ${meaning}, meaning_source = ${meaningSource}, meaning_confidence = ${meaningConfidence}`,
        `  WHERE lower(name) = lower(${name}) AND gender = ${gender}`,
        "    AND (meaning IS NULL OR btrim(meaning) = '')",
        '    AND meaning_verified IS DISTINCT FROM true;',
      ].join('\n');
    },
  );

  if (updates === 0) {
    throw new Error(`No launch-critical updates found in ${SQL_PATH}`);
  }

  writeFileSync(SQL_PATH, regenerated);
  console.log(`Regenerated ${SQL_PATH} with ${updates} case-insensitive updates.`);
}

main();
