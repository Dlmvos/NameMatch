import { getBundledNames } from '../data/names';
import { countriesForRegion, findCountry, type CountryOption } from '../data/countries';
import { rarityFromPopularityRank } from '../lib/rarityFromPopularityRank';
import { supabase } from '../lib/supabase';
import type { AppLanguage, BabyName, Region } from '../types';
import { isOriginFilterWorldwide, isWorldwideOriginName } from '../types';
import { enrichName } from './nameEnrichment';
import {
  fetchPremiumMeaningTranslationsForIds,
  fetchPublicMeaningTranslationsForIds,
} from './premiumMeaningTranslationsRemote';

export interface PremiumBundledSourceOptions {
  /** When true, caller asserts premium entitlement (e.g. unlocked packs). */
  includePremium: boolean;
}

/**
 * Premium localized meanings: merged into remote premium rows via `premium_meaning_translations`
 * (entitlement-aligned RLS). Core/free names still use bundled JSON only.
 *
 * Server entitlement (RLS on `public.baby_names`):
 * - Non-premium rows: selectable by anyone (anon + authenticated).
 * - `is_premium = true` rows: selectable only when `auth.uid()` has `cardinality(purchased_packs) > 0`.
 * - The client gates the fetch with `includePremium`; if RLS denies or returns empty, callers use
 *   core-only bundled names (no bundled premium fallback).
 */
export interface FetchRemotePremiumNamesOptions {
  includePremium: boolean;
  userId: string | null;
  /** Active UI language (e.g. `effectiveLanguage`); used to fetch premium meaning rows only for this locale (+ base). */
  meaningLocale: string;
}

/** Non-premium `baby_names` rows for deck enrichment (RLS allows reads without packs). */
export interface FetchRemotePublicDeckSupplementOptions {
  /** Row cap for the *diversity* slice (clamped 1..MAX_PUBLIC_DECK_SUPPLEMENT_LIMIT). */
  limit?: number;
  /** When set and not `WORLDWIDE`, restricts to matching region or worldwide-flagged rows. */
  region?: Region | null;
  /**
   * User's own country preference. When set we add a targeted `.eq('country', country)`
   * fetch on top of the diversity slice so the user's home culture isn't capped at the
   * ~limit/N share the region-balanced fetch gives it. Drains the user's country tail
   * up to COUNTRY_FOCUS_LIMIT before falling back to the balanced supplement.
   */
  country?: string | null;
  /** When `boy` / `girl`, restricts to that gender plus `neutral`. `both` = no gender filter. */
  gender?: 'boy' | 'girl' | 'both' | null;
  /** Active UI language; merges `public.name_meaning_translations` into returned names when present. */
  meaningLocale?: string;
  /**
   * Active country/culture chip(s) from the UI filter. When set we add targeted country-IN
   * fetches for each selected country so filtered decks are not capped by the diversity sample.
   */
  origins?: string[];
  /**
   * Two-phase publish hook. Fires as soon as the targeted-country slice (own
   * country + active origin chips) resolves — typically ~300-800ms — so the
   * caller can update its visible supplement before the slower diversity slice
   * arrives. The final returned array still contains the merged set. The
   * callback receives translated rows; safe to call `setState` directly.
   *
   * Use case: country-change re-fetch where waiting on `Promise.all` for the
   * diversity slice (~2-4s) would otherwise stall the UI on the targeted rows
   * the user actually cares about most.
   */
  onTargetedReady?: (targetedRows: BabyName[]) => void;
}

const DEFAULT_PUBLIC_DECK_SUPPLEMENT_LIMIT = 600;
const MAX_PUBLIC_DECK_SUPPLEMENT_LIMIT = 1500;
/** Cap on the user's own-country tail. Lets a Dutch user see ~all Dutch DB rows. */
const COUNTRY_FOCUS_LIMIT = 1000;
/** Cap on a selected-country tail (per chip). Same logic for the active UI filter. */
const ORIGIN_FOCUS_LIMIT_PER_TAG = 1000;
/** Cap on the premium remote fetch. Without an explicit `.limit()` PostgREST quietly caps at 1000. */
const PREMIUM_REMOTE_LIMIT = 5000;

/** Regions fetched in parallel for WORLDWIDE supplement (equal caps + round-robin). */
const WORLDWIDE_PUBLIC_SUPPLEMENT_REGIONS: Region[] = ['US', 'EU', 'LATIN_AMERICA'];

