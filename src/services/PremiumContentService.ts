import { getBundledNames } from '../data/names';
import { countriesForRegion } from '../data/countries';
import { rarityFromPopularityRank } from '../lib/rarityFromPopularityRank';
import { supabase } from '../lib/supabase';
import type { AppLanguage, BabyName, Region } from '../types';
import { enrichName } from './nameEnrichment';
import { fetchPremiumMeaningTranslationsForIds } from './premiumMeaningTranslationsRemote';

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
  /** Row cap (clamped 1..500). Default 400 so the first supplement stays easy to validate. */
  limit?: number;
  /** When set and not `WORLDWIDE`, restricts to matching region or worldwide-flagged rows. */
  region?: Region | null;
  /** When `boy` / `girl`, restricts to that gender plus `neutral`. `both` = no gender filter. */
  gender?: 'boy' | 'girl' | 'both' | null;
}

const DEFAULT_PUBLIC_DECK_SUPPLEMENT_LIMIT = 400;
const MAX_PUBLIC_DECK_SUPPLEMENT_LIMIT = 500;

/** Regions fetched in parallel for WORLDWIDE supplement (equal caps + round-robin). */
const WORLDWIDE_PUBLIC_SUPPLEMENT_REGIONS: Region[] = ['US', 'EU', 'LATIN_AMERICA'];

/** Paged `.in('country', …)` reads for regional supplements (PostgREST row caps). */
const REGIONAL_PUBLIC_SUPPLEMENT_PAGE_SIZE = 1000;
/** Hard stop so a sparse catalog cannot page indefinitely. */
const REGIONAL_PUBLIC_SUPPLEMENT_MAX_PAGES = 40;

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

function applyPublicSupplementGenderFilter<T extends { in: (c: string, v: string[]) => T }>(
  query: T,
  gender: 'boy' | 'girl' | 'both',
): T {
  if (gender === 'boy') return query.in('gender', ['boy', 'neutral']);
  if (gender === 'girl') return query.in('gender', ['girl', 'neutral']);
  return query;
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

async function fetchWorldwideBalancedPublicRows(
  limit: number,
  gender: 'boy' | 'girl' | 'both',
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
        .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank')
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
  return interleavePublicSupplementSlices(nameSlices, limit);
}

async function fetchRegionCountryBalancedPublicRows(
  region: Region,
  limit: number,
  gender: 'boy' | 'girl' | 'both',
): Promise<BabyName[]> {
  const countries = countriesForRegion(region);
  const countryNames = countries.map((country) => country.name);
  if (__DEV__) {
    console.log('[PremiumContentService] region-balanced supplement: countries configured', {
      region,
      limit,
      gender,
      countries: countryNames,
      spainConfigured: countries.some((country) => country.name === 'Spain'),
    });
  }
  if (countryNames.length === 0) return [];

  const bucketCap = limit;
  const buckets = new Map<string, BabyNamePremiumRow[]>();
  for (const c of countryNames) buckets.set(c, []);

  let from = 0;
  for (let page = 0; page < REGIONAL_PUBLIC_SUPPLEMENT_MAX_PAGES; page++) {
    let q = supabase
      .from('baby_names')
      .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank')
      .eq('is_premium', false)
      .eq('region', region)
      .in('country', countryNames);
    q = applyPublicSupplementGenderFilter(q, gender);
    q = q
      .order('country', { ascending: true })
      .order('popularity_rank', { ascending: true, nullsFirst: false })
      .range(from, from + REGIONAL_PUBLIC_SUPPLEMENT_PAGE_SIZE - 1);
    const { data, error } = await q;
    if (error) break;
    const rows = (data ?? []) as BabyNamePremiumRow[];
    for (const row of rows) {
      const c = row.country?.trim();
      if (!c) continue;
      const arr = buckets.get(c);
      if (!arr || arr.length >= bucketCap) continue;
      arr.push(row);
    }
    from += REGIONAL_PUBLIC_SUPPLEMENT_PAGE_SIZE;
    if (rows.length < REGIONAL_PUBLIC_SUPPLEMENT_PAGE_SIZE) break;
    if (countryNames.every((c) => (buckets.get(c)?.length ?? 0) >= bucketCap)) break;
  }

  const rankedByCountry = countryNames.map((c) => (buckets.get(c) ?? []).map((row) => mapRowToBabyName(row)));

  const activeCountries = countryNames.filter((_, idx) => rankedByCountry[idx].length > 0);

  if (__DEV__) {
    console.log('[PremiumContentService] region-balanced supplement: country fetch counts', {
      region,
      rowCounts: countryNames.reduce<Record<string, number>>((acc, country, idx) => {
        acc[country] = rankedByCountry[idx].length;
        return acc;
      }, {}),
      activeCountries,
      spainStatus: {
        configured: countries.some((country) => country.name === 'Spain'),
        fetchCount: rankedByCountry[countryNames.indexOf('Spain')]?.length ?? null,
        active: activeCountries.includes('Spain'),
      },
    });
  }

  if (activeCountries.length === 0) return [];

  const basePer = Math.floor(limit / activeCountries.length);
  const remainder = limit % activeCountries.length;
  const slices = activeCountries.map((country, activeIdx) => {
    const idx = countryNames.indexOf(country);
    const cap = basePer + (activeIdx < remainder ? 1 : 0);
    return rankedByCountry[idx].slice(0, cap);
  });

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
  return out;
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

      if (region === 'WORLDWIDE') {
        return await fetchWorldwideBalancedPublicRows(limit, gender);
      }

      if (region) {
        const balancedRows = await fetchRegionCountryBalancedPublicRows(region, limit, gender);
        if (balancedRows.length > 0) {
          return balancedRows;
        }
      }

      let query = supabase
        .from('baby_names')
        .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank')
        .eq('is_premium', false);

      if (region) {
        query = query.or(`region.eq.${region},is_worldwide.eq.true`);
      }

      query = applyPublicSupplementGenderFilter(query, gender);

      query = query.order('popularity_rank', { ascending: true, nullsFirst: false }).limit(limit);

      const { data, error } = await query;
      if (error) {
        return [];
      }

      const rows = (data ?? []) as BabyNamePremiumRow[];
      return rows.map((row) => mapRowToBabyName(row));
    } catch {
      return [];
    }
  },

  async fetchRemotePremiumNames(opts: FetchRemotePremiumNamesOptions): Promise<BabyName[] | null> {
    if (!opts.includePremium || !opts.userId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('baby_names')
        .select('id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank')
        .eq('is_premium', true);

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
};
