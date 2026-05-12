#!/usr/bin/env node
/**
 * Verifies locale blocks in src/i18n/runtime.ts contain exactly the keys from EN
 * (no missing, no duplicate). Requires object-style TranslationMap entries.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME = path.join(__dirname, '..', 'src', 'i18n', 'runtime.ts');

const LOCALES = ['nl', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'];

/** @returns {number} index of matching `}` for `{` at openBraceIdx */
function indexOfMatchingBrace(src, openBraceIdx) {
  let depth = 0;
  let inStr = null;
  let escape = false;

  for (let i = openBraceIdx; i < src.length; i++) {
    const c = src[i];

    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\' && inStr !== '`') {
        escape = true;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }

    if (c === "'" || c === '"' || c === '`') {
      inStr = c;
      continue;
    }

    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}

/**
 * Collect translation keys in source order. Keys must appear as `'key':` at
 * line start with the given indent (spaces only).
 * @param {string} body
 * @param {number} indentSpaces
 * @returns {{ ordered: string[], duplicates: Map<string, number[]> }}
 */
function collectKeys(body, indentSpaces) {
  const prefix = ' '.repeat(indentSpaces);
  const keyLine = new RegExp(`^${prefix}'((?:\\\\'|[^'])*)':`);
  const ordered = [];
  /** @type {Map<string, number[]>} */
  const linesByKey = new Map();

  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//')) continue;

    const m = line.match(keyLine);
    if (!m) continue;

    const key = m[1].replace(/\\'/g, "'");
    ordered.push(key);
    const list = linesByKey.get(key) ?? [];
    list.push(i + 1);
    linesByKey.set(key, list);
  }

  /** @type {Map<string, number[]>} */
  const duplicates = new Map();
  for (const [key, lineNums] of linesByKey) {
    if (lineNums.length > 1) duplicates.set(key, lineNums);
  }

  return { ordered, duplicates };
}

function main() {
  const src = fs.readFileSync(RUNTIME, 'utf8');

  const enMarker = 'const EN: TranslationMap = {';
  const enStart = src.indexOf(enMarker);
  if (enStart === -1) {
    console.error(`check-i18n-parity: could not find ${enMarker}`);
    process.exit(1);
  }

  const openEn = src.indexOf('{', enStart);
  const closeEn = indexOfMatchingBrace(src, openEn);
  if (closeEn === -1) {
    console.error('check-i18n-parity: unterminated EN object');
    process.exit(1);
  }

  const enBody = src.slice(openEn + 1, closeEn);
  const { ordered: enOrdered, duplicates: enDupes } = collectKeys(enBody, 2);

  if (enDupes.size > 0) {
    console.error('check-i18n-parity: duplicate keys in EN:\n');
    for (const [key, lines] of [...enDupes.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      console.error(`  ${key} (lines ${lines.join(', ')})`);
    }
    process.exit(1);
  }

  /** @type {{ locale: string; missing: string[]; duplicates: Map<string, number[]> }[]} */
  const problems = [];
  let dupProblems = false;

  for (const loc of LOCALES) {
    const marker = `\n  ${loc}: {`;
    const blockStart = src.indexOf(marker);
    if (blockStart === -1) {
      problems.push({
        locale: loc,
        missing: [...enOrdered],
        duplicates: new Map(),
      });
      continue;
    }

    const open = src.indexOf('{', blockStart);
    const close = indexOfMatchingBrace(src, open);
    if (close === -1) {
      console.error(`check-i18n-parity: unterminated block for ${loc}`);
      process.exit(1);
    }

    const body = src.slice(open + 1, close);
    const { ordered: locOrdered, duplicates: locDupes } = collectKeys(body, 4);
    const locSet = new Set(locOrdered);
    const missing = enOrdered.filter((k) => !locSet.has(k));

    if (locDupes.size > 0) {
      dupProblems = true;
      problems.push({ locale: loc, missing, duplicates: locDupes });
      continue;
    }

    if (missing.length > 0) {
      problems.push({ locale: loc, missing, duplicates: new Map() });
    }
  }

  if (!dupProblems && problems.length === 0) {
    console.log(
      `check-i18n-parity: OK (${enOrdered.length} keys; ${LOCALES.length} locales)`,
    );
    process.exit(0);
  }

  if (dupProblems) {
    console.error('check-i18n-parity: duplicate keys inside locale(s):\n');
    for (const p of problems) {
      if (p.duplicates.size === 0) continue;
      console.error(`  ${p.locale}:`);
      for (const [key, lines] of [...p.duplicates.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      )) {
        console.error(`    - ${key} (lines ${lines.join(', ')})`);
      }
      console.error('');
    }
  }

  const missingGroups = problems.filter((p) => p.missing.length > 0);
  if (missingGroups.length > 0) {
    console.error('check-i18n-parity: missing keys by locale:\n');
    for (const p of missingGroups) {
      console.error(`  ${p.locale} (${p.missing.length}):`);
      for (const k of p.missing) {
        console.error(`    - ${k}`);
      }
      console.error('');
    }
  }

  process.exit(1);
}

main();
