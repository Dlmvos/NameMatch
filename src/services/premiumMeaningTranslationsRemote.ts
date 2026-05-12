import { supabase } from '../lib/supabase';
import type { BabyName } from '../types';

type PremiumMeaningTranslationRow = {
  name_content_id: string;
  locale: string;
  meaning: string;
};

type PublicMeaningTranslationRow = {
  name_id: string;
  language_code: string;
  meaning: string;
};

type BabyNamesLookupRow = { id: string; name: string; popularity_rank: number | null };

const TRANSLATION_IN_CHUNK = 80;
const BABY_NAMES_IN_CHUNK = 80;

function localeCandidatesForUserLocale(userLocale: string): {
  exact: string;
  normalized: string;
  candidates: string[];
} {
  const exact = String(userLocale ?? '').trim();
  const normalized = exact.split(/[-_]/)[0]?.toLowerCase() ?? '';
  const candidates = [...new Set([exact, normalized].filter((s) => s.length > 0))];
  return { exact, normalized, candidates };
}

/** Lowercase + strip combining marks (diacritics); used for cross-accent matching. */
function normalizeNameKeyForMeaning(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Strip accents while preserving case (for exact `baby_names.name` lookups). */
function accentStrippedSurface(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function candidateExactNamesForBabyNameLookup(names: Pick<BabyName, 'id' | 'name'>[]): string[] {
  const set = new Set<string>();
  for (const n of names) {
    const raw = String(n.name ?? '').trim();
    if (!raw) continue;
    set.add(raw);
    const stripped = accentStrippedSurface(raw);
    if (stripped && stripped !== raw) set.add(stripped);
  }
  return [...set];
}

function pickMeaningForLocaleRows(
  list: PublicMeaningTranslationRow[],
  exact: string,
  normalized: string,
): string | undefined {
  const exactRow = list.find((r) => r.language_code === exact);
  const normalizedRow = list.find((r) => r.language_code === normalized);
  const pick = exactRow ?? normalizedRow ?? list[0];
  const m = pick?.meaning?.trim();
  return m || undefined;
}

function meaningByNameIdFromRows(
  rows: PublicMeaningTranslationRow[],
  exact: string,
  normalized: string,
): Map<string, string> {
  const byNameId = new Map<string, PublicMeaningTranslationRow[]>();
  for (const row of rows) {
    const list = byNameId.get(row.name_id) ?? [];
    list.push(row);
    byNameId.set(row.name_id, list);
  }
  const out = new Map<string, string>();
  for (const [nameId, list] of byNameId) {
    const m = pickMeaningForLocaleRows(list, exact, normalized);
    if (m) out.set(nameId, m);
  }
  return out;
}

async function fetchPublicTranslationRowsBatched(
  nameIds: string[],
  languageCandidates: string[],
): Promise<PublicMeaningTranslationRow[]> {
  if (nameIds.length === 0) return [];
  const out: PublicMeaningTranslationRow[] = [];
  for (let i = 0; i < nameIds.length; i += TRANSLATION_IN_CHUNK) {
    const slice = nameIds.slice(i, i + TRANSLATION_IN_CHUNK);
    const { data, error } = await supabase
      .from('name_meaning_translations')
      .select('name_id,language_code,meaning')
      .in('name_id', slice)
      .in('language_code', languageCandidates);
    if (!error && data?.length) out.push(...(data as PublicMeaningTranslationRow[]));
  }
  return out;
}

/** All `language_code` rows per `name_id` — used for name-key fallback so we can prefer exact/base locale then any row. */
async function fetchPublicTranslationRowsBatchedAllLanguages(nameIds: string[]): Promise<PublicMeaningTranslationRow[]> {
  if (nameIds.length === 0) return [];
  const out: PublicMeaningTranslationRow[] = [];
  for (let i = 0; i < nameIds.length; i += TRANSLATION_IN_CHUNK) {
    const slice = nameIds.slice(i, i + TRANSLATION_IN_CHUNK);
    const { data, error } = await supabase
      .from('name_meaning_translations')
      .select('name_id,language_code,meaning')
      .in('name_id', slice);
    if (!error && data?.length) out.push(...(data as PublicMeaningTranslationRow[]));
  }
  return out;
}

function groupPublicTranslationRowsByNameId(rows: PublicMeaningTranslationRow[]): Map<string, PublicMeaningTranslationRow[]> {
  const m = new Map<string, PublicMeaningTranslationRow[]>();
  for (const row of rows) {
    const list = m.get(row.name_id) ?? [];
    list.push(row);
    m.set(row.name_id, list);
  }
  return m;
}

/** Tier 0 = exact `language_code`, 1 = base language only, 2 = any other language (deterministic pick). */
function bestMeaningTierForNameIdRows(
  rows: PublicMeaningTranslationRow[] | undefined,
  exact: string,
  normalized: string,
): { meaning: string; tier: number } | undefined {
  if (!rows?.length) return undefined;
  const withMeaning = rows.filter((r) => r.meaning?.trim());
  if (withMeaning.length === 0) return undefined;
  const exactRow = withMeaning.find((r) => r.language_code === exact);
  if (exactRow) return { meaning: exactRow.meaning.trim(), tier: 0 };
  const normRow = withMeaning.find((r) => r.language_code === normalized);
  if (normRow) return { meaning: normRow.meaning.trim(), tier: 1 };
  const sorted = [...withMeaning].sort((a, b) => a.language_code.localeCompare(b.language_code));
  return { meaning: sorted[0].meaning.trim(), tier: 2 };
}

/** Negative if `a` is a better fallback source than `b` (lower tier, then rank, then id). */
function compareFallbackBabyNameCandidates(
  a: { tier: number; popularity_rank: number | null; id: string },
  b: { tier: number; popularity_rank: number | null; id: string },
): number {
  if (a.tier !== b.tier) return a.tier - b.tier;
  const ra = a.popularity_rank ?? 1_000_000_000;
  const rb = b.popularity_rank ?? 1_000_000_000;
  if (ra !== rb) return ra - rb;
  return a.id.localeCompare(b.id);
}

async function fetchPublicBabyNamesByCandidateNames(names: string[]): Promise<BabyNamesLookupRow[]> {
  if (names.length === 0) return [];
  const out: BabyNamesLookupRow[] = [];
  for (let i = 0; i < names.length; i += BABY_NAMES_IN_CHUNK) {
    const slice = names.slice(i, i + BABY_NAMES_IN_CHUNK);
    const { data, error } = await supabase
      .from('baby_names')
      .select('id,name,popularity_rank')
      .eq('is_premium', false)
      .in('name', slice);
    if (!error && data?.length) out.push(...(data as BabyNamesLookupRow[]));
  }
  return out;
}

async function fetchPremiumMeaningTranslationsForIdsFromTable(
  nameContentIds: string[],
  userLocale: string,
): Promise<Partial<Record<string, string>>> {
  if (nameContentIds.length === 0) return {};

  const { exact, normalized, candidates } = localeCandidatesForUserLocale(userLocale);
  if (candidates.length === 0) return {};

  const { data, error } = await supabase
    .from('premium_meaning_translations')
    .select('name_content_id,locale,meaning')
    .in('name_content_id', nameContentIds)
    .in('locale', candidates);

  if (error || !data?.length) return {};

  const byContentId = new Map<string, PremiumMeaningTranslationRow[]>();
  for (const row of data as PremiumMeaningTranslationRow[]) {
    const list = byContentId.get(row.name_content_id) ?? [];
    list.push(row);
    byContentId.set(row.name_content_id, list);
  }

  const out: Partial<Record<string, string>> = {};
  for (const [contentId, list] of byContentId) {
    const exactRow = list.find((r) => r.locale === exact);
    const normalizedRow = list.find((r) => r.locale === normalized);
    const pick = exactRow ?? normalizedRow ?? list[0];
    if (pick?.meaning) out[contentId] = pick.meaning;
  }

  return out;
}

/**
 * Localized premium meanings for remote `BabyName.id` values (Supabase UUIDs).
 * Keys in the returned map are those ids. Prefer exact `userLocale`, then base language (before `-` / `_`).
 *
 * RLS: requires authenticated user with a non-empty `purchased_packs` profile (see schema).
 * Returns `{}` when the query errors or returns no rows.
 */
export async function fetchPremiumMeaningTranslationsForIds(
  nameContentIds: string[],
  userLocale: string,
): Promise<Partial<Record<string, string>>> {
  return fetchPremiumMeaningTranslationsForIdsFromTable(nameContentIds, userLocale);
}

/**
 * Localized meanings for public catalog rows (`public.name_meaning_translations`).
 * Exact `name_id` match first. Fallback: all non-premium `baby_names` whose display name normalizes
 * like the input; translations are loaded for every such row, then the best row wins by
 * language tier (exact locale → base → any), then `popularity_rank` (nulls last), then `id`.
 */
export async function fetchPublicMeaningTranslationsForIds(
  names: Pick<BabyName, 'id' | 'name'>[],
  userLocale: string,
): Promise<Partial<Record<string, string>>> {
  if (names.length === 0) return {};

  const { exact, normalized, candidates } = localeCandidatesForUserLocale(userLocale);
  if (candidates.length === 0) return {};

  const inputIds = [...new Set(names.map((n) => String(n.id ?? '').trim()).filter(Boolean))];
  if (inputIds.length === 0) return {};

  const rowsPrimary = await fetchPublicTranslationRowsBatched(inputIds, candidates);
  const meaningByPrimary = meaningByNameIdFromRows(rowsPrimary, exact, normalized);

  const outPrimary: Partial<Record<string, string>> = {};
  for (const id of inputIds) {
    const m = meaningByPrimary.get(id);
    if (m) outPrimary[id] = m;
  }

  const out: Partial<Record<string, string>> = { ...outPrimary };
  const missing = names.filter((n) => !outPrimary[n.id]?.trim());

  if (missing.length === 0) {
    if (__DEV__) {
      const byId = names.filter((n) => outPrimary[n.id]?.trim()).length;
      console.log('[MeaningTranslations] public fetch', {
        requested: names.length,
        byId,
        byNameFallback: 0,
      });
    }
    return out;
  }

  const nameCandidates = candidateExactNamesForBabyNameLookup(names);
  const bnRows = await fetchPublicBabyNamesByCandidateNames(nameCandidates);

  const missingNormKeys = new Set<string>();
  for (const n of missing) {
    const nk = normalizeNameKeyForMeaning(n.name);
    if (nk) missingNormKeys.add(nk);
  }

  const fallbackBnIds = new Set<string>();
  for (const r of bnRows) {
    const nk = normalizeNameKeyForMeaning(r.name);
    if (nk && missingNormKeys.has(nk)) fallbackBnIds.add(r.id);
  }

  const rowsFallbackAllLang = await fetchPublicTranslationRowsBatchedAllLanguages([...fallbackBnIds]);
  const translationsByNameId = groupPublicTranslationRowsByNameId(rowsFallbackAllLang);

  const nkToMeaning = new Map<string, string>();
  for (const nk of missingNormKeys) {
    const rowCandidates = bnRows.filter((r) => normalizeNameKeyForMeaning(r.name) === nk);
    let best: { tier: number; popularity_rank: number | null; id: string; meaning: string } | null = null;
    for (const r of rowCandidates) {
      const bm = bestMeaningTierForNameIdRows(translationsByNameId.get(r.id), exact, normalized);
      if (!bm) continue;
      const cur = { tier: bm.tier, popularity_rank: r.popularity_rank, id: r.id, meaning: bm.meaning };
      if (!best || compareFallbackBabyNameCandidates(cur, best) < 0) best = cur;
    }
    if (best) nkToMeaning.set(nk, best.meaning);
  }

  for (const n of missing) {
    const nk = normalizeNameKeyForMeaning(n.name);
    if (!nk) continue;
    const text = nkToMeaning.get(nk);
    if (text) out[n.id] = text;
  }

  if (__DEV__) {
    const byId = names.filter((n) => outPrimary[n.id]?.trim()).length;
    const byNameFallback = names.filter((n) => out[n.id]?.trim() && !outPrimary[n.id]?.trim()).length;
    console.log('[MeaningTranslations] public fetch', {
      requested: names.length,
      byId,
      byNameFallback,
    });
  }

  return out;
}
