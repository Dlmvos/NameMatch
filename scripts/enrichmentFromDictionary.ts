/**
 * Dictionary enrichment stage — gap queue → CNM-shaped JSONL.
 *
 * Reads a gap-finder queue, looks up meanings in scripts/data/dictionaries/*.jsonl,
 * validates output rows, and writes enrichment JSONL + .rejects.jsonl for invalid rows.
 *
 * No LLM calls. No database writes.
 *
 * Usage:
 *   tsx scripts/enrichmentFromDictionary.ts \
 *     --in scripts/data/meaning-enrichment/gaps-en-any.jsonl \
 *     --out scripts/data/meaning-enrichment/dictionary-en-any.jsonl \
 *     --language en \
 *     --gender-scope any
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { EnrichmentGapQueueRow } from './enrichmentGapFinder';
import {
  defaultRejectsPath,
  normalizeNameKey,
  readJsonlRecords,
  serializeCnmEnrichmentRow,
  serializeMeaningReject,
  validateCnmEnrichmentRow,
  validateDictionaryJsonlRow,
  type CnmEnrichmentRow,
  type GenderScope,
  type MeaningJsonlReject,
  type ParsedDictionaryEntry,
} from './lib/meaningEnrichmentJsonl';

type Cli = {
  inPath: string;
  outPath: string;
  dictDir: string;
  language: string;
  genderScope: GenderScope;
};

const DEFAULT_DICT_DIR = 'scripts/data/dictionaries';
const DEFAULT_OUT = 'scripts/data/meaning-enrichment/dictionary-enrichment.jsonl';
const GENDER_SCOPES = new Set<GenderScope>(['any', 'boy', 'girl', 'neutral']);

/** External dictionary tier — matches buildMeaningEnrichmentBatch external_dictionary priority. */
const DEFAULT_SOURCE_PRIORITY = 4;
const DEFAULT_MEANING_CONFIDENCE = 0.75;

function parseArgs(argv: string[]): Cli {
  const inIdx = argv.indexOf('--in');
  const outIdx = argv.indexOf('--out');
  const dictIdx = argv.indexOf('--dict-dir');
  const langIdx = argv.indexOf('--language');
  const scopeIdx = argv.indexOf('--gender-scope');

  if (inIdx < 0 || !argv[inIdx + 1]) {
    throw new Error('Missing --in <gap-queue.jsonl>');
  }
  if (langIdx < 0 || !argv[langIdx + 1]) {
    throw new Error('Missing --language <code> (e.g. en)');
  }
  if (scopeIdx < 0 || !argv[scopeIdx + 1]) {
    throw new Error('Missing --gender-scope <any|boy|girl|neutral>');
  }

  const genderScope = argv[scopeIdx + 1].trim() as GenderScope;
  if (!GENDER_SCOPES.has(genderScope)) {
    throw new Error(`Invalid --gender-scope "${argv[scopeIdx + 1]}"`);
  }

  return {
    inPath: argv[inIdx + 1],
    outPath: outIdx >= 0 && argv[outIdx + 1] ? argv[outIdx + 1] : DEFAULT_OUT,
    dictDir: dictIdx >= 0 && argv[dictIdx + 1] ? argv[dictIdx + 1] : DEFAULT_DICT_DIR,
    language: argv[langIdx + 1].trim().toLowerCase(),
    genderScope,
  };
}

function resolvePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

