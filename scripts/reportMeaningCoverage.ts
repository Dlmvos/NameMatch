/**
 * Read-only meaning coverage report for baby_names by country.
 *
 * Resolves meanings via baby_names.meaning OR canonical_name_meanings
 * (same precedence as baby_names_with_meaning: row cache first, then CNM
 * lateral pick with review_status <> 'rejected').
 *
 * Usage:
 *   tsx scripts/reportMeaningCoverage.ts --countries Australia,Belgium
 *   tsx scripts/reportMeaningCoverage.ts --countries Netherlands --json-out scripts/data/meaning-enrichment/coverage-nl.json
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import 'dotenv/config';

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type MeaningCoverageCli = {
  countries: string[];
  jsonOut: string | null;
};

export type CountryCoverageSummary = {
  country: string;
  total_rows: number;
  unique_canonical_names: number;
  rows_with_meaning: number;
  canonical_names_with_meaning: number;
  rows_missing_meaning: number;
  rows_missing_meaning_premium: number;
  rows_with_meaning_premium: number;
  premium_rows: number;
};

export type MissingNameRankRow = {
  rank: number;
  display_name: string;
  canonical_name_id: string | null;
  countries: string[];
  row_count: number;
  inverse_rank_weight: number;
  touches_premium: boolean;
  premium_row_count: number;
};

export type MeaningCoverageReport = {
  generated_at: string;
  countries: string[];
  by_country: CountryCoverageSummary[];
  total: CountryCoverageSummary;
  top_missing: MissingNameRankRow[];
};

type BabyNameRow = {
  id: string;
  name: string;
  country: string;
  gender: string;
  meaning: string | null;
  meaning_language: string | null;
  canonical_name_id: string | null;
  is_premium: boolean | null;
  popularity_rank: number | null;
};

type CanonicalMeaningRow = {
  canonical_name_id: string;
  meaning: string;
  meaning_language: string;
  gender_scope: string;
  review_status: string | null;
  source_priority: number | null;
  meaning_verified: boolean;
  meaning_confidence: number | null;
  created_at: string;
};

type MissingAggregate = {
  key: string;
  display_name: string;
  canonical_name_id: string | null;
  countries: Set<string>;
  row_count: number;
  premium_row_count: number;
  inverse_rank_weight: number;
  touches_premium: boolean;
};

const PAGE_SIZE = 1000;
const TOP_MISSING = 100;
const RANK_FALLBACK = 1000;

function parseArgs(argv: string[]): MeaningCoverageCli {
  const countriesIdx = argv.indexOf('--countries');
  const jsonIdx = argv.indexOf('--json-out');

  if (countriesIdx < 0 || !argv[countriesIdx + 1]) {
    throw new Error('Missing --countries <Country1,Country2,...>');
  }

  const countries = argv[countriesIdx + 1]
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  if (countries.length === 0) {
    throw new Error('--countries must list at least one country');
  }

  return {
    countries,
    jsonOut: jsonIdx >= 0 && argv[jsonIdx + 1] ? argv[jsonIdx + 1] : null,
  };
}

function isNonEmptyMeaning(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function rankWeight(rank: number | null | undefined): number {
  const r = typeof rank === 'number' && Number.isFinite(rank) ? rank : RANK_FALLBACK;
  return 1 / Math.max(Math.floor(r), 1);
}

function emptySummary(country: string): CountryCoverageSummary {
  return {
    country,
    total_rows: 0,
    unique_canonical_names: 0,
    rows_with_meaning: 0,
    canonical_names_with_meaning: 0,
    rows_missing_meaning: 0,
    rows_missing_meaning_premium: 0,
    rows_with_meaning_premium: 0,
    premium_rows: 0,
  };
}

async function paginate<T>(
  fetchPage: (from: number, pageSize: number) => Promise<T[]>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await fetchPage(from, PAGE_SIZE);
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return all;
}

/**
 * Pick best CNM row for a baby_names row — mirrors baby_names_with_meaning
 * ordering (language → gender scope → source_priority → verified → confidence).
 */
function pickBestCanonicalMeaning(
  cnms: CanonicalMeaningRow[],
  row: BabyNameRow,
): string | null {
  const requestedLang = (row.meaning_language?.trim() || 'en').toLowerCase();

  const eligible = cnms.filter((cnm) => {
    if (cnm.review_status === 'rejected') return false;
    if (!isNonEmptyMeaning(cnm.meaning)) return false;
    if (cnm.gender_scope !== 'any' && cnm.gender_scope !== row.gender) return false;
    const lang = cnm.meaning_language.trim().toLowerCase();
    return lang === requestedLang || lang === 'en';
  });

  if (eligible.length === 0) return null;

  eligible.sort((a, b) => {
    const langA = a.meaning_language.trim().toLowerCase() === requestedLang ? 0 : 1;
    const langB = b.meaning_language.trim().toLowerCase() === requestedLang ? 0 : 1;
    if (langA !== langB) return langA - langB;

    const genderA = a.gender_scope === row.gender ? 0 : 1;
    const genderB = b.gender_scope === row.gender ? 0 : 1;
    if (genderA !== genderB) return genderA - genderB;

    const spA = a.source_priority ?? 5;
    const spB = b.source_priority ?? 5;
    if (spA !== spB) return spA - spB;

    if (a.meaning_verified !== b.meaning_verified) {
      return a.meaning_verified ? -1 : 1;
    }

    const confA = a.meaning_confidence ?? -1;
    const confB = b.meaning_confidence ?? -1;
    if (confB !== confA) return confB - confA;

    return a.created_at.localeCompare(b.created_at);
  });

  return eligible[0]!.meaning.trim();
}

