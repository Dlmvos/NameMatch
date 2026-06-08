/**
 * Shared types + validation for CNM-shaped meaning-enrichment JSONL.
 *
 * Used by:
 *   - scripts/enrichmentFromDictionary.ts
 *   - scripts/validateMeaningJsonl.ts
 */
import { readFileSync } from 'node:fs';

/** Matches CNM / gap-finder gender_scope check constraints. */
export type GenderScope = 'any' | 'boy' | 'girl' | 'neutral';

/** Pipeline output may only emit auto or flagged — not approved/rejected. */
export type EnrichmentReviewStatus = 'auto' | 'flagged';

export const GENDER_SCOPES = new Set<GenderScope>(['any', 'boy', 'girl', 'neutral']);
export const ENRICHMENT_REVIEW_STATUSES = new Set<EnrichmentReviewStatus>(['auto', 'flagged']);

/** BCP-47 primary subtag + optional extensions (e.g. en, pt, zh-hans). */
export const MEANING_LANGUAGE_REGEX = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Etymological origin labels allowed on enrichment output.
 * Compound origins use " / " — every segment must appear here (after stripping notes).
 */
export const MEANING_ORIGIN_ALLOWLIST = new Set<string>([
  'Albanian',
  'American',
  'Arabic',
  'Aramaic',
  'Armenian',
  'Austrian',
  'Basque',
  'Brazilian Portuguese',
  'Breton',
  'Burmese',
  'Carthaginian',
  'Catalan',
  'Celtic',
  'Chinese',
  'Cornish',
  'Czech',
  'Dutch',
  'Egyptian',
  'English',
  'Ethiopian',
  'Filipino',
  'Finnish',
  'French',
  'Frisian',
  'Gaelic',
  'Galician',
  'Georgian',
  'German',
  'Germanic',
  'Gothic',
  'Greek',
  'Hawaiian',
  'Hebrew',
  'Hopi',
  'Hungarian',
  'Igbo',
  'Indian',
  'Indonesian',
  'Irish',
  'Irish Gaelic',
  'Italian',
  'Japanese',
  'Korean',
  'Latin',
  'Lithuanian',
  'Maori',
  'Mexican',
  'Norse',
  'Old English',
  'Old French',
  'Old Norse',
  'Persian',
  'Phoenician',
  'Polish',
  'Polynesian',
  'Portuguese',
  'Roman',
  'Romanian',
  'Russian',
  'Sanskrit',
  'Scandinavian',
  'Scottish',
  'Scottish Gaelic',
  'Slavic',
  'Somali',
  'South American',
  'Spanish',
  'Swedish',
  'Swiss',
  'Tahitian',
  'Taino',
  'Thai',
  'Tupi',
  'Turkish',
  'Vietnamese',
  'Welsh',
  'West African',
]);

/** One CNM-shaped enrichment row ready for downstream import / review. */
export type CnmEnrichmentRow = {
  canonical_name_id: string;
  meaning: string;
  origin: string | null;
  gender_scope: GenderScope;
  meaning_language: string;
  meaning_source: string;
  meaning_confidence: number;
  meaning_verified: boolean;
  source_priority: number;
  review_status: EnrichmentReviewStatus;
  context: Record<string, unknown>;
};

/** Dictionary lookup row in scripts/data/dictionaries/*.jsonl */
export type DictionaryJsonlRow = {
  normalized_name: string;
  meaning: string;
  origin?: string | null;
  gender_scope?: GenderScope;
  meaning_language?: string;
  meaning_source?: string;
  meaning_confidence?: number;
  meaning_verified?: boolean;
  source_priority?: number;
  review_status?: EnrichmentReviewStatus;
  context?: Record<string, unknown>;
};

export type ParsedDictionaryEntry = DictionaryJsonlRow & {
  source_file: string;
  source_line: number;
};

export type MeaningJsonlReject = {
  line: number;
  source: string;
  errors: string[];
  row: unknown;
};

export type MeaningValidationResult =
  | { ok: true; row: CnmEnrichmentRow }
  | { ok: false; errors: string[] };

export type DictionaryValidationResult =
  | { ok: true; row: DictionaryJsonlRow }
  | { ok: false; errors: string[] };

export function normalizeNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['']/g, '')
    .replace(/\s+/g, ' ');
}