type BabyNamePremiumRow = {
  id: string;
  name: string;
  meaning: string | null;
  origin: string | null;
  gender: string;
  country: string | null;
  region: string;
  is_worldwide: boolean;
  popularity_rank: number | null;
  /** Shared identity across (name × country) variants. Required for
   * cross-country swipe exclusion and canonical deck dedup. */
  canonical_name_id: string | null;
};

/** DB `meaning` when present; otherwise a short catalog fallback so swipe UI is not blank (bulk EU imports often store `meaning: null`). */
function meaningFromBabyNameRow(row: BabyNamePremiumRow): string {
  const direct = row.meaning?.trim();
  if (direct) return direct;
  const c = row.country?.trim();
  if (c) return `A popular given name in ${c}.`;
  const o = row.origin?.trim();
  if (o) return `A popular given name (${o}).`;
  return '';
}

function mapRowToBabyName(
  row: BabyNamePremiumRow,
  meaningTranslations?: BabyName['meaningTranslations'],
): BabyName {
  const enriched = enrichName(row.name);
  const popularity_rank = row.popularity_rank ?? enriched.popularity_rank;
  return {
    id: row.id,
    name: row.name,
    meaning: meaningFromBabyNameRow(row),
    origin: row.origin ?? '',
    gender: row.gender as BabyName['gender'],
    country: row.country ?? undefined,
    region: row.region as Region,
    is_worldwide: row.is_worldwide,
    canonical_name_id: row.canonical_name_id ?? undefined,
    meaningTranslations,
    popularity_rank,
    rarity: rarityFromPopularityRank(popularity_rank),
    trend: enriched.trend,
    pronunciation: enriched.pronunciation,
    similar_names: enriched.similar_names,
  };
}

function meaningTranslationKeysForLocale(userLocale: string): [AppLanguage | string, AppLanguage | string] {
  const exact = String(userLocale ?? '').trim();
  const normalized = exact.split(/[-_]/)[0]?.toLowerCase() ?? '';
  return [exact, normalized];
}

function buildMeaningTranslationsForRemoteName(
  userLocale: string,
  text: string | undefined,
): BabyName['meaningTranslations'] | undefined {
  if (!text?.trim()) return undefined;
  const [exact, normalized] = meaningTranslationKeysForLocale(userLocale);
  const out: NonNullable<BabyName['meaningTranslations']> = {};
  if (exact) out[exact as AppLanguage] = text;
  if (normalized && normalized !== exact) out[normalized as AppLanguage] = text;
  return out;
}

/** Gender filter for public supplement/count queries — omit filter for both/all/unset. */
type PublicSupplementGender = 'boy' | 'girl' | 'both' | 'all' | null | undefined;

type PublicCountryCountResult = {
  count: number;
  error: string | null;
};

type PublicCountryAvailabilityProbe = {
  country: string;
  /** Exact DB count when the count query succeeded; 0 when it failed. */
  count: number;
  /** True when count failed but a limit-1 row fetch proved rows exist. */
  fallbackAvailable: boolean;
  countError: string | null;
};

function applyPublicSupplementGenderFilter<T extends { in: (c: string, v: string[]) => T }>(
  query: T,
  gender: PublicSupplementGender,
): T {
  if (gender === 'boy') return query.in('gender', ['boy', 'neutral']);
  if (gender === 'girl') return query.in('gender', ['girl', 'neutral']);
  return query;
}

function publicSupplementGenderForFetch(
  gender: PublicSupplementGender,
): 'boy' | 'girl' | 'both' {
  if (gender === 'boy' || gender === 'girl') return gender;
  return 'both';
}

/**
 * Fetches `name_meaning_translations` (with id + normalized-name fallback) and merges into
 * `meaningTranslations`. For the active locale keys (exact + base), DB text always wins over
 * bundled/static values; other locale keys are left unchanged.
 */