function rowHasMeaning(row: BabyNameRow, cnmByCanonical: Map<string, CanonicalMeaningRow[]>): boolean {
  if (isNonEmptyMeaning(row.meaning)) return true;
  if (!row.canonical_name_id) return false;
  const cnms = cnmByCanonical.get(row.canonical_name_id) ?? [];
  return pickBestCanonicalMeaning(cnms, row) !== null;
}

function canonicalHasMeaning(cnms: CanonicalMeaningRow[]): boolean {
  return cnms.some(
    (cnm) => cnm.review_status !== 'rejected' && isNonEmptyMeaning(cnm.meaning),
  );
}

async function fetchCanonicalMeanings(
  supabase: SupabaseClient,
): Promise<Map<string, CanonicalMeaningRow[]>> {
  const byCanonical = new Map<string, CanonicalMeaningRow[]>();

  await paginate(async (from, pageSize) => {
    const { data, error } = await supabase
      .from('canonical_name_meanings')
      .select(
        'canonical_name_id, meaning, meaning_language, gender_scope, review_status, source_priority, meaning_verified, meaning_confidence, created_at',
      )
      .order('canonical_name_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`canonical_name_meanings fetch failed: ${error.message}`);

    const rows = (data ?? []) as CanonicalMeaningRow[];
    for (const row of rows) {
      const list = byCanonical.get(row.canonical_name_id) ?? [];
      list.push(row);
      byCanonical.set(row.canonical_name_id, list);
    }
    return rows;
  });

  return byCanonical;
}

async function fetchBabyNamesForCountries(
  supabase: SupabaseClient,
  countries: string[],
): Promise<BabyNameRow[]> {
  return paginate(async (from, pageSize) => {
    const { data, error } = await supabase
      .from('baby_names')
      .select(
        'id, name, country, gender, meaning, meaning_language, canonical_name_id, is_premium, popularity_rank',
      )
      .in('country', countries)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`baby_names fetch failed: ${error.message}`);
    return (data ?? []) as BabyNameRow[];
  });
}

function addToSummary(summary: CountryCoverageSummary, delta: Partial<CountryCoverageSummary>): void {
  for (const key of Object.keys(delta) as (keyof CountryCoverageSummary)[]) {
    if (key === 'country') continue;
    summary[key] += delta[key] ?? 0;
  }
}

function compareMissing(a: MissingAggregate, b: MissingAggregate): number {
  if (a.touches_premium !== b.touches_premium) {
    return a.touches_premium ? -1 : 1;
  }
  if (b.inverse_rank_weight !== a.inverse_rank_weight) {
    return b.inverse_rank_weight - a.inverse_rank_weight;
  }
  if (b.row_count !== a.row_count) {
    return b.row_count - a.row_count;
  }
  return a.display_name.localeCompare(b.display_name);
}

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width);
}

function printSummaryTable(rows: CountryCoverageSummary[]): void {
  const headers = [
    'Country',
    'Total',
    'Uniq CN',
    'Rows+Meaning',
    'CN+Meaning',
    'Rows-Missing',
    'Prem-Miss',
    'Prem-Total',
  ];
  const widths = [18, 8, 8, 12, 11, 12, 10, 10];

  console.log(headers.map((h, i) => pad(h, widths[i]!)).join(' '));
  console.log(widths.map((w) => '-'.repeat(w)).join(' '));

  for (const row of rows) {
    console.log(
      [
        pad(row.country, widths[0]!),
        pad(row.total_rows, widths[1]!),
        pad(row.unique_canonical_names, widths[2]!),
        pad(row.rows_with_meaning, widths[3]!),
        pad(row.canonical_names_with_meaning, widths[4]!),
        pad(row.rows_missing_meaning, widths[5]!),
        pad(row.rows_missing_meaning_premium, widths[6]!),
        pad(row.premium_rows, widths[7]!),
      ].join(' '),
    );
  }
}

function printTopMissingTable(rows: MissingNameRankRow[]): void {
  console.log('\nTop missing names (by deck impact)\n');
  const headers = ['#', 'Name', 'Rows', 'PremRows', 'Impact', 'Premium', 'Countries'];
  const widths = [4, 22, 6, 9, 10, 8, 24];
  console.log(headers.map((h, i) => pad(h, widths[i]!)).join(' '));
  console.log(widths.map((w) => '-'.repeat(w)).join(' '));

  for (const row of rows) {
    console.log(
      [
        pad(row.rank, widths[0]!),
        pad(row.display_name.slice(0, 22), widths[1]!),
        pad(row.row_count, widths[2]!),
        pad(row.premium_row_count, widths[3]!),
        pad(row.inverse_rank_weight.toFixed(4), widths[4]!),
        pad(row.touches_premium ? 'yes' : 'no', widths[5]!),
        pad(row.countries.join(',').slice(0, 24), widths[6]!),
      ].join(' '),
    );
  }
}

