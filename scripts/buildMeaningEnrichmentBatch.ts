/**
 * Build safe meaning-enrichment outputs from existing curated meanings only.
 *
 * No meanings are invented. Non-empty target meanings are never overwritten.
 *
 * Outputs:
 * - scripts/data/meaning-enrichment/baby-name-meaning-updates.jsonl
 * - scripts/data/meaning-enrichment/baby-name-meaning-updates.csv
 * - scripts/data/meaning-enrichment/unmatched-review-queue.csv
 * - scripts/data/meaning-enrichment/coverage-report.json
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { ALL_NAMES } from '../src/data/names';
import type { BabyName } from '../src/types';
import { bulkImportUuid } from './lib/bulkBabyNameImport';
import { PREMIUM_BUNDLED_LEGACY_NAMES } from './premiumBundledLegacy.names';

type MeaningSource = 'core_bundled' | 'premium_bundled_legacy' | 'supabase_seed' | 'local_batch' | 'external_dictionary';

type DictionaryEntry = {
  normalizedName: string;
  displayName: string;
  gender: string | null;
  meaning: string;
  origin: string | null;
  source: MeaningSource;
  sourceDetail: string;
  sourcePriority: number;
};

type TargetName = {
  id: string;
  name: string;
  normalizedName: string;
  compactName: string;
  gender: string | null;
  country: string | null;
  region: string | null;
  origin: string | null;
  existingMeaning: string | null;
  popularityRank: number | null;
  isPremium: boolean;
  sourceFile: string;
  sourceLine: number;
};

type EnrichmentUpdate = {
  id: string;
  name: string;
  normalized_name: string;
  country: string | null;
  region: string | null;
  gender: string | null;
  meaning: string;
  meaning_source: string;
  meaning_confidence: number;
  meaning_verified: boolean;
  meaning_language: 'en';
  match_type: 'normalized_exact' | 'compact_variant';
  source_file: string;
  source_line: number;
  priority_bucket: string;
  popularity_rank: number | null;
};

const OUTPUT_DIR = path.join('scripts', 'data', 'meaning-enrichment');
const DEFAULT_BATCH_DIR = path.join('scripts', 'data', 'batches');
const CORE_DECK_NORMALIZED_NAMES = new Set(ALL_NAMES.map((name) => normalizeName(name.name)));
const SCREENSHOT_DEMO_NAMES: BabyName[] = [
  { id: 'screenshot-demo-noah', name: 'Noah', meaning: 'Rest; comfort', origin: 'Hebrew', gender: 'boy', region: 'EU', is_worldwide: true },
  { id: 'screenshot-demo-aurelia', name: 'Aurelia', meaning: 'Golden; radiant', origin: 'Latin', gender: 'girl', region: 'EU', is_worldwide: true },
  { id: 'screenshot-demo-mateo', name: 'Mateo', meaning: 'Gift of God', origin: 'Spanish', gender: 'boy', region: 'EU', is_worldwide: true },
  { id: 'screenshot-demo-livia', name: 'Livia', meaning: 'Graceful; blue', origin: 'Roman', gender: 'girl', region: 'EU', is_worldwide: true },
  { id: 'screenshot-demo-elio', name: 'Elio', meaning: 'Sun', origin: 'Italian', gender: 'boy', region: 'EU', is_worldwide: true },
];
const SCREENSHOT_DEMO_NORMALIZED_NAMES = new Set(SCREENSHOT_DEMO_NAMES.map((name) => normalizeName(name.name)));
const PREMIUM_VISIBLE_NORMALIZED_NAMES = new Set(PREMIUM_BUNDLED_LEGACY_NAMES.map((name) => normalizeName(name.name)));

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ');
}

function compactVariant(normalizedName: string): string {
  return normalizedName.replace(/[\s.-]/g, '');
}

function cleanMeaning(meaning: unknown): string | null {
  if (typeof meaning !== 'string') return null;
  const trimmed = meaning.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function addDictionaryEntry(
  entries: DictionaryEntry[],
  name: string,
  gender: unknown,
  meaning: unknown,
  origin: unknown,
  source: MeaningSource,
  sourceDetail: string,
  sourcePriority: number,
): void {
  const clean = cleanMeaning(meaning);
  if (!clean) return;
  entries.push({
    normalizedName: normalizeName(name),
    displayName: name,
    gender: cleanText(gender)?.toLowerCase() ?? null,
    meaning: clean,
    origin: cleanText(origin),
    source,
    sourceDetail,
    sourcePriority,
  });
}

function parseSeedSqlEntries(entries: DictionaryEntry[]): void {
  const seedPath = path.join('supabase', 'seed.sql');
  let raw = '';
  try {
    raw = readFileSync(seedPath, 'utf8');
  } catch {
    return;
  }

  const tupleRegex = /\('([^']+(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)'/g;
  let match: RegExpExecArray | null;
  while ((match = tupleRegex.exec(raw)) !== null) {
    addDictionaryEntry(
      entries,
      match[1].replace(/''/g, "'"),
      null,
      match[2].replace(/''/g, "'"),
      match[3].replace(/''/g, "'"),
      'supabase_seed',
      seedPath,
      3,
    );
  }
}

/**
 * Load external meaning dictionaries (JSON format).
 * Expected schema: { "names": { "normalized_name": { "meaning": "...", "origin": "..." } } }
 * Priority 4 = lower confidence than curated sources but higher coverage.
 */
