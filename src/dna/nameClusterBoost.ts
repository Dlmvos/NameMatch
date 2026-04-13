import type { NameRecord } from '../services/supabase';
import { rankSimilarNames } from './nameSimilarity';

export function getClusterBoostedIds(params: {
  names: NameRecord[];
  seedIds: string[];
  limit?: number;
}): string[] {
  const { names, seedIds, limit = 24 } = params;

  if (!seedIds.length) return [];

  const nameMap = new Map(names.map((name) => [name.id, name] as const));
  const pool = names.map((name) => ({
    id: name.id,
    name: name.name,
    origin: name.origin,
    gender: name.gender,
    style_tags: name.style_tags,
    popularity_score: name.popularity_score,
  }));

  const scoredIds: string[] = [];

  for (const seedId of seedIds) {
    const seed = nameMap.get(seedId);
    if (!seed) continue;

    const ranked = rankSimilarNames(
      {
        id: seed.id,
        name: seed.name,
        origin: seed.origin,
        gender: seed.gender,
        style_tags: seed.style_tags,
        popularity_score: seed.popularity_score,
      },
      pool,
    )
      .slice(0, 8)
      .map((item) => item.id);

    scoredIds.push(...ranked);
  }

  return [...new Set(scoredIds)].slice(0, limit);
}