export function readJsonlRecords(
  filePath: string,
): Array<{ row: Record<string, unknown>; line: number }> {
  const raw = readFileSync(filePath, 'utf8');
  const records: Array<{ row: Record<string, unknown>; line: number }> = [];
  raw.split(/\r?\n/).forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(trimmed) as Record<string, unknown>;
    } catch (err) {
      throw new Error(
        `${filePath}:${idx + 1}: invalid JSON — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    records.push({ row: parsed, line: idx + 1 });
  });
  return records;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOriginSegment(segment: string): string {
  return segment.replace(/\s*\([^)]*\)/g, '').trim();
}

export function validateOriginAllowlist(origin: string | null | undefined): string[] {
  if (origin == null) return [];
  const trimmed = origin.trim();
  if (trimmed.length === 0) return [];

  const segments = trimmed.split(/\s*\/\s*/);
  const errors: string[] = [];
  for (const segment of segments) {
    const normalized = normalizeOriginSegment(segment);
    if (!normalized) {
      errors.push('origin compound segment is empty');
      continue;
    }
    if (!MEANING_ORIGIN_ALLOWLIST.has(normalized)) {
      errors.push(`origin segment not in allow-list: "${normalized}"`);
    }
  }
  return errors;
}

function validateMeaningLanguage(language: string): string[] {
  const normalized = language.trim().toLowerCase();
  if (!MEANING_LANGUAGE_REGEX.test(normalized)) {
    return [`meaning_language must match ${MEANING_LANGUAGE_REGEX.source} (got "${language}")`];
  }
  return [];
}

function validateConfidence(value: unknown, field = 'meaning_confidence'): string[] {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return [`${field} must be a finite number`];
  }
  if (value < 0 || value > 1) {
    return [`${field} must be between 0 and 1 inclusive (got ${value})`];
  }
  return [];
}

function validateSourcePriority(value: unknown): string[] {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return ['source_priority must be a finite number'];
  }
  if (!Number.isInteger(value) || value < 1 || value > 9) {
    return [`source_priority must be an integer from 1 to 9 (got ${value})`];
  }
  return [];
}

function validateReviewStatus(value: unknown, enrichmentOutputOnly: boolean): string[] {
  if (typeof value !== 'string') {
    return ['review_status must be a string'];
  }
  const status = value.trim() as EnrichmentReviewStatus;
  if (enrichmentOutputOnly) {
    if (!ENRICHMENT_REVIEW_STATUSES.has(status)) {
      return [`review_status must be auto or flagged for enrichment output (got "${value}")`];
    }
    return [];
  }
  if (!['auto', 'flagged', 'approved', 'rejected'].includes(status)) {
    return [`review_status must be auto, flagged, approved, or rejected (got "${value}")`];
  }
  return [];
}

function validateGenderScope(value: unknown): string[] {
  if (typeof value !== 'string') {
    return ['gender_scope must be a string'];
  }
  const scope = value.trim() as GenderScope;
  if (!GENDER_SCOPES.has(scope)) {
    return [`gender_scope must be any, boy, girl, or neutral (got "${value}")`];
  }
  return [];
}

/** Validate a dictionary source row (lookup file, not CNM output). */
export function validateDictionaryJsonlRow(row: Record<string, unknown>): DictionaryValidationResult {
  const errors: string[] = [];

  const normalizedName = cleanNonEmptyString(row.normalized_name);
  if (!normalizedName) errors.push('normalized_name is required');

  const meaning = cleanNonEmptyString(row.meaning);
  if (!meaning) errors.push('meaning is required');

  if (row.origin !== undefined && row.origin !== null) {
    errors.push(...validateOriginAllowlist(String(row.origin)));
  }

  if (row.gender_scope !== undefined) {
    errors.push(...validateGenderScope(row.gender_scope));
  }

  if (row.meaning_language !== undefined) {
    const lang = cleanNonEmptyString(row.meaning_language);
    if (!lang) {
      errors.push('meaning_language must be a non-empty string when present');
    } else {
      errors.push(...validateMeaningLanguage(lang));
    }
  }

  if (row.meaning_confidence !== undefined) {
    errors.push(...validateConfidence(row.meaning_confidence));
  }

  if (row.source_priority !== undefined) {
    errors.push(...validateSourcePriority(row.source_priority));
  }

  if (row.review_status !== undefined) {
    errors.push(...validateReviewStatus(row.review_status, true));
  }

  if (row.context !== undefined && !isPlainObject(row.context)) {
    errors.push('context must be a plain object when present');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    row: {
      normalized_name: normalizedName!,
      meaning: meaning!,
      origin: row.origin == null ? null : cleanNonEmptyString(row.origin),
      gender_scope: row.gender_scope as GenderScope | undefined,
      meaning_language: row.meaning_language as string | undefined,
      meaning_source: row.meaning_source as string | undefined,
      meaning_confidence: row.meaning_confidence as number | undefined,
      meaning_verified: row.meaning_verified as boolean | undefined,
      source_priority: row.source_priority as number | undefined,
      review_status: row.review_status as EnrichmentReviewStatus | undefined,
      context: row.context as Record<string, unknown> | undefined,
    },
  };
}

/** Validate a CNM-shaped enrichment output row. */
export function validateCnmEnrichmentRow(row: Record<string, unknown>): MeaningValidationResult {
  const errors: string[] = [];

  const canonicalNameId = cleanNonEmptyString(row.canonical_name_id);
  if (!canonicalNameId) {
    errors.push('canonical_name_id is required');
  } else if (!UUID_REGEX.test(canonicalNameId)) {
    errors.push(`canonical_name_id must be a UUID (got "${canonicalNameId}")`);
  }

  const meaning = cleanNonEmptyString(row.meaning);
  if (!meaning) errors.push('meaning is required');

  errors.push(...validateGenderScope(row.gender_scope));

  const meaningLanguage = cleanNonEmptyString(row.meaning_language);
  if (!meaningLanguage) {
    errors.push('meaning_language is required');
  } else {
    errors.push(...validateMeaningLanguage(meaningLanguage));
  }

  const meaningSource = cleanNonEmptyString(row.meaning_source);
  if (!meaningSource) errors.push('meaning_source is required');

  errors.push(...validateConfidence(row.meaning_confidence));

  if (typeof row.meaning_verified !== 'boolean') {
    errors.push('meaning_verified must be a boolean');
  }

  errors.push(...validateSourcePriority(row.source_priority));
  errors.push(...validateReviewStatus(row.review_status, true));

  if (row.origin !== undefined && row.origin !== null) {
    errors.push(...validateOriginAllowlist(String(row.origin)));
  }

  if (!isPlainObject(row.context)) {
    errors.push('context must be a plain object');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    row: {
      canonical_name_id: canonicalNameId!,
      meaning: meaning!,
      origin: row.origin == null ? null : cleanNonEmptyString(row.origin),
      gender_scope: String(row.gender_scope).trim() as GenderScope,
      meaning_language: meaningLanguage!.toLowerCase(),
      meaning_source: meaningSource!,
      meaning_confidence: row.meaning_confidence as number,
      meaning_verified: row.meaning_verified as boolean,
      source_priority: row.source_priority as number,
      review_status: String(row.review_status).trim() as EnrichmentReviewStatus,
      context: row.context as Record<string, unknown>,
    },
  };
}

/** Stable JSON key order for diff-friendly JSONL. */
export function serializeCnmEnrichmentRow(row: CnmEnrichmentRow): string {
  return JSON.stringify({
    canonical_name_id: row.canonical_name_id,
    meaning: row.meaning,
    origin: row.origin,
    gender_scope: row.gender_scope,
    meaning_language: row.meaning_language,
    meaning_source: row.meaning_source,
    meaning_confidence: row.meaning_confidence,
    meaning_verified: row.meaning_verified,
    source_priority: row.source_priority,
    review_status: row.review_status,
    context: row.context,
  });
}

export function serializeMeaningReject(reject: MeaningJsonlReject): string {
  return JSON.stringify({
    line: reject.line,
    source: reject.source,
    errors: reject.errors,
    row: reject.row,
  });
}

export function defaultRejectsPath(outPath: string): string {
  if (outPath.endsWith('.jsonl')) {
    return outPath.replace(/\.jsonl$/, '.rejects.jsonl');
  }
  return `${outPath}.rejects.jsonl`;
}
