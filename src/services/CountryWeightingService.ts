// ============================================================
// NameMatch – CountryWeightingService
//
// Implements country-first name pool construction.
//
// Default deck composition (Phase 1: 0–29 swipes):
//   80% primary   — selected country > same region > worldwide
//   15% adjacent  — culturally nearby regions
//    5% discovery — everything else (prevents filter-bubble)
//
// After 30+ swipes the mix gradually shifts toward 70/20/10 so
// learned taste has more room without ever destroying country
// relevance (Phase 4 preference blending).
//
// Phase 5 (monetisation): purchased packs expand the adjacent
// pool. Pass `purchasedPacks` to unlock extra regions.
// ============================================================

import type { BabyName, GenderPreference, Region } from '../types';

// ─────────────────────────────────────────────────────────────
// Adjacent region map (for the 15% pool)
// ─────────────────────────────────────────────────────────────
const ADJACENT_REGIONS: Record<Region, Region[]> = {
  EU:            ['US', 'WORLDWIDE'],
  US:            ['EU', 'LATIN_AMERICA', 'WORLDWIDE'],
  ASIA:          ['MENA', 'WORLDWIDE'],
  MENA:          ['ARABIA', 'EU', 'WORLDWIDE'],
  ARABIA:        ['MENA', 'WORLDWIDE'],
  LATIN_AMERICA: ['US', 'EU', 'WORLDWIDE'],
  WORLDWIDE:     ['EU', 'US', 'ASIA'],
};

// Swipe count at which preference learning fully kicks in
const LEARNING_THRESHOLD = 30;

// Target deck size before swiped-name exclusion
const DECK_SIZE = 250;

export class CountryWeightingService {
  // ──────────────────────────────────────────────────────────
  // getWeightedPool
  // ──────────────────────────────────────────────────────────

  /**
   * Build a country-weighted name pool.
   *
   * @param allNames      Full static name dataset (ALL_NAMES)
   * @param region        User's region preference (from profile)
   * @param country       User's specific country (e.g. 'Netherlands'), optional
   * @param genderPref    'boy' | 'girl' | 'both'
   * @param swipeCount    Total swipes so far — drives learning blend
   * @param purchasedPacks  Pack keys user has purchased (future Phase 5 hook)
   */
  getWeightedPool(
    allNames: BabyName[],
    region: Region,
    country: string | undefined,
    genderPref: GenderPreference,
    swipeCount = 0,
    purchasedPacks: string[] = [],
  ): BabyName[] {
    // 1. Gender filter first
    const base = this._filterGender(allNames, genderPref);

    // 2. Compute adjacency
    const adjacentRegions = this._adjacentRegions(region, purchasedPacks);

    // 3. Partition into three pools
    const primarySet = new Set<string>();
    const adjacentSet = new Set<string>();
    const discoverySet = new Set<string>();

    const primary: BabyName[] = [];
    const adjacent: BabyName[] = [];
    const discovery: BabyName[] = [];

    for (const name of base) {
      if (this._isPrimary(name, region, country)) {
        primarySet.add(name.id);
        primary.push(name);
      } else if (adjacentRegions.includes(name.region as Region)) {
        adjacentSet.add(name.id);
        adjacent.push(name);
      } else {
        discoverySet.add(name.id);
        discovery.push(name);
      }
    }

    // 4. Calculate target sizes (blend shifts after LEARNING_THRESHOLD swipes)
    const progress = Math.min(swipeCount / LEARNING_THRESHOLD, 1);
    const primaryPct  = 0.80 - (0.10 * progress); // 80% → 70%
    const adjacentPct = 0.15 + (0.05 * progress); // 15% → 20%
    const discoveryPct = 0.05 + (0.05 * progress); //  5% → 10%

    const primaryTarget  = Math.round(DECK_SIZE * primaryPct);
    const adjacentTarget = Math.round(DECK_SIZE * adjacentPct);
    const discoveryTarget = Math.round(DECK_SIZE * discoveryPct);

    // 5. Sample — country-specific names get priority within primary pool
    const sampledPrimary  = this._prioritizeThenSample(primary, country, primaryTarget);
    const sampledAdjacent = this._shuffle([...adjacent]).slice(0, adjacentTarget);
    const sampledDiscovery = this._shuffle([...discovery]).slice(0, discoveryTarget);

    return [...sampledPrimary, ...sampledAdjacent, ...sampledDiscovery];
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  /**
   * A name is in the primary pool if:
   *   - It's the exact country match, OR
   *   - It belongs to the user's region (and has no specific country), OR
   *   - It's marked worldwide (relevant everywhere)
   */
  private _isPrimary(name: BabyName, region: Region, country?: string): boolean {
    if (name.is_worldwide) return true;
    if (name.region === region) return true;
    if (country && name.country === country) return true;
    return false;
  }

  private _adjacentRegions(region: Region, purchasedPacks: string[]): Region[] {
    const base = ADJACENT_REGIONS[region] ?? [];
    // Phase 5 hook: purchased packs expand the adjacent pool
    const extras = purchasedPacks
      .filter((p): p is Region => p in ADJACENT_REGIONS && !base.includes(p as Region) && p !== region)
      .map((p) => p as Region);
    return [...base, ...extras];
  }

  /**
   * Within the primary pool, country-specific names appear first,
   * followed by shuffled region names.
   */
  private _prioritizeThenSample(
    names: BabyName[],
    country: string | undefined,
    limit: number,
  ): BabyName[] {
    if (!country) return this._shuffle([...names]).slice(0, limit);

    const countrySpecific = names.filter((n) => n.country === country);
    const rest = names.filter((n) => n.country !== country);

    return [
      ...this._shuffle(countrySpecific),
      ...this._shuffle(rest),
    ].slice(0, limit);
  }

  private _filterGender(names: BabyName[], pref: GenderPreference): BabyName[] {
    if (pref === 'both') return names;
    return names.filter((n) => n.gender === pref || n.gender === 'neutral');
  }

  private _shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/** Singleton */
export const countryWeightingService = new CountryWeightingService();