function listDictionaryFiles(dir: string): string[] {
  const abs = resolvePath(dir);
  let entries: string[];
  try {
    entries = readdirSync(abs)
      .filter((name) => name.endsWith('.jsonl') && !name.endsWith('.rejects.jsonl'))
      .map((name) => path.join(abs, name))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
  return entries;
}

function parseGapQueueRow(row: Record<string, unknown>, line: number, source: string): EnrichmentGapQueueRow {
  const canonicalNameId = typeof row.canonical_name_id === 'string' ? row.canonical_name_id.trim() : '';
  const normalizedName = typeof row.normalized_name === 'string' ? row.normalized_name.trim() : '';
  const displayName = typeof row.display_name === 'string' ? row.display_name.trim() : '';

  if (!canonicalNameId || !normalizedName || !displayName) {
    throw new Error(
      `${source}:${line}: gap row requires canonical_name_id, normalized_name, display_name`,
    );
  }

  return {
    canonical_name_id: canonicalNameId,
    normalized_name: normalizedName,
    display_name: displayName,
    canonical_gender:
      row.canonical_gender === null || row.canonical_gender === undefined
        ? null
        : String(row.canonical_gender),
    row_count: typeof row.row_count === 'number' ? row.row_count : 0,
    inverse_rank_weight: typeof row.inverse_rank_weight === 'number' ? row.inverse_rank_weight : 0,
    touches_premium: row.touches_premium === true,
  };
}

function canonicalGenderToScope(gender: string | null): GenderScope | null {
  if (!gender) return null;
  const g = gender.trim().toLowerCase();
  if (g === 'boy' || g === 'girl' || g === 'neutral') return g;
  return null;
}

function dictionaryLookupKey(normalizedName: string, genderScope: GenderScope): string {
  return `${normalizedName}\u0000${genderScope}`;
}

function loadDictionaries(dictDir: string): {
  entries: ParsedDictionaryEntry[];
  skippedInvalid: number;
} {
  const files = listDictionaryFiles(dictDir);
  const entries: ParsedDictionaryEntry[] = [];
  let skippedInvalid = 0;

  for (const filePath of files) {
    const rel = path.relative(process.cwd(), filePath);
    for (const { row, line } of readJsonlRecords(filePath)) {
      const validated = validateDictionaryJsonlRow(row);
      if (!validated.ok) {
        skippedInvalid += 1;
        console.warn(
          `[enrichmentFromDictionary] skip invalid dictionary row ${rel}:${line}: ${validated.errors.join('; ')}`,
        );
        continue;
      }

      entries.push({
        ...validated.row,
        normalized_name: normalizeNameKey(validated.row.normalized_name),
        source_file: rel,
        source_line: line,
      });
    }
  }

  entries.sort((a, b) => {
    const fileCmp = a.source_file.localeCompare(b.source_file);
    if (fileCmp !== 0) return fileCmp;
    if (a.source_line !== b.source_line) return a.source_line - b.source_line;
    return a.normalized_name.localeCompare(b.normalized_name);
  });

  return { entries, skippedInvalid };
}

function buildDictionaryIndex(entries: ParsedDictionaryEntry[]): Map<string, ParsedDictionaryEntry> {
  const index = new Map<string, ParsedDictionaryEntry>();

  for (const entry of entries) {
    const scopes: GenderScope[] = entry.gender_scope ? [entry.gender_scope] : ['any'];
    for (const scope of scopes) {
      const key = dictionaryLookupKey(entry.normalized_name, scope);
      const prev = index.get(key);
      if (!prev || compareDictionaryEntries(entry, prev) < 0) {
        index.set(key, entry);
      }
    }
  }

  return index;
}

function compareDictionaryEntries(a: ParsedDictionaryEntry, b: ParsedDictionaryEntry): number {
  const spA = a.source_priority ?? DEFAULT_SOURCE_PRIORITY;
  const spB = b.source_priority ?? DEFAULT_SOURCE_PRIORITY;
  if (spA !== spB) return spA - spB;

  const confA = a.meaning_confidence ?? DEFAULT_MEANING_CONFIDENCE;
  const confB = b.meaning_confidence ?? DEFAULT_MEANING_CONFIDENCE;
  if (confB !== confA) return confB - confA;

  const fileCmp = a.source_file.localeCompare(b.source_file);
  if (fileCmp !== 0) return fileCmp;
  if (a.source_line !== b.source_line) return a.source_line - b.source_line;
  return a.normalized_name.localeCompare(b.normalized_name);
}

function pickDictionaryEntry(
  index: Map<string, ParsedDictionaryEntry>,
  normalizedName: string,
  slotGenderScope: GenderScope,
  canonicalGender: string | null,
): ParsedDictionaryEntry | null {
  const genderScope = canonicalGenderToScope(canonicalGender);
  const candidates: ParsedDictionaryEntry[] = [];

  if (genderScope) {
    const gendered = index.get(dictionaryLookupKey(normalizedName, genderScope));
    if (gendered) candidates.push(gendered);
  }

  const slotScoped = index.get(dictionaryLookupKey(normalizedName, slotGenderScope));
  if (slotScoped) candidates.push(slotScoped);

  const anyScoped = index.get(dictionaryLookupKey(normalizedName, 'any'));
  if (anyScoped) candidates.push(anyScoped);

  if (candidates.length === 0) return null;

  candidates.sort(compareDictionaryEntries);
  return candidates[0] ?? null;
}

function buildCnmRow(
  gap: EnrichmentGapQueueRow,
  dict: ParsedDictionaryEntry,
  cli: Cli,
): Record<string, unknown> {
  const meaningLanguage = (dict.meaning_language ?? cli.language).trim().toLowerCase();
  const genderScope = dict.gender_scope ?? cli.genderScope;

  return {
    canonical_name_id: gap.canonical_name_id,
    meaning: dict.meaning.trim(),
    origin: dict.origin ?? null,
    gender_scope: genderScope,
    meaning_language: meaningLanguage,
    meaning_source:
      dict.meaning_source ??
      `dictionary:${dict.source_file.replace(/^scripts\/data\/dictionaries\//, '')}:${dict.source_line}`,
    meaning_confidence: dict.meaning_confidence ?? DEFAULT_MEANING_CONFIDENCE,
    meaning_verified: dict.meaning_verified ?? false,
    source_priority: dict.source_priority ?? DEFAULT_SOURCE_PRIORITY,
    review_status: dict.review_status ?? 'auto',
    context: {
      enrichment_stage: 'dictionary',
      normalized_name: gap.normalized_name,
      display_name: gap.display_name,
      dictionary_file: dict.source_file,
      dictionary_line: dict.source_line,
      gap_row_count: gap.row_count,
      gap_touches_premium: gap.touches_premium,
      ...(dict.context ?? {}),
    },
  };
}

function compareOutputRows(a: CnmEnrichmentRow, b: CnmEnrichmentRow): number {
  const premiumA = a.context.gap_touches_premium === true;
  const premiumB = b.context.gap_touches_premium === true;
  if (premiumA !== premiumB) return premiumA ? -1 : 1;

  const weightA = typeof a.context.gap_inverse_rank_weight === 'number' ? a.context.gap_inverse_rank_weight : 0;
  const weightB = typeof b.context.gap_inverse_rank_weight === 'number' ? b.context.gap_inverse_rank_weight : 0;
  if (weightB !== weightA) return weightB - weightA;

  const countA = typeof a.context.gap_row_count === 'number' ? a.context.gap_row_count : 0;
  const countB = typeof b.context.gap_row_count === 'number' ? b.context.gap_row_count : 0;
  if (countB !== countA) return countB - countA;

  const nameA = typeof a.context.normalized_name === 'string' ? a.context.normalized_name : '';
  const nameB = typeof b.context.normalized_name === 'string' ? b.context.normalized_name : '';
  const nameCmp = nameA.localeCompare(nameB);
  if (nameCmp !== 0) return nameCmp;

  return a.canonical_name_id.localeCompare(b.canonical_name_id);
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const inPath = resolvePath(cli.inPath);
  const outPath = resolvePath(cli.outPath);
  const rejectsPath = resolvePath(defaultRejectsPath(cli.outPath));

  const gapRecords = readJsonlRecords(inPath);
  const gaps: EnrichmentGapQueueRow[] = gapRecords.map(({ row, line }) =>
    parseGapQueueRow(row, line, cli.inPath),
  );

  const { entries, skippedInvalid } = loadDictionaries(cli.dictDir);
  const index = buildDictionaryIndex(entries);

  const validRows: CnmEnrichmentRow[] = [];
  const rejects: MeaningJsonlReject[] = [];
  let matched = 0;
  let unmatched = 0;

  for (const gap of gaps) {
    const dict = pickDictionaryEntry(
      index,
      normalizeNameKey(gap.normalized_name),
      cli.genderScope,
      gap.canonical_gender,
    );
    if (!dict) {
      unmatched += 1;
      continue;
    }

    matched += 1;
    const draft = buildCnmRow(gap, dict, cli);
    draft.context = {
      ...(draft.context as Record<string, unknown>),
      gap_row_count: gap.row_count,
      gap_inverse_rank_weight: Number(gap.inverse_rank_weight.toFixed(6)),
      gap_touches_premium: gap.touches_premium,
    };

    const validated = validateCnmEnrichmentRow(draft);
    if (validated.ok) {
      validRows.push(validated.row);
    } else {
      rejects.push({
        line: 0,
        source: cli.inPath,
        errors: validated.errors,
        row: {
          ...draft,
          gap_normalized_name: gap.normalized_name,
        },
      });
    }
  }

  validRows.sort(compareOutputRows);

  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    validRows.length > 0 ? `${validRows.map(serializeCnmEnrichmentRow).join('\n')}\n` : '',
    'utf8',
  );

  if (rejects.length > 0) {
    writeFileSync(
      rejectsPath,
      `${rejects.map(serializeMeaningReject).join('\n')}\n`,
      'utf8',
    );
  }

  console.log(
    `[enrichmentFromDictionary] gaps=${gaps.length} dictionary_entries=${entries.length} dict_files=${listDictionaryFiles(cli.dictDir).length} dict_skipped=${skippedInvalid} matched=${matched} unmatched=${unmatched} valid=${validRows.length} rejected=${rejects.length}`,
  );
  console.log(`[enrichmentFromDictionary] → ${cli.outPath}`);
  if (rejects.length > 0) {
    console.error(`[enrichmentFromDictionary] rejects → ${defaultRejectsPath(cli.outPath)}`);
    process.exit(1);
  }
}

main();
