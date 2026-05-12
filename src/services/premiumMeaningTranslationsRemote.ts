import { supabase } from '../lib/supabase';

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

async function fetchPublicMeaningTranslationsForIdsFromTable(
  nameIds: string[],
  userLocale: string,
): Promise<Partial<Record<string, string>>> {
  if (nameIds.length === 0) return {};

  const { exact, normalized, candidates } = localeCandidatesForUserLocale(userLocale);
  if (candidates.length === 0) return {};

  const { data, error } = await supabase
    .from('name_meaning_translations')
    .select('name_id,language_code,meaning')
    .in('name_id', nameIds)
    .in('language_code', candidates);

  if (error || !data?.length) return {};

  const byNameId = new Map<string, PublicMeaningTranslationRow[]>();
  for (const row of data as PublicMeaningTranslationRow[]) {
    const list = byNameId.get(row.name_id) ?? [];
    list.push(row);
    byNameId.set(row.name_id, list);
  }

  const out: Partial<Record<string, string>> = {};
  for (const [nameId, list] of byNameId) {
    const exactRow = list.find((r) => r.language_code === exact);
    const normalizedRow = list.find((r) => r.language_code === normalized);
    const pick = exactRow ?? normalizedRow ?? list[0];
    if (pick?.meaning) out[nameId] = pick.meaning;
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
 * Rows use `name_id`, `language_code`, and `meaning` (production shape). Lookup prefers exact
 * `userLocale`, then the base language segment, same as premium.
 * Returns `{}` when the query errors or returns no rows.
 */
export async function fetchPublicMeaningTranslationsForIds(
  nameIds: string[],
  userLocale: string,
): Promise<Partial<Record<string, string>>> {
  return fetchPublicMeaningTranslationsForIdsFromTable(nameIds, userLocale);
}
