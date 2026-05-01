/**
 * Bulk baby-name import: normalize + validate source rows → `public.baby_names` payload.
 *
 * - Stable `external_id` → deterministic UUID (v5) for idempotent upserts on `id`.
 * - Optional `popularity_rank` is validated and persisted on `baby_names`.
 * - Optional `trend` is accepted in JSON but not written until a DB column exists (droppedFields).
 *
 * Region/gender must match app `BabyName` / schema CHECK constraints.
 */
import { v5 as uuidv5 } from 'uuid';

/** Namespace for bulk imports — do not change after rows are seeded in production. */
export const BULK_BABY_NAME_NAMESPACE_UUID = '8f4c2b10-9e3a-5b1d-8c7e-1a2b3c4d5e6f';

export type AppRegion = 'EU' | 'US' | 'ARABIA' | 'MENA' | 'ASIA' | 'LATIN_AMERICA' | 'WORLDWIDE';
export type AppGender = 'boy' | 'girl' | 'neutral';

export type BulkImportSourceRow = {
  /** Required for idempotent upserts (stable business key, e.g. dataset slug + row). */
  external_id: string;
  name: string;
  gender: string;
  region: string;
  origin?: string | null;
  meaning?: string | null;
  country?: string | null;
  is_worldwide?: boolean;
  is_premium?: boolean;
  popularity_rank?: number | null;
  trend?: string | null;
};

export type NormalizedBabyNameInsert = {
  id: string;
  name: string;
  gender: AppGender;
  origin: string;
  meaning: string | null;
  country: string | null;
  region: AppRegion;
  is_worldwide: boolean;
  is_premium: boolean;
  /** Null when absent or explicitly null in source. */
  popularity_rank: number | null;
};

export type ValidationResult =
  | { ok: true; row: NormalizedBabyNameInsert; droppedFields: string[] }
  | { ok: false; errors: string[] };

const REGIONS: AppRegion[] = [
  'EU',
  'US',
  'ARABIA',
  'MENA',
  'ASIA',
  'LATIN_AMERICA',
  'WORLDWIDE',
];

const REGION_ALIASES: Record<string, AppRegion> = {
  eu: 'EU',
  europe: 'EU',
  us: 'US',
  usa: 'US',
  'united states': 'US',
  arabia: 'ARABIA',
  mena: 'MENA',
  asia: 'ASIA',
  latin_america: 'LATIN_AMERICA',
  latinamerica: 'LATIN_AMERICA',
  latam: 'LATIN_AMERICA',
  worldwide: 'WORLDWIDE',
  global: 'WORLDWIDE',
};

function normalizeRegion(raw: string): AppRegion | null {
  const t = raw.trim();
  if (!t) return null;
  const upper = t.toUpperCase().replace(/\s+/g, '_');
  if ((REGIONS as string[]).includes(upper)) return upper as AppRegion;
  const lower = t.toLowerCase().replace(/\s+/g, '_');
  return REGION_ALIASES[lower] ?? REGION_ALIASES[t.toLowerCase()] ?? null;
}

function normalizeGender(raw: string): AppGender | null {
  const t = raw.trim().toLowerCase();
  if (['boy', 'male', 'm', 'b'].includes(t)) return 'boy';
  if (['girl', 'female', 'f', 'g'].includes(t)) return 'girl';
  if (['neutral', 'unisex', 'n', 'u', 'nb'].includes(t)) return 'neutral';
  return null;
}

export function bulkImportUuid(externalId: string): string {
  const key = String(externalId ?? '').trim();
  return uuidv5(`namematch-bulk:${key}`, BULK_BABY_NAME_NAMESPACE_UUID);
}

/** EU markets where Nordic patronymics / obvious Anglo surnames are usually wrong as given names (staging noise). */
const STRICT_EU_GIVEN_NAME_MARKETS = new Set<string>([
  'Spain',
  'Portugal',
  'Italy',
  'France',
  'Greece',
]);

/** Lowercased tokens — high-confidence surnames / patronymic tails, not common standalone first names in strict markets. */
const SURNAME_LIKE_TOKEN_BLOCKLIST = new Set([
  'andersen',
  'anderson',
  'bergman',
  'brown',
  'christensen',
  'clark',
  'eriksson',
  'gustafsson',
  'hansen',
  'jensen',
  'johansen',
  'johansson',
  'johnson',
  'jones',
  'karlsson',
  'larsson',
  'lewis',
  'lindberg',
  'lundberg',
  'magnusson',
  'nielsen',
  'nilsson',
  'olsson',
  'pedersen',
  'persson',
  'rasmussen',
  'robinson',
  'smith',
  'svensson',
  'taylor',
  'walker',
]);

