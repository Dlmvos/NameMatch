#!/usr/bin/env node
/**
 * CI guard: wrong-script strings in Latin locales; English placeholders in CJK swipe.card.* keys.
 * Parses src/i18n/runtime.ts (same object layout as check-i18n-parity.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME = path.join(__dirname, '..', 'src', 'i18n', 'runtime.ts');

const LATIN_LOCALES = ['en', 'nl', 'de', 'fr', 'es', 'it', 'pt'];
const CJK_LOCALES = ['ja', 'ko', 'zh', 'ar'];

/** locale → Set of keys allowed to contain non-Latin script (intentional loanwords / names). */
const SCRIPT_ALLOWLIST = {
  // Example: en: new Set(['some.key']),
};

const FOREIGN_SCRIPT_RE =
  /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u1100-\u11FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u;

const SWIPE_CARD_PREFIX = 'swipe.card.';
const PLACEHOLDER_TOKEN_RE = /\b(?:LOVE|SKIP|TODO|PLACEHOLDER)\b/;

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

function unescapeKey(raw) {
  return raw.replace(/\\'/g, "'");
}

function unescapeValue(raw) {
  return raw
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * @param {string} body
 * @param {number} keyIndentSpaces
 * @returns {{ key: string, value: string }[]}
 */
function collectEntries(body, keyIndentSpaces) {
  const keyPrefix = ' '.repeat(keyIndentSpaces);
  const valuePrefix = ' '.repeat(keyIndentSpaces + 2);
  const keyOnlyRe = new RegExp(`^${keyPrefix}'((?:\\\\'|[^'])*)':\\s*$`);
  const keyValueRe = new RegExp(
    `^${keyPrefix}'((?:\\\\'|[^'])*)':\\s*'((?:\\\\'|[^'\\\\]|\\\\.)*)'(?:,)?`,
  );
  const valueOnlyRe = new RegExp(
    `^${valuePrefix}'((?:\\\\'|[^'\\\\]|\\\\.)*)'(?:,)?`,
  );

  /** @type {{ key: string, value: string }[]} */
  const entries = [];
  const lines = body.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith('//')) continue;

    const inline = line.match(keyValueRe);
    if (inline) {
      entries.push({
        key: unescapeKey(inline[1]),
        value: unescapeValue(inline[2]),
      });
      continue;
    }

    const keyOnly = line.match(keyOnlyRe);
    if (keyOnly && i + 1 < lines.length) {
      const vm = lines[i + 1].match(valueOnlyRe);
      if (vm) {
        entries.push({
          key: unescapeKey(keyOnly[1]),
          value: unescapeValue(vm[1]),
        });
        i++;
      }
    }
  }

  return entries;
}

function isAllowlisted(locale, key) {
  const set = SCRIPT_ALLOWLIST[locale];
  return set?.has(key) ?? false;
}

function foreignScriptSnippet(value) {
  const m = value.match(FOREIGN_SCRIPT_RE);
  return m ? m[0] : '';
}

function checkLatinLocale(locale, entries) {
  /** @type {{ locale: string, key: string, value: string, reason: string }[]} */
  const violations = [];

  for (const { key, value } of entries) {
    if (isAllowlisted(locale, key)) continue;
    if (!FOREIGN_SCRIPT_RE.test(value)) continue;
    violations.push({
      locale,
      key,
      value,
      reason: `contains non-Latin script (e.g. ${foreignScriptSnippet(value)})`,
    });
  }

  return violations;
}

function checkCjkSwipeCard(locale, entries) {
  /** @type {{ locale: string, key: string, value: string, reason: string }[]} */
  const violations = [];

  for (const { key, value } of entries) {
    if (!key.startsWith(SWIPE_CARD_PREFIX)) continue;
    if (!PLACEHOLDER_TOKEN_RE.test(value)) continue;
    violations.push({
      locale,
      key,
      value,
      reason: 'swipe.card.* contains English placeholder token (LOVE|SKIP|TODO|PLACEHOLDER)',
    });
  }

  return violations;
}

function extractLocaleBlock(src, locale, keyIndent) {
  if (locale === 'en') {
    const enMarker = 'const EN: TranslationMap = {';
    const enStart = src.indexOf(enMarker);
    if (enStart === -1) return null;
    const open = src.indexOf('{', enStart);
    const close = indexOfMatchingBrace(src, open);
    if (close === -1) return null;
    return src.slice(open + 1, close);
  }

  const marker = `\n  ${locale}: {`;
  const blockStart = src.indexOf(marker);
  if (blockStart === -1) return null;
  const open = src.indexOf('{', blockStart);
  const close = indexOfMatchingBrace(src, open);
  if (close === -1) return null;
  return src.slice(open + 1, close);
}

function printViolations(violations) {
  console.error(`check-i18n-contamination: ${violations.length} violation(s)\n`);
  console.error('locale\tkey\tvalue');
  for (const v of violations) {
    const displayValue = v.value.replace(/\n/g, '\\n').replace(/\t/g, ' ');
    console.error(`${v.locale}\t${v.key}\t${displayValue}`);
  }
  console.error('');
  for (const v of violations) {
    console.error(`  [${v.locale}] ${v.key}: ${v.reason}`);
  }
}

function main() {
  const src = fs.readFileSync(RUNTIME, 'utf8');
  /** @type {{ locale: string, key: string, value: string, reason: string }[]} */
  const violations = [];

  for (const locale of LATIN_LOCALES) {
    const body = extractLocaleBlock(src, locale, locale === 'en' ? 2 : 4);
    if (body == null) {
      console.error(`check-i18n-contamination: missing block for ${locale}`);
      process.exit(1);
    }
    const indent = locale === 'en' ? 2 : 4;
    violations.push(...checkLatinLocale(locale, collectEntries(body, indent)));
  }

  for (const locale of CJK_LOCALES) {
    const body = extractLocaleBlock(src, locale, 4);
    if (body == null) {
      console.error(`check-i18n-contamination: missing block for ${locale}`);
      process.exit(1);
    }
    violations.push(...checkCjkSwipeCard(locale, collectEntries(body, 4)));
  }

  if (violations.length > 0) {
    printViolations(violations);
    process.exit(1);
  }

  const checked = LATIN_LOCALES.length + CJK_LOCALES.length;
  console.log(
    `check-i18n-contamination: OK (${checked} locales; Latin script guard + CJK swipe.card placeholders)`,
  );
  process.exit(0);
}

main();