async function attachPublicMeaningTranslationsForNames(
  names: BabyName[],
  meaningLocale: string | undefined,
): Promise<{ names: BabyName[]; matched: number }> {
  const locale = String(meaningLocale ?? '').trim();
  if (!locale || names.length === 0) {
    return { names, matched: 0 };
  }

  const byId = await fetchPublicMeaningTranslationsForIds(
    names.map((n) => ({ id: n.id, name: n.name })),
    locale,
  );

  let matched = 0;
  const out = names.map((name) => {
    const t = byId[name.id];
    if (!t?.trim()) return name;
    const dbKeys = buildMeaningTranslationsForRemoteName(locale, t);
    if (!dbKeys || Object.keys(dbKeys).length === 0) return name;

    const merged: NonNullable<BabyName['meaningTranslations']> = {
      ...(name.meaningTranslations ?? {}),
    };
    let applied = false;
    for (const [key, value] of Object.entries(dbKeys)) {
      if (!value?.trim()) continue;
      const k = key as AppLanguage;
      merged[k] = value;
      applied = true;
    }
    if (!applied) return name;
    matched += 1;
    return { ...name, meaningTranslations: merged };
  });

  return { names: out, matched };
}

async function attachPublicMeaningTranslations(
  names: BabyName[],
  meaningLocale: string | undefined,
): Promise<BabyName[]> {
  const locale = String(meaningLocale ?? '').trim();
  if (!locale || names.length === 0) return names;
  const byId = await fetchPublicMeaningTranslationsForIds(
    names.map((n) => ({ id: n.id, name: n.name })),
    locale,
  );
  return names.map((name) => {
    const t = byId[name.id];
    const meaningTranslations = buildMeaningTranslationsForRemoteName(locale, t);
    return meaningTranslations ? { ...name, meaningTranslations } : name;
  });
}

/** Round-robin merge up to `maxTotal` rows; skips duplicate ids within the supplement. */
function interleavePublicSupplementSlices(slices: BabyName[][], maxTotal: number): BabyName[] {
  const out: BabyName[] = [];
  const seenId = new Set<string>();
  const idx = slices.map(() => 0);
  while (out.length < maxTotal) {
    let progressed = false;
    for (let r = 0; r < slices.length; r++) {
      const slice = slices[r];
      let i = idx[r];
      while (i < slice.length && out.length < maxTotal) {
        const n = slice[i++];
        if (!seenId.has(n.id)) {
          seenId.add(n.id);
          out.push(n);
          progressed = true;
          break;
        }
      }
      idx[r] = i;
    }
    if (!progressed) break;
  }
  return out;
}

/**
 * Country-targeted fetch — no region constraint, no row-balancing across the
 * region's other countries. Used for the user's own `countryPreference` tail
 * and for origin-filter pushdown, so e.g. picking Dutch in the UI now pulls
 * every Netherlands+Belgium row up to `limit` from Supabase instead of
 * relying on the diversity sample to have happened to draw them.
 */
function buildTargetedCountryFetchPlan(
  country: string | null,
  originCountries: string[],
): { uniqueCountries: string[]; limit: number; includeWorldwideOrigin: boolean } | null {
  const realOrigins = originCountries.filter((c) => !isOriginFilterWorldwide(c));
  const includeWorldwideOrigin = originCountries.some(isOriginFilterWorldwide);
  const uniqueCountries: string[] = [];
  if (country) uniqueCountries.push(country);
  for (const c of realOrigins) {
    if (!uniqueCountries.includes(c)) uniqueCountries.push(c);
  }
  if (uniqueCountries.length === 0 && !includeWorldwideOrigin) return null;

  let limit = 0;
  if (country) limit += COUNTRY_FOCUS_LIMIT;
  for (const _ of realOrigins) {
    limit += ORIGIN_FOCUS_LIMIT_PER_TAG;
  }
  if (includeWorldwideOrigin) {
    limit += ORIGIN_FOCUS_LIMIT_PER_TAG;
  }
  return { uniqueCountries, limit, includeWorldwideOrigin };
}

/** Preserves targeted-first merge order: home country slice, then each origin chip in UI order. */
function partitionTargetedRowsByPriority(
  rows: BabyName[],
  country: string | null,
  originCountries: string[],
): BabyName[][] {
  const byCountry = new Map<string, BabyName[]>();
  const worldwideRows: BabyName[] = [];
  for (const n of rows) {
    if (isWorldwideOriginName(n)) {
      worldwideRows.push(n);
      continue;
    }
    const c = (n.country ?? '').trim();
    if (!c) continue;
    const list = byCountry.get(c) ?? [];
    list.push(n);
    byCountry.set(c, list);
  }
  const slices: BabyName[][] = [];
  if (country) {
    const home = byCountry.get(country);
    if (home?.length) slices.push(home);
  }
  for (const c of originCountries) {
    if (isOriginFilterWorldwide(c)) {
      if (worldwideRows.length) slices.push(worldwideRows);
      continue;
    }
    if (country && c === country) continue;
    const slice = byCountry.get(c);
    if (slice?.length) slices.push(slice);
  }
  return slices;
}