const EXTERNAL_DICT_DIR = path.join('scripts', 'data');
const EXTERNAL_DICT_FILES = ['openMeaningDictionary.json'];

function parseExternalDictionaries(entries: DictionaryEntry[]): number {
  let loaded = 0;
  for (const file of EXTERNAL_DICT_FILES) {
    const filePath = path.join(EXTERNAL_DICT_DIR, file);
    let raw = '';
    try {
      raw = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const parsed = JSON.parse(raw) as { names?: Record<string, { meaning?: string; origin?: string }> };
    if (!parsed.names) continue;
    for (const [name, entry] of Object.entries(parsed.names)) {
      if (!entry.meaning) continue;
      addDictionaryEntry(
        entries,
        name,
        null, // external dictionaries are gender-neutral lookups
        entry.meaning,
        entry.origin ?? null,
        'external_dictionary',
        `${file}:${name}`,
        4,
      );
      loaded += 1;
    }
  }
  return loaded;
}

function listJsonlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listJsonlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      out.push(full);
    }
  }
  return out.sort();
}

function readJsonlObjects(filePath: string): Array<{ row: Record<string, unknown>; line: number }> {
  const raw = readFileSync(filePath, 'utf8');
  const rows: Array<{ row: Record<string, unknown>; line: number }> = [];
  raw.split(/\r?\n/).forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    rows.push({ row: parsed, line: idx + 1 });
  });
  return rows;
}

function buildDictionary(targetFiles: string[]): {
  byNormalizedGender: Map<string, DictionaryEntry | 'ambiguous'>;
  byCompactGender: Map<string, DictionaryEntry | 'ambiguous'>;
  byNormalizedName: Map<string, DictionaryEntry | 'ambiguous'>;
  byCompactName: Map<string, DictionaryEntry | 'ambiguous'>;
  count: number;
  ambiguousCount: number;
} {
  const entries: DictionaryEntry[] = [];

  for (const n of ALL_NAMES) {
    addDictionaryEntry(entries, n.name, n.gender, n.meaning, n.origin, 'core_bundled', 'src/data/names.ts', 1);
  }
  for (const n of PREMIUM_BUNDLED_LEGACY_NAMES) {
    addDictionaryEntry(entries, n.name, n.gender, n.meaning, n.origin, 'premium_bundled_legacy', 'scripts/premiumBundledLegacy.names.ts', 0);
  }
  parseSeedSqlEntries(entries);
  const externalCount = parseExternalDictionaries(entries);

  for (const file of targetFiles) {
    for (const { row, line } of readJsonlObjects(file)) {
      const name = cleanText(row.name);
      const meaning = cleanMeaning(row.meaning);
      if (!name || !meaning) continue;
      addDictionaryEntry(entries, name, row.gender, meaning, row.origin, 'local_batch', `${file}:${line}`, 2);
    }
  }

  const byNormalizedGender = collapseDictionary(entries, (e) => genderedKey(e.normalizedName, e.gender));
  const byCompactGender = collapseDictionary(entries, (e) => genderedKey(compactVariant(e.normalizedName), e.gender));
  const byNormalizedName = collapseDictionary(entries, (e) => e.normalizedName);
  const byCompactName = collapseDictionary(entries, (e) => compactVariant(e.normalizedName));
  return {
    byNormalizedGender,
    byCompactGender,
    byNormalizedName,
    byCompactName,
    count: entries.length,
    ambiguousCount:
      [...byNormalizedGender.values()].filter((v) => v === 'ambiguous').length +
      [...byCompactGender.values()].filter((v) => v === 'ambiguous').length +
      [...byNormalizedName.values()].filter((v) => v === 'ambiguous').length +
      [...byCompactName.values()].filter((v) => v === 'ambiguous').length,
  };
}

