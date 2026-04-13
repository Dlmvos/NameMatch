import { supabase, type NameRecord, type PreferenceProfile } from '../services/supabase';

function topKeys(counter: Record<string, number>, limit = 3): string[] {
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function countTraits(names: NameRecord[]) {
  const genders: Record<string, number> = {};
  const origins: Record<string, number> = {};
  const styles: Record<string, number> = {};

  for (const name of names) {
    if (name.gender) genders[name.gender] = (genders[name.gender] ?? 0) + 1;
    if (name.origin) origins[name.origin] = (origins[name.origin] ?? 0) + 1;
    for (const tag of name.style_tags ?? []) {
      styles[tag] = (styles[tag] ?? 0) + 1;
    }
  }

  return { genders, origins, styles };
}

export async function loadPreferenceProfile(params: {
  userId: string;
  roomId: string;
}): Promise<PreferenceProfile> {
  const { userId, roomId } = params;

  const { data: likedSwipes, error: likedError } = await supabase
    .from('swipes')
    .select('baby_name_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .eq('liked', true)
    .not('baby_name_id', 'is', null);

  if (likedError) {
    throw new Error(`Failed to load liked swipes: ${likedError.message}`);
  }

  const likedNameIds = [...new Set((likedSwipes ?? []).map((row: { baby_name_id: string | null }) => row.baby_name_id).filter(Boolean) as string[])];

  const { data: matchedRows, error: matchError } = await supabase
    .from('matches')
    .select('name_id')
    .eq('room_id', roomId);

  if (matchError) {
    throw new Error(`Failed to load room matches: ${matchError.message}`);
  }

  const matchedNameIds = [...new Set((matchedRows ?? []).map((row: { name_id: string }) => row.name_id).filter(Boolean))];

  const idsToFetch = [...new Set([...likedNameIds, ...matchedNameIds])];

  if (!idsToFetch.length) {
    return {
      preferredGenders: [],
      preferredOrigins: [],
      preferredStyles: [],
      likedNameIds,
      matchedNameIds,
      seedNameIds: [],
    };
  }

  const { data: names, error: namesError } = await supabase
    .from('names')
    .select('id,name,gender,origin,meaning,style_tags,popularity_score')
    .in('id', idsToFetch);

  if (namesError) {
    throw new Error(`Failed to load profiled names: ${namesError.message}`);
  }

  const nameMap = new Map((names ?? []).map((name: NameRecord) => [name.id, name] as const));
  const likedNames = likedNameIds.map((id) => nameMap.get(id)).filter(Boolean) as NameRecord[];
  const matchedNames = matchedNameIds.map((id) => nameMap.get(id)).filter(Boolean) as NameRecord[];

  const likedCounts = countTraits(likedNames);
  const matchedCounts = countTraits(matchedNames);

  const mergedGenders = { ...likedCounts.genders };
  for (const [key, value] of Object.entries(matchedCounts.genders)) {
    mergedGenders[key] = (mergedGenders[key] ?? 0) + value * 2;
  }

  const mergedOrigins = { ...likedCounts.origins };
  for (const [key, value] of Object.entries(matchedCounts.origins)) {
    mergedOrigins[key] = (mergedOrigins[key] ?? 0) + value * 2;
  }

  const mergedStyles = { ...likedCounts.styles };
  for (const [key, value] of Object.entries(matchedCounts.styles)) {
    mergedStyles[key] = (mergedStyles[key] ?? 0) + value * 2;
  }

  const seedNameIds = [...new Set([
    ...matchedNameIds.slice(0, 6),
    ...likedNameIds.slice(0, 8),
  ])];

  return {
    preferredGenders: topKeys(mergedGenders, 2),
    preferredOrigins: topKeys(mergedOrigins, 3),
    preferredStyles: topKeys(mergedStyles, 5),
    likedNameIds,
    matchedNameIds,
    seedNameIds,
  };
}