function buildReport(
  cli: MeaningCoverageCli,
  babyRows: BabyNameRow[],
  cnmByCanonical: Map<string, CanonicalMeaningRow[]>,
): MeaningCoverageReport {
  const byCountry = new Map<string, CountryCoverageSummary>();
  for (const country of cli.countries) {
    byCountry.set(country, emptySummary(country));
  }
  const total = emptySummary('TOTAL');

  const canonicalInScope = new Map<string, Set<string>>();
  const canonicalWithMeaningInScope = new Map<string, Set<string>>();

  for (const country of cli.countries) {
    canonicalInScope.set(country, new Set());
    canonicalWithMeaningInScope.set(country, new Set());
  }

  const missingByKey = new Map<string, MissingAggregate>();

  for (const row of babyRows) {
    const summary = byCountry.get(row.country);
    if (!summary) continue;

    summary.total_rows += 1;
    const isPremium = row.is_premium === true;
    if (isPremium) summary.premium_rows += 1;

    if (row.canonical_name_id) {
      canonicalInScope.get(row.country)!.add(row.canonical_name_id);
      if (canonicalHasMeaning(cnmByCanonical.get(row.canonical_name_id) ?? [])) {
        canonicalWithMeaningInScope.get(row.country)!.add(row.canonical_name_id);
      }
    }

    const hasMeaning = rowHasMeaning(row, cnmByCanonical);
    if (hasMeaning) {
      summary.rows_with_meaning += 1;
      if (isPremium) summary.rows_with_meaning_premium += 1;
    } else {
      summary.rows_missing_meaning += 1;
      if (isPremium) summary.rows_missing_meaning_premium += 1;

      const key = row.canonical_name_id ?? `name:${row.name.trim().toLowerCase()}`;
      const agg =
        missingByKey.get(key) ??
        ({
          key,
          display_name: row.name.trim(),
          canonical_name_id: row.canonical_name_id,
          countries: new Set<string>(),
          row_count: 0,
          premium_row_count: 0,
          inverse_rank_weight: 0,
          touches_premium: false,
        } satisfies MissingAggregate);

      agg.countries.add(row.country);
      agg.row_count += 1;
      agg.inverse_rank_weight += rankWeight(row.popularity_rank);
      if (isPremium) {
        agg.premium_row_count += 1;
        agg.touches_premium = true;
      }
      missingByKey.set(key, agg);
    }
  }

  const countrySummaries: CountryCoverageSummary[] = [];
  for (const country of [...cli.countries].sort((a, b) => a.localeCompare(b))) {
    const summary = byCountry.get(country)!;
    summary.unique_canonical_names = canonicalInScope.get(country)!.size;
    summary.canonical_names_with_meaning = canonicalWithMeaningInScope.get(country)!.size;
    countrySummaries.push(summary);
    addToSummary(total, summary);
  }

  total.unique_canonical_names = new Set(
    [...canonicalInScope.values()].flatMap((set) => [...set]),
  ).size;
  total.canonical_names_with_meaning = new Set(
    [...canonicalWithMeaningInScope.values()].flatMap((set) => [...set]),
  ).size;

  const topMissing = [...missingByKey.values()]
    .sort(compareMissing)
    .slice(0, TOP_MISSING)
    .map((row, index) => ({
      rank: index + 1,
      display_name: row.display_name,
      canonical_name_id: row.canonical_name_id,
      countries: [...row.countries].sort((a, b) => a.localeCompare(b)),
      row_count: row.row_count,
      inverse_rank_weight: Number(row.inverse_rank_weight.toFixed(6)),
      touches_premium: row.touches_premium,
      premium_row_count: row.premium_row_count,
    }));

  return {
    generated_at: new Date().toISOString(),
    countries: [...cli.countries].sort((a, b) => a.localeCompare(b)),
    by_country: countrySummaries,
    total,
    top_missing: topMissing,
  };
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    console.log(`Supabase host (read-only): ${new URL(url).hostname}`);
  } catch {
    /* ignore */
  }

  console.log(`[reportMeaningCoverage] countries=${cli.countries.join(',')}`);

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [cnmByCanonical, babyRows] = await Promise.all([
    fetchCanonicalMeanings(supabase),
    fetchBabyNamesForCountries(supabase, cli.countries),
  ]);

  const report = buildReport(cli, babyRows, cnmByCanonical);

  printSummaryTable([...report.by_country, report.total]);
  printTopMissingTable(report.top_missing);

  if (cli.jsonOut) {
    const absOut = path.isAbsolute(cli.jsonOut)
      ? cli.jsonOut
      : path.join(process.cwd(), cli.jsonOut);
    mkdirSync(path.dirname(absOut), { recursive: true });
    writeFileSync(absOut, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`\n[reportMeaningCoverage] JSON → ${cli.jsonOut}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
