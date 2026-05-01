import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGET_LANGUAGES = ['nl', 'de', 'fr', 'es', 'ko'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const NAMES_FILE = path.join(REPO_ROOT, 'src/data/names.ts');
const OUTPUT_FILE = path.join(REPO_ROOT, 'src/data/coreMeaningTranslations.json');

const padId = (n) => String(n).padStart(8, '0');
const unescapeSingleQuoted = (value) => value.replace(/\\'/g, "'");
const placeholderTranslate = (meaning, language) => `${meaning} [${language}]`;

const nameEntryPattern =
  /id:\s*id\(\)\s*,\s*name:\s*'((?:\\'|[^'])*)'\s*,\s*meaning:\s*'((?:\\'|[^'])*)'/gms;

function extractNamesFromSource(source) {
  const extracted = [];
  let match;
  let idCounter = 1;

  while ((match = nameEntryPattern.exec(source)) !== null) {
    extracted.push({
      id: padId(idCounter++),
      name: unescapeSingleQuoted(match[1]),
      meaning: unescapeSingleQuoted(match[2]),
    });
  }

  return extracted;
}

async function readExistingMap() {
  try {
    const raw = await readFile(OUTPUT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function main() {
  const namesSource = await readFile(NAMES_FILE, 'utf8');
  const names = extractNamesFromSource(namesSource);
  const existingMap = await readExistingMap();
  const nextMap = { ...existingMap };

  for (const name of names) {
    const existingEntry = nextMap[name.id] ?? {};
    const nextEntry = { ...existingEntry };

    for (const language of TARGET_LANGUAGES) {
      const existingValue = typeof nextEntry[language] === 'string' ? nextEntry[language].trim() : '';
      if (!existingValue) {
        nextEntry[language] = placeholderTranslate(name.meaning, language);
      }
    }

    nextMap[name.id] = nextEntry;
  }

  await writeFile(OUTPUT_FILE, JSON.stringify(nextMap, null, 2) + '\n', 'utf8');
  console.log(
    `[generateMeaningTranslations] processed=${names.length} output=${path.relative(REPO_ROOT, OUTPUT_FILE)}`,
  );
}

main().catch((error) => {
  console.error('[generateMeaningTranslations] failed', error);
  process.exitCode = 1;
});