function tokenLooksScandinavianPatronymic(lowerToken: string): boolean {
  const t = lowerToken.replace(/[\u2019']/g, '').replace(/\.$/, '');
  if (t.length >= 5 && /sson$/.test(t)) return true;
  if (t.length >= 6 && /sen$/.test(t)) return true;
  if (/dottir$/.test(t) || /dóttir$/u.test(lowerToken)) return true;
  return false;
}

/**
 * Deterministic public-import quality gate (non-premium). Premium rows skip this — curated separately.
 * Logs are left to callers; errors are returned as validation messages.
 */
export function assessPublicImportNameQuality(
  name: string,
  country: string | null,
  region: AppRegion,
  is_premium: boolean,
): string[] {
  if (is_premium) return [];

  const issues: string[] = [];
  if (/\d/.test(name)) issues.push('name must not contain digits');
  if (/[^\p{L}\p{M}\s'\-.]/u.test(name)) issues.push('name contains disallowed characters');

  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length > 4) issues.push('name has more than 4 word parts');

  const strict =
    region === 'EU' && country !== null && STRICT_EU_GIVEN_NAME_MARKETS.has(country);

  if (strict) {
    for (const rawTok of tokens) {
      const tok = rawTok
        .replace(/[\u2019']/g, '')
        .replace(/\.$/, '')
        .toLowerCase();
      if (!tok) continue;
      if (tokenLooksScandinavianPatronymic(tok)) {
        issues.push(`quality: patronymic-style fragment "${rawTok}" is implausible for ${country}`);
      }
      if (SURNAME_LIKE_TOKEN_BLOCKLIST.has(tok)) {
        issues.push(`quality: surname-like token "${rawTok}" is implausible for ${country}`);
      }
    }
  }

  return issues;
}

export function normalizeAndValidateRow(input: BulkImportSourceRow): ValidationResult {
  const errors: string[] = [];
  const droppedFields: string[] = [];

  const ext = String(input.external_id ?? '').trim();
  if (!ext) errors.push('external_id is required');

  const name = String(input.name ?? '').trim();
  if (!name) errors.push('name is required');
  if (name.length > 200) errors.push('name exceeds 200 characters');

  const gender = normalizeGender(String(input.gender ?? ''));
  if (!gender) errors.push(`invalid gender: "${input.gender}"`);

  const region = normalizeRegion(String(input.region ?? ''));
  if (!region) errors.push(`invalid region: "${input.region}"`);

  const origin = String(input.origin ?? '').trim() || 'Unknown';
  const meaningRaw = input.meaning;
  const meaning =
    meaningRaw === null || meaningRaw === undefined
      ? null
      : String(meaningRaw).trim() || null;
  const countryRaw = input.country;
  const country =
    countryRaw === null || countryRaw === undefined || String(countryRaw).trim() === ''
      ? null
      : String(countryRaw).trim();

  const is_worldwide = Boolean(input.is_worldwide);
  const is_premium = Boolean(input.is_premium);

  let popularity_rank: number | null = null;
  const prRaw = input.popularity_rank;
  if (prRaw !== undefined && prRaw !== null) {
    if (typeof prRaw !== 'number' || !Number.isInteger(prRaw)) {
      errors.push('popularity_rank must be a whole number or null');
    } else if (prRaw < 1 || prRaw > 1_000_000) {
      errors.push('popularity_rank must be between 1 and 1000000');
    } else {
      popularity_rank = prRaw;
    }
  }

  if (input.trend !== undefined && input.trend !== null && String(input.trend).trim() !== '') {
    droppedFields.push('trend');
  }

  if (errors.length > 0) return { ok: false, errors };

  // Narrowed after error checks above (invalid gender/region add errors and return early).
  const genderOut = gender as AppGender;
  const regionOut = region as AppRegion;

  const qualityErrors = assessPublicImportNameQuality(name, country, regionOut, is_premium);
  if (qualityErrors.length > 0) return { ok: false, errors: qualityErrors };

  return {
    ok: true,
    row: {
      id: bulkImportUuid(ext),
      name,
      gender: genderOut,
      origin,
      meaning,
      country,
      region: regionOut,
      is_worldwide,
      is_premium,
      popularity_rank,
    },
    droppedFields,
  };
}

export function parseJsonlLine(line: string, lineNumber: number): BulkImportSourceRow | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  try {
    return JSON.parse(trimmed) as BulkImportSourceRow;
  } catch {
    throw new Error(`Line ${lineNumber}: invalid JSON`);
  }
}
