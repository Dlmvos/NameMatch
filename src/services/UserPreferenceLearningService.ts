// ============================================================
// NameMatch – UserPreferenceLearningService
//
// Extends the existing preferenceProfiler with richer behavioral
// signals learned from swipe history.
//
// Signals collected (beyond liked/disliked ids):
//   - Origin affinity: which cultures appear most in likes
//   - Style tag affinity: e.g. 'vintage', 'nature', 'classic'
//   - Length preference: short / medium / long
//   - Trend preference: rising / stable / classic
//   - Popularity preference: top-100 (mainstream) vs rare
//   - Gender neutrality tolerance
//   - Starting letter clusters
//
// The returned LearningProfile can be passed to
// NameRecommendationService to re-rank candidates.
//
// Storage: AsyncStorage keyed per userId.
//          Re-computes lazily when swipe history changes.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { enrichName, getNameLength } from './nameEnrichment';
import type { NormalizedNameRecord } from './nameTypes';

const PREF_KEY_PREFIX = 'user_pref_v1:';

export interface LearningProfile {
  userId: string;

  // Ranked maps (value = affinity weight 0-1)
  originAffinity: Record<string, number>;
  styleAffinity: Record<string, number>;
  trendAffinity: Record<'rising' | 'stable' | 'classic' | 'falling', number>;
  lengthAffinity: Record<'short' | 'medium' | 'long', number>;

  // Popularity preference: 1.0 = loves mainstream, 0.0 = loves rare
  popularityBias: number;

  // Gender neutrality: 1.0 = fine with neutral/unisex, 0.0 = strictly binary
  neutralityTolerance: number;

  // Starting-letter clusters (e.g. {'A': 0.8, 'L': 0.6})
  letterAffinity: Record<string, number>;

  // Raw counts for incremental updates
  likeCount: number;
  skipCount: number;
  matchCount: number;

  // ISO timestamp of last compute
  computedAt: string;
}

export const DEFAULT_PROFILE: Omit<LearningProfile, 'userId' | 'computedAt'> = {
  originAffinity: {},
  styleAffinity: {},
  trendAffinity: { rising: 0.5, stable: 0.5, classic: 0.5, falling: 0.5 },
  lengthAffinity: { short: 0.5, medium: 0.5, long: 0.5 },
  popularityBias: 0.5,
  neutralityTolerance: 0.5,
  letterAffinity: {},
  likeCount: 0,
  skipCount: 0,
  matchCount: 0,
};

export class UserPreferenceLearningService {
  private _cache = new Map<string, LearningProfile>();

  // ──────────────────────────────────────────────────────────
  // loadProfile
  // ──────────────────────────────────────────────────────────

  /** Load the stored profile for a user (or return defaults) */
  async loadProfile(userId: string): Promise<LearningProfile> {
    if (this._cache.has(userId)) return this._cache.get(userId)!;

    try {
      const raw = await AsyncStorage.getItem(`${PREF_KEY_PREFIX}${userId}`);
      if (raw) {
        const profile = JSON.parse(raw) as LearningProfile;
        this._cache.set(userId, profile);
        return profile;
      }
    } catch {
      // ignore
    }

    return this._defaultProfile(userId);
  }

  // ──────────────────────────────────────────────────────────
  // recordSwipe
  // ──────────────────────────────────────────────────────────

  /**
   * Update the profile incrementally after a single swipe.
   * direction: 'like' | 'skip' | 'match'
   *
   * Uses exponential moving average (α=0.1) so recent swipes
   * gradually shift preferences without overriding history.
   */
  async recordSwipe(
    userId: string,
    name: NormalizedNameRecord,
    direction: 'like' | 'skip' | 'match',
  ): Promise<void> {
    const profile = await this.loadProfile(userId);
    const signal = direction === 'skip' ? -1 : direction === 'match' ? 2 : 1;
    const α = 0.10; // learning rate

    // Count
    if (direction === 'like') profile.likeCount++;
    else if (direction === 'skip') profile.skipCount++;
    else profile.matchCount++;

    const nameStr = name.displayName || name.name;
    const enriched = enrichName(nameStr);

    // Origin affinity
    const origin = (name.origin ?? enriched.similar_names?.[0] ?? '').toLowerCase();
    if (origin) {
      profile.originAffinity[origin] = this._ema(
        profile.originAffinity[origin] ?? 0.5,
        signal > 0 ? 1 : 0,
        α,
      );
    }

    // Style affinity
    for (const tag of name.style_tags ?? []) {
      profile.styleAffinity[tag] = this._ema(
        profile.styleAffinity[tag] ?? 0.5,
        signal > 0 ? 1 : 0,
        α,
      );
    }

    // Trend affinity
    const trend = name.trendDirection;
    if (trend && trend !== 'unknown') {
      const trendKey = trend as keyof typeof profile.trendAffinity;
      profile.trendAffinity[trendKey] = this._ema(
        profile.trendAffinity[trendKey],
        signal > 0 ? 1 : 0,
        α,
      );
    }

    // Length affinity
    const len = getNameLength(nameStr);
    profile.lengthAffinity[len] = this._ema(
      profile.lengthAffinity[len],
      signal > 0 ? 1 : 0,
      α,
    );

    // Popularity bias (1 = mainstream, 0 = rare)
    const rank = name.popularityRank ?? 500;
    const isMainstream = rank <= 100 ? 1 : 0;
    profile.popularityBias = this._ema(
      profile.popularityBias,
      signal > 0 ? isMainstream : 1 - isMainstream,
      α * 0.5, // slower to avoid noise from small samples
    );

    // Gender neutrality
    const isNeutral = name.gender === 'neutral' ? 1 : 0;
    profile.neutralityTolerance = this._ema(
      profile.neutralityTolerance,
      signal > 0 ? isNeutral : 0,
      α * 0.5,
    );

    // Letter affinity
    const firstLetter = nameStr[0]?.toUpperCase();
    if (firstLetter) {
      profile.letterAffinity[firstLetter] = this._ema(
        profile.letterAffinity[firstLetter] ?? 0.5,
        signal > 0 ? 1 : 0,
        α,
      );
    }

    profile.computedAt = new Date().toISOString();
    this._cache.set(userId, profile);

    // Persist asynchronously — don't block the swipe
    AsyncStorage.setItem(`${PREF_KEY_PREFIX}${userId}`, JSON.stringify(profile)).catch(
      (err) => console.warn('[UserPreferenceLearning] save failed:', err),
    );
  }

