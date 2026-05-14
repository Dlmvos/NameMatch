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

type DictCandidate = {
  langTier: number;
  popularity_rank: number | null;
  id: string;
  meaning: string;
};

const TRANSLATION_IN_CHUNK = 80;
const BABY_NAMES_IN_CHUNK = 80;
const DICTIONARY_PAGE_SIZE = 1000;

/** `exact\0normalized` -> normalized display name -> meaning (per UI locale, in-memory). */
const publicMeaningDictionaryCache = new Map<string, Map<string, string>>();

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

function dictionaryCacheKey(exact: string, normalized: string): string {
  return `${exact}\0${normalized}`;
}

/** Lowercase + strip combining marks (diacritics); used for cross-accent matching. */
function normalizeNameKeyForMeaning(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Negative if `a` wins over `b`: lower `langTier` (exact before base), then rank, then id. */
function compareDictCandidates(a: DictCandidate, b: DictCandidate): number {
  if (a.langTier !== b.langTier) return a.langTier - b.langTier;
  const ra = a.popularity_rank ?? 1_000_000_000;
  const rb = b.popularity_rank ?? 1_000_000_000;
  if (ra !== rb) return ra - rb;
  return a.id.localeCompare(b.id);
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

/** Paginated fetch of all public meaning rows for the given `language_code` values (exact + base). */
async function fetchAllPublicTranslationRowsForLanguageCodes(
  languageCodes: string[],
): Promise<PublicMeaningTranslationRow[]> {
  if (languageCodes.length === 0) return [];
  const out: PublicMeaningTranslationRow[] = [];
  let from = 0;
  for (;;) {
    const to = from + DICTIONARY_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('name_meaning_translations')
      .select('name_id,language_code,meaning')
      .in('language_code', languageCodes)
      .order('name_id', { ascending: true })
      .range(from, to);
    if (error || !data?.length) break;
    out.push(...(data as PublicMeaningTranslationRow[]));
    if (data.length < DICTIONARY_PAGE_SIZE) break;
    from += DICTIONARY_PAGE_SIZE;
  }
  return out;
}

async function fetchPublicBabyNamesByIdsAsMap(ids: string[]): Promise<Map<string, BabyNamesLookupRow>> {
  const m = new Map<string, BabyNamesLookupRow>();
  if (ids.length === 0) return m;
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += BABY_NAMES_IN_CHUNK) {
    const slice = unique.slice(i, i + BABY_NAMES_IN_CHUNK);
    const { data, error } = await supabase
      .from('baby_names')
      .select('id,name,popularity_rank')
      .eq('is_premium', false)
      .in('id', slice);
    if (!error && data?.length) {
      for (const row of data as BabyNamesLookupRow[]) {
        m.set(row.id, row);
      }
    }
  }
  return m;
}

/**
 * Cached map: normalized `baby_names.name` -> best meaning for this UI locale (exact `language_code`
 * before base, then lower `popularity_rank`, then `id`).
 */
async function getPublicMeaningDictionaryForLocale(userLocale: string): Promise<Map<string, string>> {
  const { exact, normalized, candidates } = localeCandidatesForUserLocale(userLocale);
  if (candidates.length === 0) return new Map();

  const cacheKey = dictionaryCacheKey(exact, normalized);
  const cached = publicMeaningDictionaryCache.get(cacheKey);
  if (cached) return cached;

  const transRows = await fetchAllPublicTranslationRowsForLanguageCodes(candidates);
  const nameIds = [...new Set(transRows.map((r) => r.name_id))];
  const bnById = await fetchPublicBabyNamesByIdsAsMap(nameIds);

  const byNk = new Map<string, DictCandidate[]>();
  for (const row of transRows) {
    const meaning = row.meaning?.trim();
    if (!meaning) continue;
    const bn = bnById.get(row.name_id);
    if (!bn) continue;
    const nk = normalizeNameKeyForMeaning(bn.name);
    if (!nk) continue;
    const langTier =
      row.language_code === exact ? 0 : row.language_code === normalized ? 1 : 2;
    const c: DictCandidate = {
      langTier,
      popularity_rank: bn.popularity_rank,
      id: bn.id,
      meaning,
    };
    const list = byNk.get(nk) ?? [];
    list.push(c);
    byNk.set(nk, list);
  }

  const dict = new Map<string, string>();
  for (const [nk, list] of byNk) {
    let best = list[0];
    for (let i = 1; i < list.length; i++) {
      if (compareDictCandidates(list[i], best) < 0) best = list[i];
    }
    dict.set(nk, best.meaning);
  }

  publicMeaningDictionaryCache.set(cacheKey, dict);
  return dict;
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
 * Exact `name_id` match first. Then a cached per-locale dictionary keyed by normalized `baby_names.name`
 * (built from all translation rows for that locale + joined names) fills bundled ids and other misses.
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
    return out;
  }

  const dict = await getPublicMeaningDictionaryForLocale(userLocale);
  for (const n of names) {
    if (outPrimary[n.id]?.trim()) continue;
    const nk = normalizeNameKeyForMeaning(n.name);
    if (!nk) continue;
    const text = dict.get(nk);
    if (text) out[n.id] = text;
  }

  return out;
}