function collapseDictionary(
  entries: DictionaryEntry[],
  keyFn: (entry: DictionaryEntry) => string | null,
): Map<string, DictionaryEntry | 'ambiguous'> {
  const grouped = new Map<string, DictionaryEntry[]>();
  for (const entry of entries) {
    const key = keyFn(entry);
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }

  const collapsed = new Map<string, DictionaryEntry | 'ambiguous'>();
  for (const [key, group] of grouped) {
    const meanings = new Set(group.map((entry) => entry.meaning.toLowerCase()));
    if (meanings.size > 1) {
      collapsed.set(key, 'ambiguous');
      continue;
    }
    collapsed.set(
      key,
      [...group].sort((a, b) => a.sourcePriority - b.sourcePriority)[0],
    );
  }
  return collapsed;
}

function genderedKey(normalizedName: string, gender: string | null): string | null {
  if (!gender) return null;
  return `${normalizedName}|${gender}`;
}

function lookupDictionaryEntry(
  target: TargetName,
  dictionary: ReturnType<typeof buildDictionary>,
): { entry: DictionaryEntry | 'ambiguous' | undefined; matchType: EnrichmentUpdate['match_type']; confidence: number } {
  const targetGender = target.gender?.toLowerCase() ?? null;
  const normalizedGenderKey = genderedKey(target.normalizedName, targetGender);
  const compactGenderKey = genderedKey(target.compactName, targetGender);

  if (normalizedGenderKey) {
    const entry = dictionary.byNormalizedGender.get(normalizedGenderKey);
    if (entry) return { entry, matchType: 'normalized_exact', confidence: 0.95 };
  }
  if (compactGenderKey) {
    const entry = dictionary.byCompactGender.get(compactGenderKey);
    if (entry) return { entry, matchType: 'compact_variant', confidence: 0.85 };
  }

  // Name-only fallback: use for neutral/unknown targets at higher confidence,
  // and for gendered targets at lower confidence (catches external dictionary entries
  // that are gender-agnostic — e.g. "emma" meaning "whole; universal" regardless of gender).
  const exact = dictionary.byNormalizedName.get(target.normalizedName);
  if (exact) {
    const conf = (!targetGender || targetGender === 'neutral') ? 0.8 : 0.7;
    return { entry: exact, matchType: 'normalized_exact', confidence: conf };
  }
  const compact = dictionary.byCompactName.get(target.compactName);
  if (compact) {
    const conf = (!targetGender || targetGender === 'neutral') ? 0.75 : 0.65;
    return { entry: compact, matchType: 'compact_variant', confidence: conf };
  }

  return { entry: undefined, matchType: 'normalized_exact', confidence: 0 };
}

function parseTargetRows(files: string[]): TargetName[] {
  const targets: TargetName[] = [];
  for (const file of files) {
    for (const { row, line } of readJsonlObjects(file)) {
      const name = cleanText(row.name);
      if (!name) continue;
      const externalId = cleanText(row.external_id);
      const id = cleanText(row.id) ?? (externalId ? bulkImportUuid(externalId) : null);
      if (!id) continue;
      const normalizedName = normalizeName(name);
      targets.push({
        id,
        name,
        normalizedName,
        compactName: compactVariant(normalizedName),
        gender: cleanText(row.gender),
        country: cleanText(row.country),
        region: cleanText(row.region),
        origin: cleanText(row.origin),
        existingMeaning: cleanMeaning(row.meaning),
        popularityRank: typeof row.popularity_rank === 'number' ? row.popularity_rank : null,
        isPremium: row.is_premium === true,
        sourceFile: file,
        sourceLine: line,
      });
    }
  }
  return targets;
}

