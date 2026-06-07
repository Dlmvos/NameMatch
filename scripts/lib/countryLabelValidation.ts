/**
 * Validate baby-name import `country` labels against canonical `COUNTRY_OPTIONS.name`.
 *
 * Used by `scripts/validateImportCountryLabels.ts` before JSONL/CSV import.
 */
import { COUNTRY_OPTIONS } from '../../src/data/countries';
import { toI18nKey } from '../../src/i18n/display';
import { t } from '../../src/i18n/runtime';

export const CANONICAL_COUNTRY_NAMES = new Set(COUNTRY_OPTIONS.map((c) => c.name));

const I18N_LOCALES = ['nl', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'] as const;

/** ISO / common English alternates that are not canonical `COUNTRY_OPTIONS.name`. */
const ENGLISH_COUNTRY_ALIASES: Record<string, string> = {
  US: 'USA',
  'U.S.': 'USA',
  'U.S.A.': 'USA',
  'United States': 'USA',
  'United States of America': 'USA',
  'United Arab Emirates': 'UAE',
  'U.K.': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  England: 'United Kingdom',
  Czechia: 'Czech Republic',
  'Republic of Korea': 'South Korea',
  'Korea, South': 'South Korea',
  Holland: 'Netherlands',
};

const ISO_COUNTRY_ALIASES: Record<string, string> = {
  NL: 'Netherlands',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  PT: 'Portugal',
  PL: 'Poland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  BE: 'Belgium',
  FI: 'Finland',
  AT: 'Austria',
  CH: 'Switzerland',
  IE: 'Ireland',
  CZ: 'Czech Republic',
  HU: 'Hungary',
  RO: 'Romania',
  GR: 'Greece',
  RU: 'Russia',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  US: 'USA',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  CN: 'China',
  JP: 'Japan',
  IN: 'India',
  KR: 'South Korea',
  ID: 'Indonesia',
  PH: 'Philippines',
  VN: 'Vietnam',
  TH: 'Thailand',
  MY: 'Malaysia',
  SG: 'Singapore',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  TR: 'Turkey',
  IR: 'Iran',
  EG: 'Egypt',
  MA: 'Morocco',
  DZ: 'Algeria',
  TN: 'Tunisia',
  IL: 'Israel',
  JO: 'Jordan',
  LB: 'Lebanon',
  SA: 'Saudi Arabia',
  AE: 'UAE',
  KW: 'Kuwait',
  QA: 'Qatar',
  BH: 'Bahrain',
  OM: 'Oman',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  CO: 'Colombia',
  PE: 'Peru',
  CL: 'Chile',
  VE: 'Venezuela',
  ZA: 'South Africa',
  NG: 'Nigeria',
  KE: 'Kenya',
};

export type CountryLabelIssueKind = 'whitespace' | 'localized' | 'alias' | 'unknown';

export type CountryLabelIssue = {
  kind: CountryLabelIssueKind;
  raw: string;
  line: number;
  field: string;
  canonical?: string;
  message: string;
};

export type CountryLabelRowRef = {
  line: number;
  field: string;
  /** Raw value from source (may include leading/trailing spaces). */
  raw: string | null | undefined;
};

const canonicalByLower = new Map(
  COUNTRY_OPTIONS.map((c) => [c.name.toLowerCase(), c.name] as const),
);

function buildLocalizedLabelMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const { name } of COUNTRY_OPTIONS) {
    const key = `country.${toI18nKey(name)}`;
    for (const locale of I18N_LOCALES) {
      const label = t(key, locale).trim();
      if (!label || label === key || label === name) continue;
      if (!map.has(label)) map.set(label, name);
    }
  }
  const unitedStatesEn = t('country.united_states', 'en').trim();
  if (unitedStatesEn && unitedStatesEn !== 'country.united_states') {
    map.set(unitedStatesEn, 'USA');
  }
  return map;
}

const LOCALIZED_LABEL_MAP = buildLocalizedLabelMap();

function lookupEnglishAlias(label: string): string | undefined {
  if (ENGLISH_COUNTRY_ALIASES[label]) return ENGLISH_COUNTRY_ALIASES[label];
  const lower = label.toLowerCase();
  for (const [alias, canonical] of Object.entries(ENGLISH_COUNTRY_ALIASES)) {
    if (alias.toLowerCase() === lower) return canonical;
  }
  return undefined;
}

function lookupIsoAlias(label: string): string | undefined {
  const compact = label.trim();
  if (!/^[A-Za-z]{2,3}$/.test(compact)) return undefined;
  return ISO_COUNTRY_ALIASES[compact.toUpperCase()];
}

/** Returns `null` when the label is absent or canonical; otherwise an issue. */
export function validateCountryLabel(ref: CountryLabelRowRef): CountryLabelIssue | null {
  const { raw, line, field } = ref;
  if (raw === null || raw === undefined) return null;

  const asString = typeof raw === 'string' ? raw : String(raw);
  if (asString.trim() === '') return null;

  if (asString !== asString.trim()) {
    return {
      kind: 'whitespace',
      raw: asString,
      line,
      field,
      message: `country label has leading or trailing whitespace: ${JSON.stringify(asString)}`,
    };
  }

  const label = asString;

  if (CANONICAL_COUNTRY_NAMES.has(label)) return null;

  const canonicalByCase = canonicalByLower.get(label.toLowerCase());
  if (canonicalByCase && canonicalByCase !== label) {
    return {
      kind: 'alias',
      raw: label,
      line,
      field,
      canonical: canonicalByCase,
      message: `country label "${label}" should use canonical casing "${canonicalByCase}"`,
    };
  }

  const isoAlias = lookupIsoAlias(label);
  if (isoAlias) {
    return {
      kind: 'alias',
      raw: label,
      line,
      field,
      canonical: isoAlias,
      message: `country alias "${label}" should be canonical "${isoAlias}"`,
    };
  }

  const englishAlias = lookupEnglishAlias(label);
  if (englishAlias) {
    return {
      kind: 'alias',
      raw: label,
      line,
      field,
      canonical: englishAlias,
      message: `country alias "${label}" should be canonical "${englishAlias}"`,
    };
  }

  const localizedCanonical = LOCALIZED_LABEL_MAP.get(label);
  if (localizedCanonical) {
    return {
      kind: 'localized',
      raw: label,
      line,
      field,
      canonical: localizedCanonical,
      message: `localized country label "${label}" should be canonical "${localizedCanonical}"`,
    };
  }

  return {
    kind: 'unknown',
    raw: label,
    line,
    field,
    message: `unknown country label "${label}" (not in COUNTRY_OPTIONS)`,
  };
}

export function validateCountryLabels(rows: CountryLabelRowRef[]): CountryLabelIssue[] {
  const issues: CountryLabelIssue[] = [];
  for (const row of rows) {
    const issue = validateCountryLabel(row);
    if (issue) issues.push(issue);
  }
  return issues;
}

export function formatCountryLabelIssue(issue: CountryLabelIssue): string {
  const where = `line ${issue.line} [${issue.field}]`;
  if (issue.canonical) {
    return `${where}: ${issue.message}`;
  }
  return `${where}: ${issue.message}`;
}
