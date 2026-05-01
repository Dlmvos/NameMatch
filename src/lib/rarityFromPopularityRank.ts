import type { BabyName, NameRarity, RarityTier } from '../types';

/**
 * Max popularity_rank supported by the bulk JSONL importer (`scripts/lib/bulkBabyNameImport.ts`).
 * Rarity score maps rank 1 → 0 (most common) and this max → 100 (rarest) using log10 spread.
 */
export const RARITY_POPULARITY_RANK_MAX = 1_000_000 as const;

function tierFromScore(score: number): RarityTier {
  if (score < 20) return 'very_common';
  if (score < 40) return 'common';
  if (score < 60) return 'uncommon';
  if (score < 80) return 'rare';
  return 'very_rare';
}

function isValidRank(rank: number): boolean {
  return Number.isInteger(rank) && rank >= 1 && rank <= RARITY_POPULARITY_RANK_MAX;
}

/**
 * Deterministic rarity from official-style popularity rank (1 = most popular).
 * Invalid or missing rank → `{ score: null, tier: 'unknown' }` so callers can branch safely.
 */
export function rarityFromPopularityRank(popularityRank: number | null | undefined): NameRarity {
  if (popularityRank == null || !isValidRank(popularityRank)) {
    return { score: null, tier: 'unknown' };
  }
  const logMax = Math.log10(RARITY_POPULARITY_RANK_MAX);
  const raw = (100 * Math.log10(popularityRank)) / logMax;
  const score = Math.min(100, Math.max(0, Math.round(raw)));
  return { score, tier: tierFromScore(score) };
}

export function rarityForBabyName(name: Pick<BabyName, 'popularity_rank'>): NameRarity {
  return rarityFromPopularityRank(name.popularity_rank);
}