async function fetchPublicWorldwideOriginRows(
  limit: number,
  gender: 'boy' | 'girl' | 'both',
): Promise<BabyName[]> {
  if (limit <= 0) return [];
  let q = supabase
    .from('baby_names')
    .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank,canonical_name_id')
    .eq('is_premium', false)
    .or('is_worldwide.eq.true,country.is.null');
  q = applyPublicSupplementGenderFilter(q, gender);
  q = q.order('popularity_rank', { ascending: true, nullsFirst: false }).limit(limit);
  const { data, error } = await q;
  if (error) return [];
  const rows = (data ?? []) as BabyNamePremiumRow[];
  return rows.map((row) => mapRowToBabyName(row));
}

async function fetchPublicRowsByCountryList(
  countries: string[],
  limit: number,
  gender: 'boy' | 'girl' | 'both',
): Promise<BabyName[]> {
  if (limit <= 0 || countries.length === 0) return [];
  let q = supabase
    .from('baby_names')
    .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank,canonical_name_id')
    .eq('is_premium', false)
    .in('country', countries);
  q = applyPublicSupplementGenderFilter(q, gender);
  q = q.order('popularity_rank', { ascending: true, nullsFirst: false }).limit(limit);
  const { data, error } = await q;
  if (error) return [];
  const rows = (data ?? []) as BabyNamePremiumRow[];
  return rows.map((row) => mapRowToBabyName(row));
}

async function fetchPublicRowsForRegionCountry(
  region: Region,
  country: string,
  limit: number,
  gender: 'boy' | 'girl' | 'both',
): Promise<BabyName[]> {
  if (limit <= 0) return [];
  let q = supabase
    .from('baby_names')
    .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank,canonical_name_id')
    .eq('is_premium', false)
    .eq('region', region)
    .eq('country', country);
  q = applyPublicSupplementGenderFilter(q, gender);
  q = q.order('popularity_rank', { ascending: true, nullsFirst: false }).limit(limit);
  const { data, error } = await q;
  if (error) return [];
  const rows = (data ?? []) as BabyNamePremiumRow[];
  return rows.map((row) => mapRowToBabyName(row));
}

/**
 * One-shot environment diagnostic. Triggered from
 * `countPublicBabyNamesForRegionCountry` the first time it runs in this app
 * session. Compares an entirely-unfiltered baby_names count, individual
 * country counts (Brazil/Spain/Belgium — known to have thousands of rows in
 * the service-role report), and a bare `is_premium=false` count against
 * what the actual filtered probe will return.
 *
 * If any of these come back at single-digit values while the service-role
 * report saw ~55k, the app is connected to the wrong Supabase project (or
 * an RLS policy is silently masking rows for the anon role). Either way,
 * the discrepancy will be obvious from a single log line.
 *
 * Side effects: one HEAD request per probe (six total). Logs to `console.log`
 * via the `[baby_names-diag]` tag so it's greppable in the Metro / device
 * console. Runs at most once per app session.
 */
