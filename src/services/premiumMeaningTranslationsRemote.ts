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

function chooseDeterministicBabyNameRow(rows: BabyNamesLookupRow[]): BabyNamesLookupRow {
  return [...rows].sort((a, b) => {
    const ra = a.popularity_rank ?? 1_000_000_000;
    const rb = b.popularity_rank ?? 1_000_000_000;
    if (ra !== rb) return ra - rb;
    return String(a.id).localeCompare(String(b.id));
  })[0];
}

/** One canonical `baby_names.id` per normalized spelling (deterministic when duplicates exist). */
function normalizedKeyToBestBabyNameId(rows: BabyNamesLookupRow[]): Map<string, string> {
  const byKey = new Map<string, BabyNamesLookupRow[]>();
  for (const r of rows) {
    const k = normalizeNameKeyForMeaning(r.name);
    if (!k) continue;
    const list = byKey.get(k) ?? [];
    list.push(r);
    byKey.set(k, list);
  }
  const out = new Map<string, string>();
  for (const [k, list] of byKey) {
    out.set(k, chooseDeterministicBabyNameRow(list).id);
  }
  return out;
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
 * Prefers translation rows whose `name_id` equals each input `BabyName.id`; if missing, resolves by
 * matching normalized display names against non-premium `baby_names` and reuses that row's
 * translation (deterministic when multiple DB rows share the same normalized name).
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
  const normToCanonId = normalizedKeyToBestBabyNameId(bnRows);

  const fallbackCanonIds = new Set<string>();
  for (const n of missing) {
    const nk = normalizeNameKeyForMeaning(n.name);
    if (!nk) continue;
    const canon = normToCanonId.get(nk);
    if (canon && canon !== n.id) fallbackCanonIds.add(canon);
  }

  const rowsFallback = await fetchPublicTranslationRowsBatched([...fallbackCanonIds], candidates);
  const meaningByFallback = meaningByNameIdFromRows(rowsFallback, exact, normalized);

  for (const n of missing) {
    const nk = normalizeNameKeyForMeaning(n.name);
    if (!nk) continue;
    const canon = normToCanonId.get(nk);
    if (!canon || canon === n.id) continue;
    const text = meaningByFallback.get(canon);
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