function priorityBucket(row: TargetName): string {
  if (CORE_DECK_NORMALIZED_NAMES.has(row.normalizedName)) return 'current_swipe_deck';
  if (row.popularityRank !== null && row.popularityRank <= 500) return 'top_500_per_country';
  if (row.isPremium) return 'premium_pack_names';
  if (row.popularityRank !== null && row.popularityRank <= 2000) return 'high_priority_ranked';
  return 'full_dataset';
}

function priorityScore(row: TargetName): number;
function priorityScore(row: EnrichmentUpdate): number;
function priorityScore(row: TargetName | EnrichmentUpdate): number {
  const bucket = 'priority_bucket' in row ? row.priority_bucket : priorityBucket(row);
  if (bucket === 'current_swipe_deck') return 0;
  if (bucket === 'top_500_per_country') return 1;
  if (bucket === 'premium_pack_names') return 2;
  if (bucket === 'high_priority_ranked') return 3;
  return 4;
}

function buildUpdates(
  targets: TargetName[],
  dictionary: ReturnType<typeof buildDictionary>,
): { updates: EnrichmentUpdate[]; unmatched: TargetName[]; skippedExisting: number; ambiguous: number } {
  const updates: EnrichmentUpdate[] = [];
  const unmatched: TargetName[] = [];
  let skippedExisting = 0;
  let ambiguous = 0;

  const seenIds = new Set<string>();
  for (const target of targets) {
    if (seenIds.has(target.id)) continue;
    seenIds.add(target.id);

    if (target.existingMeaning) {
      skippedExisting += 1;
      continue;
    }

    const { entry, matchType, confidence } = lookupDictionaryEntry(target, dictionary);

    if (entry === 'ambiguous') {
      ambiguous += 1;
      unmatched.push(target);
      continue;
    }
    if (!entry) {
      unmatched.push(target);
      continue;
    }

    updates.push({
      id: target.id,
      name: target.name,
      normalized_name: target.normalizedName,
      country: target.country,
      region: target.region,
      gender: target.gender,
      meaning: entry.meaning,
      meaning_source: `${entry.source}:${entry.sourceDetail}`,
      meaning_confidence: confidence,
      meaning_verified: true,
      meaning_language: 'en',
      match_type: matchType,
      source_file: target.sourceFile,
      source_line: target.sourceLine,
      priority_bucket: priorityBucket(target),
      popularity_rank: target.popularityRank,
    });
  }

  updates.sort((a, b) => {
    return (
      priorityScore(a) - priorityScore(b) ||
      (a.popularity_rank ?? Number.MAX_SAFE_INTEGER) - (b.popularity_rank ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name)
    );
  });

  unmatched.sort((a, b) => priorityScore(a) - priorityScore(b) || a.name.localeCompare(b.name));
  return { updates, unmatched, skippedExisting, ambiguous };
}

function syntheticTargetFromBabyName(name: BabyName, sourceFile: string, sourceLine: number): TargetName {
  const normalizedName = normalizeName(name.name);
  return {
    id: name.id,
    name: name.name,
    normalizedName,
    compactName: compactVariant(normalizedName),
    gender: name.gender ?? null,
    country: name.country ?? null,
    region: name.region ?? null,
    origin: name.origin ?? null,
    existingMeaning: cleanMeaning(name.meaning),
    popularityRank: name.popularity_rank ?? null,
    isPremium: false,
    sourceFile,
    sourceLine,
  };
}

function launchReasons(row: TargetName): string[] {
  const reasons: string[] = [];
  if (SCREENSHOT_DEMO_NORMALIZED_NAMES.has(row.normalizedName)) reasons.push('screenshot_demo_deck');
  if (CORE_DECK_NORMALIZED_NAMES.has(row.normalizedName)) reasons.push('current_swipe_deck');
  if (row.popularityRank !== null && row.popularityRank <= 1000) reasons.push('top_1000_per_country');
  if (row.isPremium || PREMIUM_VISIBLE_NORMALIZED_NAMES.has(row.normalizedName)) reasons.push('premium_pack_names');
  return reasons;
}

