// ============================================================
// NameMatch – NameRecommendationService
//
// Top-level orchestrator for the recommendation pipeline.
//
// Pipeline:
//   1. Fetch full pool via NameSourceService (cached)
//   2. Normalize all records via NameNormalizationService
//   3. Apply hard filters (gender, region, search)
//   4. Apply soft filters (NameFilters from UI)
//   5. Exclude already-swiped IDs
//   6. Re-rank via AIRankingService (heuristic or AI)
//   7. Optionally inject similar names after each liked name
//   8. Return paginated deck
//
// This replaces the direct ALL_NAMES access in AppContext
// while remaining fully backward-compatible with the
// existing BabyName type via toLegacyBabyName().
// ============================================================

import { nameSourceService } from './NameSourceService';
import { nameNormalizationService } from './NameNormalizationService';
import { aiRankingService } from './AIRankingService';
import { similarNameEngine } from './SimilarNameEngine';
import { getNameLength } from './nameEnrichment';
import { toLegacyBabyName } from './nameTypes';
import type { NormalizedNameRecord } from './nameTypes';
import type { NameQuery } from './providers/INameProvider';
import type { LearningProfile } from './UserPreferenceLearningService';
import type { BabyName, NameFilters } from '../types';

export interface RecommendationRequest {
  query?: NameQuery;
  filters?: NameFilters;
  swipedIds?: Set<string>;
  userProfile?: LearningProfile;
  partnerProfile?: LearningProfile;
  hint?: string;       // natural-language hint for AI
  limit?: number;
  offset?: number;
}

export interface RecommendationResult {
  names: NormalizedNameRecord[];
  /** Ready-to-use legacy BabyName[] for AppContext / SwipeCard */
  legacyNames: BabyName[];
  total: number;
  aiAssisted: boolean;
}

export class NameRecommendationService {
  // ──────────────────────────────────────────────────────────
  // recommend
  // ──────────────────────────────────────────────────────────

  async recommend(request: RecommendationRequest = {}): Promise<RecommendationResult> {
    const {
      query = {},
      filters,
      swipedIds = new Set(),
      userProfile,
      partnerProfile,
      hint,
      limit = 50,
      offset = 0,
    } = request;

    // 1. Fetch full pool (cached)
    const raw = await nameSourceService.getFullPool();

    // 2. Normalize
    const normalized = nameNormalizationService.normalizeMany(raw);

    // 3. Hard filters (from query)
    let pool = this._applyQueryFilters(normalized, query);

    // 4. UI soft filters
    if (filters) {
      pool = this._applyUIFilters(pool, filters);
    }

    // 5. Exclude swiped
    pool = pool.filter((n) => !swipedIds.has(n.id));

    // 6. AI / heuristic re-rank
    const ranked = await aiRankingService.rank({
      candidates: pool,
      userProfile,
      partnerProfile,
      hint,
      limit: Math.min(pool.length, limit * 3), // rank larger window, then slice
    });

    const page = ranked.ranked.slice(offset, offset + limit);

    return {
      names: page,
      legacyNames: page.map(toLegacyBabyName),
      total: ranked.ranked.length,
      aiAssisted: ranked.aiAssisted,
    };
  }

  // ──────────────────────────────────────────────────────────
  // getSimilarNames
  // ──────────────────────────────────────────────────────────

  /**
   * Find similar names for a given name ID.
   * Returns up to `limit` similar legacy BabyName objects
   * for use in SwipeCard "You might also like".
   */
  async getSimilarNames(
    nameId: string,
    swipedIds: Set<string> = new Set(),
    limit = 4,
  ): Promise<BabyName[]> {
    const pool = await nameSourceService.getFullPool();
    const normalized = nameNormalizationService.normalizeMany(pool);

    const results = similarNameEngine
      .findSimilarById(nameId, normalized, limit + swipedIds.size)
      .filter((r) => !swipedIds.has(r.record.id))
      .slice(0, limit);

    return results.map((r) => toLegacyBabyName(r.record));
  }

  // ──────────────────────────────────────────────────────────
  // buildSwipeDeck
  // ──────────────────────────────────────────────────────────

