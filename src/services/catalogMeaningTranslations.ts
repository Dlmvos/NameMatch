import { resolveBabyNameMeaningFields } from '../i18n/nameMeaningDisplay';
import { supabase } from '../lib/supabase';
import { normalizeLanguageTagToBase } from './languageService';
import type { BabyName, Match } from '../types';

const UUID_LIKE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_CHUNK = 120;

/**
 * Batch-load catalog meanings from `public.name_meaning_translations` (authenticated SELECT).
 */
export async function fetchCatalogNameMeaningTranslationsByNameIds(
  nameIds: string[],
  language: string,
): Promise<Map<string, string>> {
  const lang = normalizeLanguageTagToBase(language);
  const uuidIds = [...new Set(nameIds.filter((id) => UUID_LIKE_ID.test(id)))];
  if (uuidIds.length === 0 || !lang) return new Map();

  const out = new Map<string, string>();
  for (let i = 0; i < uuidIds.length; i += ID_CHUNK) {
    const slice = uuidIds.slice(i, i + ID_CHUNK);
    const { data, error } = await supabase
      .from('name_meaning_translations')
      .select('name_id,meaning')
      .in('name_id', slice)
      .eq('language_code', lang);
    if (error || !data?.length) continue;
    for (const row of data as { name_id: string; meaning: string }[]) {
      const m = row.meaning?.trim();
      if (m) out.set(row.name_id, m);
    }
  }
  return out;
}

export async function hydrateBabyNamesWithCatalogMeanings(
  names: BabyName[],
  language: string,
): Promise<BabyName[]> {
  if (names.length === 0) return [];
  const map = await fetchCatalogNameMeaningTranslationsByNameIds(names.map((n) => n.id), language);
  return names.map((n) => resolveBabyNameMeaningFields(n, map.get(n.id), language));
}

export async function hydrateMatchesWithCatalogMeanings(
  matches: Match[],
  language: string,
): Promise<Match[]> {
  if (matches.length === 0) return [];
  const babyNames = matches.map((m) => m.baby_names).filter(Boolean) as BabyName[];
  const hydratedList = await hydrateBabyNamesWithCatalogMeanings(babyNames, language);
  const byId = new Map(hydratedList.map((n) => [n.id, n]));
  return matches.map((m) => ({
    ...m,
    baby_names: m.baby_names
      ? byId.get(m.baby_names.id) ?? resolveBabyNameMeaningFields(m.baby_names, undefined, language)
      : m.baby_names,
  }));
}
