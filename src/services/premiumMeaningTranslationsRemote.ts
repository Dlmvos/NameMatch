import { supabase } from '../lib/supabase';

export type MeaningTranslationRow = {
  name_content_id: string;
  locale: string;
  meaning: string;
};

type MeaningTranslationTable = 'premium_meaning_translations' | 'name_meaning_translations';

async function fetchMeaningTranslationsForIdsFromTable(
  table: MeaningTranslationTable,
  nameContentIds: string[],
  userLocale: string,
): Promise<Partial<Record<string, string>>> {
  if (nameContentIds.length === 0) return {};

  const exact = String(userLocale ?? '').trim();
  const normalized = exact.split(/[-_]/)[0]?.toLowerCase() ?? '';
  const localeCandidates = [...new Set([exact, normalized].filter((s) => s.length > 0))];
  if (localeCandidates.length === 0) return {};

  const { data, error } = await supabase
    .from(table)
    .select('name_content_id,locale,meaning')
    .in('name_content_id', nameContentIds)
    .in('locale', localeCandidates);

  if (error || !data?.length) return {};

  const byContentId = new Map<string, MeaningTranslationRow[]>();
  for (const row of data as MeaningTranslationRow[]) {
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
  return fetchMeaningTranslationsForIdsFromTable(
    'premium_meaning_translations',
    nameContentIds,
    userLocale,
  );
}

/**
 * Localized meanings for non-premium / public catalog rows (`public.name_meaning_translations`).
 * Same lookup rules as `fetchPremiumMeaningTranslationsForIds`.
 * Returns `{}` when the query errors or returns no rows.
 */
export async function fetchPublicMeaningTranslationsForIds(
  nameContentIds: string[],
  userLocale: string,
): Promise<Partial<Record<string, string>>> {
  return fetchMeaningTranslationsForIdsFromTable('name_meaning_translations', nameContentIds, userLocale);
}