  /**
   * Stratified deck builder — replaces generateSwipeDeck() for the
   * new architecture. Returns legacy BabyName[] for backward compatibility.
   *
   * Tiers:
   *   40% high-affinity   (top AI/heuristic ranked)
   *   35% medium-affinity (next tier)
   *   15% wildcard        (low-affinity or different style)
   *   10% trending        (rising trend_direction names)
   */
  async buildSwipeDeck(
    request: RecommendationRequest,
    deckSize = 30,
  ): Promise<BabyName[]> {
    const {
      query = {},
      filters,
      swipedIds = new Set(),
      userProfile,
      partnerProfile,
      hint,
    } = request;

    const raw = await nameSourceService.getFullPool();
    const normalized = nameNormalizationService.normalizeMany(raw);
    let pool = this._applyQueryFilters(normalized, query);
    if (filters) pool = this._applyUIFilters(pool, filters);
    pool = pool.filter((n) => !swipedIds.has(n.id));

    // Rank the entire remaining pool
    const ranked = await aiRankingService.rank({
      candidates: pool,
      userProfile,
      partnerProfile,
      hint,
      limit: pool.length,
    });

    const all = ranked.ranked;
    const highCount = Math.round(deckSize * 0.40);
    const medCount = Math.round(deckSize * 0.35);
    const wildCount = Math.round(deckSize * 0.15);
    const trendCount = deckSize - highCount - medCount - wildCount;

    const high = all.slice(0, highCount);
    const medium = all.slice(highCount, highCount + medCount);

    // Wildcard: sample from the bottom quartile
    const bottomStart = Math.max(highCount + medCount, Math.floor(all.length * 0.75));
    const wildPool = all.slice(bottomStart);
    const wild = this._sample(wildPool, wildCount);

    // Trending: pick rising names not already selected
    const selectedIds = new Set([...high, ...medium, ...wild].map((n) => n.id));
    const trending = all
      .filter((n) => n.trendDirection === 'rising' && !selectedIds.has(n.id))
      .slice(0, trendCount);

    // Interleave tiers for deck variety
    const deck = this._interleave([high, medium, wild, trending], deckSize);

    return deck.map(toLegacyBabyName);
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  private _applyQueryFilters(
    pool: NormalizedNameRecord[],
    query: NameQuery,
  ): NormalizedNameRecord[] {
    let result = pool;

    if (query.gender && query.gender !== 'both') {
      result = result.filter(
        (n) => n.gender === query.gender || n.gender === 'neutral',
      );
    }

    if (query.region && query.region !== 'WORLDWIDE') {
      result = result.filter(
        (n) => n.region === query.region || n.is_worldwide,
      );
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      result = result.filter(
        (n) =>
          n.normalizedName.includes(q) ||
          (n.origin?.toLowerCase().includes(q) ?? false) ||
          (n.meaning?.toLowerCase().includes(q) ?? false),
      );
    }

    return result;
  }

  private _applyUIFilters(
    pool: NormalizedNameRecord[],
    filters: NameFilters,
  ): NormalizedNameRecord[] {
    let result = pool;

    if (filters.lengths && filters.lengths.length > 0) {
      result = result.filter((n) =>
        filters.lengths.includes(getNameLength(n.displayName || n.name)),
      );
    }

    if (filters.startingLetter) {
      result = result.filter(
        (n) =>
          (n.displayName || n.name)[0]?.toUpperCase() === filters.startingLetter,
      );
    }

    if (filters.originsContain) {
      const q = filters.originsContain.toLowerCase();
      result = result.filter((n) => n.origin?.toLowerCase().includes(q) ?? false);
    }

    if (filters.trends && filters.trends.length > 0) {
      result = result.filter((n) => {
        const trend = n.trendDirection;
        // Map NormalizedNameRecord trend → UI NameTrend
        if (!trend || trend === 'unknown') return false;
        if (trend === 'falling') return false;
        return filters.trends.includes(trend as 'rising' | 'stable' | 'classic');
      });
    }

    return result;
  }

  /** Random sample without replacement */
  private _sample<T>(arr: T[], n: number): T[] {
    const copy = [...arr];
    const result: T[] = [];
    while (result.length < n && copy.length > 0) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  /** Round-robin interleave from multiple tiers */
  private _interleave(tiers: NormalizedNameRecord[][], limit: number): NormalizedNameRecord[] {
    const result: NormalizedNameRecord[] = [];
    const queues = tiers.map((t) => [...t]);

    while (result.length < limit && queues.some((q) => q.length > 0)) {
      for (const q of queues) {
        if (q.length > 0 && result.length < limit) {
          result.push(q.shift()!);
        }
      }
    }

    return result;
  }
}

/** Singleton */
export const nameRecommendationService = new NameRecommendationService();