  // ──────────────────────────────────────────────────────────
  // recomputeFromHistory
  // ──────────────────────────────────────────────────────────

  /**
   * Full recompute from a complete history of liked/skipped names.
   * Use this when importing history from Supabase on first load.
   */
  async recomputeFromHistory(
    userId: string,
    likes: NormalizedNameRecord[],
    skips: NormalizedNameRecord[],
    matches: NormalizedNameRecord[],
  ): Promise<LearningProfile> {
    const profile = this._defaultProfile(userId);

    const process = (names: NormalizedNameRecord[], weight: number) => {
      for (const name of names) {
        const nameStr = name.displayName || name.name;
        const enriched = enrichName(nameStr);

        // Origin
        const origin = (name.origin ?? '').toLowerCase();
        if (origin) {
          profile.originAffinity[origin] = (profile.originAffinity[origin] ?? 0) + weight;
        }

        // Style tags
        for (const tag of name.style_tags ?? []) {
          profile.styleAffinity[tag] = (profile.styleAffinity[tag] ?? 0) + weight;
        }

        // Trend
        const trend = name.trendDirection;
        if (trend && trend !== 'unknown') {
          const k = trend as keyof typeof profile.trendAffinity;
          profile.trendAffinity[k] = (profile.trendAffinity[k] ?? 0) + weight;
        }

        // Length
        const len = getNameLength(nameStr);
        profile.lengthAffinity[len] = (profile.lengthAffinity[len] ?? 0) + weight;

        // Letter
        const fl = nameStr[0]?.toUpperCase();
        if (fl) {
          profile.letterAffinity[fl] = (profile.letterAffinity[fl] ?? 0) + weight;
        }

        // Suppress unused variable warning
        void enriched;
      }
    };

    process(likes, 1);
    process(matches, 2);   // matches count double
    process(skips, -0.5);

    // Normalise to 0-1
    profile.originAffinity = this._normalise(profile.originAffinity);
    profile.styleAffinity = this._normalise(profile.styleAffinity);
    profile.letterAffinity = this._normalise(profile.letterAffinity);

    profile.likeCount = likes.length;
    profile.skipCount = skips.length;
    profile.matchCount = matches.length;
    profile.computedAt = new Date().toISOString();

    this._cache.set(userId, profile);
    await AsyncStorage.setItem(
      `${PREF_KEY_PREFIX}${userId}`,
      JSON.stringify(profile),
    ).catch((err) => console.warn('[UserPreferenceLearning] recompute save failed:', err));

    return profile;
  }

  // ──────────────────────────────────────────────────────────
  // clearProfile
  // ──────────────────────────────────────────────────────────

  async clearProfile(userId: string): Promise<void> {
    this._cache.delete(userId);
    await AsyncStorage.removeItem(`${PREF_KEY_PREFIX}${userId}`).catch(() => {});
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  private _ema(current: number, target: number, α: number): number {
    return Math.max(0, Math.min(1, current + α * (target - current)));
  }

  private _normalise(map: Record<string, number>): Record<string, number> {
    const values = Object.values(map);
    if (values.length === 0) return map;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(map)) {
      result[k] = (v - min) / range;
    }
    return result;
  }

  private _defaultProfile(userId: string): LearningProfile {
    return {
      userId,
      ...DEFAULT_PROFILE,
      trendAffinity: { rising: 0.5, stable: 0.5, classic: 0.5, falling: 0.5 },
      lengthAffinity: { short: 0.5, medium: 0.5, long: 0.5 },
      computedAt: new Date().toISOString(),
    };
  }
}

/** Singleton */
export const userPreferenceLearningService = new UserPreferenceLearningService();