function isLaunchVisible(row: TargetName): boolean {
  return launchReasons(row).length > 0;
}

function launchLogicalKey(row: TargetName): string {
  return [
    row.country ?? '',
    row.region ?? '',
    row.gender ?? '',
    row.normalizedName,
  ].join('|');
}

function chooseLaunchRepresentative(current: TargetName | undefined, next: TargetName): TargetName {
  if (!current) return next;
  const currentRank = current.popularityRank ?? Number.MAX_SAFE_INTEGER;
  const nextRank = next.popularityRank ?? Number.MAX_SAFE_INTEGER;
  if (nextRank !== currentRank) return nextRank < currentRank ? next : current;
  if (next.existingMeaning && !current.existingMeaning) return next;
  return current;
}

function buildLaunchVisibleTargets(targets: TargetName[]): TargetName[] {
  const byLogicalName = new Map<string, TargetName>();
  for (const target of targets) {
    if (!isLaunchVisible(target)) continue;
    const key = launchLogicalKey(target);
    byLogicalName.set(key, chooseLaunchRepresentative(byLogicalName.get(key), target));
  }
  for (const name of SCREENSHOT_DEMO_NAMES) {
    const target = syntheticTargetFromBabyName(name, 'src/screens/SwipeScreen.tsx', 35);
    byLogicalName.set(`screenshot|${target.normalizedName}`, target);
  }
  for (const name of PREMIUM_BUNDLED_LEGACY_NAMES) {
    const target = {
      ...syntheticTargetFromBabyName(name, 'scripts/premiumBundledLegacy.names.ts', 11),
      isPremium: true,
    };
    byLogicalName.set(`premium|${target.normalizedName}|${target.gender ?? ''}`, target);
  }
  return [...byLogicalName.values()].sort((a, b) => priorityScore(a) - priorityScore(b) || a.name.localeCompare(b.name));
}

function countLaunchReasons(rows: TargetName[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const reason of launchReasons(row)) {
      counts[reason] = (counts[reason] ?? 0) + 1;
    }
  }
  return counts;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function writeCsv(filePath: string, rows: Record<string, unknown>[]): void {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function missingReviewRow(row: TargetName): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    normalized_name: row.normalizedName,
    country: row.country,
    region: row.region,
    gender: row.gender,
    popularity_rank: row.popularityRank,
    is_premium: row.isPremium,
    priority_bucket: priorityBucket(row),
    launch_reasons: launchReasons(row).join('|'),
    source_file: row.sourceFile,
    source_line: row.sourceLine,
  };
}

function sqlLiteral(value: string | null): string {
  if (value === null) return 'null';
  return `'${value.replace(/'/g, "''")}'`;
}

function writeSqlUpdates(filePath: string, rows: EnrichmentUpdate[]): void {
  const lines = [
    '-- Generated by scripts/buildMeaningEnrichmentBatch.ts',
    '-- Safe to rerun: updates only rows whose meaning is currently null/empty.',
    'begin;',
  ];
  for (const row of rows) {
    lines.push(
      [
        'update public.baby_names',
        'set',
        `  meaning = ${sqlLiteral(row.meaning)},`,
        `  meaning_source = ${sqlLiteral(row.meaning_source)},`,
        `  meaning_confidence = ${row.meaning_confidence},`,
        '  meaning_verified = true,',
        `  meaning_language = ${sqlLiteral(row.meaning_language)}`,
        `where id = ${sqlLiteral(row.id)}`,
        "  and (meaning is null or btrim(meaning) = '')",
        '  and meaning_verified is distinct from true;',
      ].join('\n'),
    );
  }
  lines.push('commit;');
  writeFileSync(filePath, `${lines.join('\n\n')}\n`);
}