let bnDiagnosticRan = false;
async function runBabyNamesDrillDownDiagnosticOnce(): Promise<void> {
  if (bnDiagnosticRan) return;
  bnDiagnosticRan = true;

  // Diagnostic-only — `any` is fine here. The supabase JS client builder is
  // fluent so adding `.eq()` calls returns the same builder type; we only
  // need the terminal `{ count, error }` shape.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const headCount = async (
    label: string,
    apply: (q: any) => any,
  ): Promise<void> => {
    try {
      const base = supabase
        .from('baby_names')
        .select('id', { count: 'exact', head: true });
      const { count, error } = await apply(base);
      if (error) {
        console.log('[baby_names-diag]', label, 'ERR', error.code ?? '', error.message);
      } else {
        console.log('[baby_names-diag]', label, '=', count ?? 0);
      }
    } catch (e) {
      console.log(
        '[baby_names-diag]',
        label,
        'EXC',
        e instanceof Error ? e.message : String(e),
      );
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // 1. Total rows, no filter at all. Should match service-role report (~54919).
  await headCount('total', (q) => q);
  // 2..4. Bare country counts (no region, no is_premium, no gender).
  await headCount("country='Brazil'", (q) => q.eq('country', 'Brazil'));
  await headCount("country='Spain'", (q) => q.eq('country', 'Spain'));
  await headCount("country='Belgium'", (q) => q.eq('country', 'Belgium'));
  // 5. is_premium=false only — proves whether the premium gate is the cause.
  await headCount('is_premium=false', (q) => q.eq('is_premium', false));
  // 6. Sample (region+country+is_premium) — same filter the supplement uses,
  //    no gender. If 5 comes back ~30k and this comes back single-digit, the
  //    region/country combination is the masking input.
  await headCount('EU+Belgium+is_premium=false', (q) =>
    q.eq('region', 'EU').eq('country', 'Belgium').eq('is_premium', false),
  );
  await headCount('EU+Spain+is_premium=false', (q) =>
    q.eq('region', 'EU').eq('country', 'Spain').eq('is_premium', false),
  );
  await headCount('LATIN_AMERICA+Brazil+is_premium=false', (q) =>
    q.eq('region', 'LATIN_AMERICA').eq('country', 'Brazil').eq('is_premium', false),
  );
}

/** Exact public-catalog row count for region-balanced supplement planning. */
async function countPublicBabyNamesForRegionCountry(
  region: Region,
  /** Canonical `baby_names.country` value (COUNTRY_OPTIONS.name), never a localized UI label. */
  country: string,
  gender: PublicSupplementGender,
): Promise<PublicCountryCountResult> {
  // Fire-and-forget; first call kicks off the drill-down. We don't await it
  // — the probe must not block the supplement build. Subsequent calls are
  // cheap no-ops via the `bnDiagnosticRan` flag.
  void runBabyNamesDrillDownDiagnosticOnce();

  const genderLabel = gender ?? 'both';
  let q = supabase
    .from('baby_names')
    .select('id', { count: 'exact', head: true })
    .eq('is_premium', false)
    .eq('region', region)
    .eq('country', country);
  // Spec: gender filter MUST be a no-op when gender === 'both' (or null).
  // applyPublicSupplementGenderFilter already short-circuits in that case;
  // re-stating here so a future refactor doesn't quietly add a 'both' arm.
  if (gender === 'boy' || gender === 'girl') {
    q = applyPublicSupplementGenderFilter(q, gender);
  }
  const { count, error } = await q;

  if (error) {
    console.warn('[PremiumContentService] countPublicBabyNamesForRegionCountry failed', {
      region,
      country,
      gender: genderLabel,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    console.log('[filter-count]', region, country, genderLabel, null, error.message);
    return { count: 0, error: error.message };
  }

  const resolvedCount = count ?? 0;
  console.log('[filter-count]', region, country, genderLabel, resolvedCount, '');
  return { count: resolvedCount, error: null };
}

/**
 * Exact count with availability fallback for region-balanced country inclusion.
 * Never treats the limit-1 probe row count as the displayed total.
 */
async function probePublicCountryAvailability(
  countryOption: CountryOption,
  gender: PublicSupplementGender,
): Promise<PublicCountryAvailabilityProbe> {
  const canonicalCountry = countryOption.name;
  const canonicalRegion = countryOption.region;

  if (canonicalCountry === 'Brazil' && canonicalRegion !== 'LATIN_AMERICA') {
    console.warn('[PremiumContentService] Brazil must use canonical region LATIN_AMERICA', {
      country: canonicalCountry,
      region: canonicalRegion,
    });
  }

  const { count, error } = await countPublicBabyNamesForRegionCountry(
    canonicalRegion,
    canonicalCountry,
    gender,
  );

  if (!error) {
    return {
      country: canonicalCountry,
      count,
      fallbackAvailable: false,
      countError: null,
    };
  }

  const rows = await fetchPublicRowsForRegionCountry(
    canonicalRegion,
    canonicalCountry,
    1,
    publicSupplementGenderForFetch(gender),
  );
  const fallbackAvailable = rows.length > 0;
  if (fallbackAvailable) {
    console.log(
      '[filter-count]',
      canonicalRegion,
      canonicalCountry,
      gender ?? 'both',
      null,
      `fallback_available (${error})`,
    );
  }

  return {
    country: canonicalCountry,
    count: 0,
    fallbackAvailable,
    countError: error,
  };
}

async function fetchWorldwideBalancedPublicRows(
  limit: number,
  gender: 'boy' | 'girl' | 'both',
  meaningLocale: string | undefined,
): Promise<BabyName[]> {
  const regions = WORLDWIDE_PUBLIC_SUPPLEMENT_REGIONS;
  const n = regions.length;
  const basePer = Math.floor(limit / n);
  const remainder = limit % n;
  const caps = regions.map((_, i) => basePer + (i < remainder ? 1 : 0));

  const rowSlices = await Promise.all(
    regions.map(async (reg, i) => {
      const cap = caps[i];
      let q = supabase
        .from('baby_names')
        .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank,canonical_name_id')
        .eq('is_premium', false)
        .eq('region', reg);
      q = applyPublicSupplementGenderFilter(q, gender);
      q = q.order('popularity_rank', { ascending: true, nullsFirst: false }).limit(cap);
      const { data, error } = await q;
      if (error) return [] as BabyNamePremiumRow[];
      return (data ?? []) as BabyNamePremiumRow[];
    }),
  );

  const nameSlices = rowSlices.map((rows) => rows.map((row) => mapRowToBabyName(row)));
  const interleaved = interleavePublicSupplementSlices(nameSlices, limit);
  return attachPublicMeaningTranslations(interleaved, meaningLocale);
}

async function fetchRegionCountryBalancedPublicRows(
  region: Region,
  limit: number,
  gender: 'boy' | 'girl' | 'both',
  meaningLocale: string | undefined,
): Promise<BabyName[]> {
  const countries = countriesForRegion(region);
  if (__DEV__) {
    console.log('[PremiumContentService] region-balanced supplement: countries configured', {
      region,
      limit,
      gender,
      countries: countries.map((country) => country.name),
      spainConfigured: countries.some((country) => country.name === 'Spain'),
    });
  }
  if (countries.length === 0) return [];

  const countryProbes = await Promise.all(
    countries.map((countryOption) => probePublicCountryAvailability(countryOption, gender)),
  );
  const activeCountries = countryProbes
    .filter((probe) => probe.count > 0 || probe.fallbackAvailable)
    .map((probe) => probe.country);

  if (__DEV__) {
    const spainProbe = countryProbes.find((probe) => probe.country === 'Spain');
    const brazilProbe = countryProbes.find((probe) => probe.country === 'Brazil');
    console.log('[PremiumContentService] region-balanced supplement: country probes', {
      region,
      probeCounts: countryProbes.reduce<
        Record<string, { count: number; fallbackAvailable: boolean; countError: string | null }>
      >((acc, probe) => {
        acc[probe.country] = {
          count: probe.count,
          fallbackAvailable: probe.fallbackAvailable,
          countError: probe.countError,
        };
        return acc;
      }, {}),
      activeCountries,
      spainStatus: {
        configured: countries.some((country) => country.name === 'Spain'),
        probeCount: spainProbe?.count ?? null,
        fallbackAvailable: spainProbe?.fallbackAvailable ?? false,
        active: activeCountries.includes('Spain'),
      },
      brazilStatus: {
        configured: countries.some((country) => country.name === 'Brazil'),
        probeCount: brazilProbe?.count ?? null,
        fallbackAvailable: brazilProbe?.fallbackAvailable ?? false,
        countError: brazilProbe?.countError ?? null,
        active: activeCountries.includes('Brazil'),
        canonicalRegion: findCountry('Brazil')?.region ?? null,
      },
    });
  }

  if (activeCountries.length === 0) return [];

  const basePer = Math.floor(limit / activeCountries.length);
  const remainder = limit % activeCountries.length;
  const slices = await Promise.all(
    activeCountries.map((country, i) => {
      const countryRegion = findCountry(country)?.region ?? region;
      return fetchPublicRowsForRegionCountry(
        countryRegion,
        country,
        basePer + (i < remainder ? 1 : 0),
        gender,
      );
    }),
  );

  const out = interleavePublicSupplementSlices(slices, limit);
  if (__DEV__) {
    const finalCounts = activeCountries.reduce<Record<string, number>>((acc, country, i) => {
      acc[country] = slices[i]?.length ?? 0;
      return acc;
    }, {});
    console.log('[PremiumContentService] region-balanced supplement: final slices', {
      region,
      basePer,
      remainder,
      finalCounts,
      interleavedCount: out.length,
      spainStatus: {
        active: activeCountries.includes('Spain'),
        finalCount: finalCounts.Spain ?? 0,
        presentAfterInterleave: out.some((name) => name.country === 'Spain'),
      },
    });
  }
  return attachPublicMeaningTranslations(out, meaningLocale);
}

/**
 * Single boundary for premium vs core name sourcing.
 * - Core/free names: bundled via `getBundledNames()` (core-only; no premium in the app bundle).
 * - Premium: remote `baby_names` where `is_premium`; on failure/empty/not entitled → deck uses core-only
 *   (no bundled premium fallback).
 */
export const PremiumContentService = {
  getBundledNamesForSource(_opts: PremiumBundledSourceOptions): BabyName[] {
    return getBundledNames();
  },

  /**
   * Fetches premium rows from Supabase when the client asserts entitlement.
   * Returns `null` on error, empty result, or missing entitlement (caller merges core-only).
   */
  /**
   * Fetches non-premium catalog rows for swipe deck supplement. Returns [] on error or empty.
   * Does not overlap premium entitlement — `is_premium` is always false.
   */
  async fetchRemotePublicDeckSupplement(opts: FetchRemotePublicDeckSupplementOptions): Promise<BabyName[]> {
    try {
      const rawLimit = opts.limit ?? DEFAULT_PUBLIC_DECK_SUPPLEMENT_LIMIT;
      const limit = Math.min(
        MAX_PUBLIC_DECK_SUPPLEMENT_LIMIT,
        Math.max(1, Math.floor(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_PUBLIC_DECK_SUPPLEMENT_LIMIT)),
      );

      const region = opts.region ?? null;
      const gender = opts.gender ?? 'both';
      const meaningLocale = opts.meaningLocale;
      const country = opts.country?.trim() || null;
      const originCountries = [
        ...new Set(
          (opts.origins ?? [])
            .map((c) => c.trim())
            .filter((c) => c.length > 0 && c !== 'spanish' && c !== 'dutch'),
        ),
      ];

      // Single targeted `.in('country', …)` fetch (replaces N per-country queries).
      // Partition + merge preserves home-country-first semantics from the prior multi-fetch path.
      const targetedPlan = buildTargetedCountryFetchPlan(country, originCountries);
      const targetedTask: Promise<BabyName[]> = targetedPlan
        ? (async () => {
            const perCountryLimit = Math.max(
              1,
              Math.floor(
                targetedPlan.limit /
                  Math.max(
                    1,
                    targetedPlan.uniqueCountries.length +
                      (targetedPlan.includeWorldwideOrigin ? 1 : 0),
                  ),
              ),
            );
            const [countryRows, worldwideRows] = await Promise.all([
              targetedPlan.uniqueCountries.length > 0
                ? fetchPublicRowsByCountryList(
                    targetedPlan.uniqueCountries,
                    targetedPlan.limit,
                    gender,
                  )
                : Promise.resolve([] as BabyName[]),
              targetedPlan.includeWorldwideOrigin
                ? fetchPublicWorldwideOriginRows(perCountryLimit, gender)
                : Promise.resolve([] as BabyName[]),
            ]);
            const byId = new Map<string, BabyName>();
            for (const n of [...countryRows, ...worldwideRows]) {
              if (!byId.has(n.id)) byId.set(n.id, n);
            }
            return Array.from(byId.values());
          })()
        : Promise.resolve([]);

      const diversityTask: Promise<BabyName[]> = (async () => {
        if (region === 'WORLDWIDE') {
          return await fetchWorldwideBalancedPublicRows(limit, gender, meaningLocale);
        }
        if (region) {
          const balancedRows = await fetchRegionCountryBalancedPublicRows(region, limit, gender, meaningLocale);
          if (balancedRows.length > 0) {
            return balancedRows;
          }
        }

        let query = supabase
          .from('baby_names')
          .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank,canonical_name_id')
          .eq('is_premium', false);

        if (region) {
          query = query.or(`region.eq.${region},is_worldwide.eq.true`);
        }

        query = applyPublicSupplementGenderFilter(query, gender);

        query = query.order('popularity_rank', { ascending: true, nullsFirst: false }).limit(limit);

        const { data, error } = await query;
        if (error) {
          return [] as BabyName[];
        }

        const rows = (data ?? []) as BabyNamePremiumRow[];
        return rows.map((row) => mapRowToBabyName(row));
      })();

      // Two-phase publish: fire `onTargetedReady` as soon as the targeted
      // country slice resolves (~300-800ms) so country-change re-fetches don't
      // stall behind the diversity slice (~2-4s). The final merged set is
      // returned at the end as usual; callers without the hook are unaffected.
      const onTargetedReady = opts.onTargetedReady;

      const targetedPhase = (async () => {
        if (!targetedPlan || !onTargetedReady) return;
        try {
          const targetedRowsEarly = await targetedTask;
          const targetedSlicesEarly = partitionTargetedRowsByPriority(
            targetedRowsEarly,
            country,
            originCountries,
          );
          const earlyById = new Map<string, BabyName>();
          for (const slice of targetedSlicesEarly) {
            for (const n of slice) {
              if (!earlyById.has(n.id)) earlyById.set(n.id, n);
            }
          }
          if (earlyById.size === 0) return;
          const earlyMerged = Array.from(earlyById.values());
          const translatedEarly = await attachPublicMeaningTranslations(earlyMerged, meaningLocale);
          onTargetedReady(translatedEarly);
        } catch {
          // Early publish is best-effort; the final return still resolves correctly below.
        }
      })();

      // Order targeted-first so the head of namesToSwipe leads with the user's
      // own country / the active origin chips, then falls back to the diversity tail.
      const [diversity, targetedRows] = await Promise.all([diversityTask, targetedTask]);
      // Ensure the early-publish phase has settled before the final return so
      // we don't race a stale early callback over the final state update.
      await targetedPhase;
      const targetedSlices = targetedPlan
        ? partitionTargetedRowsByPriority(targetedRows, country, originCountries)
        : [];
      const mergedById = new Map<string, BabyName>();
      for (const slice of targetedSlices) {
        for (const n of slice) {
          if (!mergedById.has(n.id)) mergedById.set(n.id, n);
        }
      }
      for (const n of diversity) {
        if (!mergedById.has(n.id)) mergedById.set(n.id, n);
      }
      const merged = Array.from(mergedById.values());
      return attachPublicMeaningTranslations(merged, meaningLocale);
    } catch {
      return [];
    }
  },

  async fetchRemotePremiumNames(opts: FetchRemotePremiumNamesOptions): Promise<BabyName[] | null> {
    if (!opts.includePremium || !opts.userId) {
      return null;
    }

    try {
      // Without an explicit .limit() PostgREST quietly caps this at its default
      // (1000 in a stock Supabase project) — silently truncating the premium
      // tail on a 37k-row catalog. Explicitly request the full eligible window
      // so paid users with a pack actually receive the catalog they paid for.
      const { data, error } = await supabase
        .from('baby_names')
        .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank,canonical_name_id')
        .eq('is_premium', true)
        .order('popularity_rank', { ascending: true, nullsFirst: false })
        .limit(PREMIUM_REMOTE_LIMIT);

      if (error) {
        return null;
      }

      const rows = (data ?? []) as BabyNamePremiumRow[];
      if (rows.length === 0) {
        return null;
      }

      const ids = rows.map((r) => r.id);
      const byId = await fetchPremiumMeaningTranslationsForIds(ids, opts.meaningLocale);

      return rows.map((row) => {
        const t = byId[row.id];
        const meaningTranslations = buildMeaningTranslationsForRemoteName(opts.meaningLocale, t);
        return mapRowToBabyName(row, meaningTranslations);
      });
    } catch {
      return null;
    }
  },

  /** Core bundled names only (for merging with a successful remote premium list). */
  getCoreBundledNames(): BabyName[] {
    return getBundledNames();
  },

  /**
   * Merges localized rows from `public.name_meaning_translations` into public-catalog `BabyName`s.
   */
  mergePublicMeaningTranslationsForBabyNames(
    names: BabyName[],
    meaningLocale: string | undefined,
  ): Promise<BabyName[]> {
    return attachPublicMeaningTranslations(names, meaningLocale);
  },

  attachPublicMeaningTranslationsForNames,
};