function main(): void {
  const args = process.argv.slice(2);
  const inputFiles = args.length > 0 ? args : listJsonlFiles(DEFAULT_BATCH_DIR);
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const dictionary = buildDictionary(inputFiles);
  const targets = parseTargetRows(inputFiles);
  const { updates, unmatched, skippedExisting, ambiguous } = buildUpdates(targets, dictionary);
  const launchVisibleTargets = buildLaunchVisibleTargets(targets);
  const {
    updates: launchUpdates,
    unmatched: launchUnmatched,
    skippedExisting: launchSkippedExisting,
    ambiguous: launchAmbiguous,
  } = buildUpdates(launchVisibleTargets, dictionary);

  const updateJsonlPath = path.join(OUTPUT_DIR, 'baby-name-meaning-updates.jsonl');
  const updateCsvPath = path.join(OUTPUT_DIR, 'baby-name-meaning-updates.csv');
  const updateSqlPath = path.join(OUTPUT_DIR, 'baby-name-meaning-updates.sql');
  const unmatchedPath = path.join(OUTPUT_DIR, 'unmatched-review-queue.csv');
  const reportPath = path.join(OUTPUT_DIR, 'coverage-report.json');
  const launchMissingPath = path.join(OUTPUT_DIR, 'launch-visible-missing-meanings.csv');
  const launchUpdateSqlPath = path.join(OUTPUT_DIR, 'launch-visible-meaning-updates.sql');
  const launchReportPath = path.join(OUTPUT_DIR, 'launch-visible-coverage-report.json');

  writeFileSync(updateJsonlPath, `${updates.map((row) => JSON.stringify(row)).join('\n')}\n`);
  writeCsv(updateCsvPath, updates);
  writeSqlUpdates(updateSqlPath, updates);
  writeCsv(unmatchedPath, unmatched.map(missingReviewRow));
  writeCsv(launchMissingPath, launchUnmatched.map(missingReviewRow));
  writeSqlUpdates(launchUpdateSqlPath, launchUpdates.filter((row) => !row.id.startsWith('screenshot-demo-') && !/^\d{8}$/.test(row.id)));

  const missingBefore = targets.length - skippedExisting;
  const launchMissingBefore = launchVisibleTargets.length - launchSkippedExisting;
  const launchReport = {
    generated_at: new Date().toISOString(),
    launch_visible_definition: [
      'screenshot/demo deck names',
      'current bundled swipe deck names',
      'top 1000 per country from local launch batches',
      'premium bundled legacy pack names',
    ],
    launch_visible_targets: launchVisibleTargets.length,
    launch_visible_reason_counts: countLaunchReasons(launchVisibleTargets),
    launch_visible_existing_meanings: launchSkippedExisting,
    launch_visible_missing_meaning_targets: launchMissingBefore,
    launch_visible_matched_updates: launchUpdates.length,
    launch_visible_ambiguous_targets_skipped: launchAmbiguous,
    launch_visible_missing_review_queue: launchUnmatched.length,
    launch_visible_coverage_after_matched_updates:
      launchVisibleTargets.length === 0
        ? 1
        : Number(((launchSkippedExisting + launchUpdates.length) / launchVisibleTargets.length).toFixed(4)),
    outputs: {
      launch_visible_missing_meanings_csv: launchMissingPath,
      launch_visible_update_sql: launchUpdateSqlPath,
      launch_visible_coverage_report_json: launchReportPath,
    },
  };
  const report = {
    generated_at: new Date().toISOString(),
    input_files: inputFiles,
    dictionary_entries_seen: dictionary.count,
    dictionary_ambiguous_keys: dictionary.ambiguousCount,
    target_rows_seen: targets.length,
    skipped_existing_meaning: skippedExisting,
    missing_meaning_targets: missingBefore,
    enriched_updates: updates.length,
    ambiguous_targets_skipped: ambiguous,
    unmatched_review_queue: unmatched.length,
    enrichment_coverage_of_missing:
      missingBefore === 0 ? 1 : Number((updates.length / missingBefore).toFixed(4)),
    outputs: {
      update_jsonl: updateJsonlPath,
      update_csv: updateCsvPath,
      update_sql: updateSqlPath,
      unmatched_review_queue_csv: unmatchedPath,
      coverage_report_json: reportPath,
      launch_visible_missing_meanings_csv: launchMissingPath,
      launch_visible_update_sql: launchUpdateSqlPath,
      launch_visible_coverage_report_json: launchReportPath,
    },
  };
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(launchReportPath, `${JSON.stringify(launchReport, null, 2)}\n`);

  console.log(JSON.stringify({ full_dataset: report, launch_visible: launchReport }, null, 2));
}

main();
