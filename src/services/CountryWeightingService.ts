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
import { findCountry } from '../data/countries';

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
const FREE_DECK_SIZE = 120;

export class CountryWeightingService {
  getFreeTierCountryFirstPool(
    allNames: BabyName[],
    region: Region,
    country: string | undefined,
    genderPref: GenderPreference,
  ): BabyName[] {
    const base = this._filterGender(allNames, genderPref);
    const countryOption = country ? findCountry(country) : undefined;
    const tightlyRelatedRegions =
      countryOption?.adjacentRegions ?? this._adjacentRegions(region, []);
    const { countrySpecific, regionGeneral, worldwide, adjacent } =
      this._partitionPools(base, region, country, tightlyRelatedRegions);

    if (!country) {
      // Legacy/no-country fallback: deterministic region-first, no broad discovery.
      return this._dedupeById([...regionGeneral, ...worldwide]).slice(0, FREE_DECK_SIZE);
    }

    const countryTarget = Math.round(FREE_DECK_SIZE * 0.9); // 90%
    const tightlyRelatedTarget = Math.round(FREE_DECK_SIZE * 0.08); // 8%
    const regionTarget = FREE_DECK_SIZE - countryTarget - tightlyRelatedTarget; // 2%

    const selectedCountry = countrySpecific.slice(0, countryTarget);
    const countryIds = new Set(selectedCountry.map((n) => n.id));
    const tightlyRelatedFallback = adjacent
      .filter((n) => !countryIds.has(n.id))
      .slice(0, tightlyRelatedTarget);
    const relatedIds = new Set(tightlyRelatedFallback.map((n) => n.id));
    const regionFallback = regionGeneral
      .filter((n) => !countryIds.has(n.id) && !relatedIds.has(n.id))
      .slice(0, Math.max(regionTarget, countryTarget - selectedCountry.length));

    const ordered = this._dedupeById([
      ...selectedCountry,
      ...tightlyRelatedFallback,
      ...regionFallback,
    ]);

    if (ordered.length >= FREE_DECK_SIZE) {
      return ordered.slice(0, FREE_DECK_SIZE);
    }

    // Limited final fallback only when supply is thin.
    const usedIds = new Set(ordered.map((n) => n.id));
    const worldwideFallback = worldwide.filter((n) => !usedIds.has(n.id));
    return [...ordered, ...worldwideFallback].slice(0, FREE_DECK_SIZE);
  }

  // ──────────────────────────────────────────────────────────
  // getWeightedPool
  // ──────────────────────────────────────────────────────────

  /**
   * Build a country-weighted name pool.
   *
   * @param allNames      Bundled core name dataset (+ remote premium merged by caller when entitled)
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

    // 3. Split primary into country-specific, region-general and worldwide
    const { countrySpecific, regionGeneral, worldwide, adjacent, discovery } =
      this._partitionPools(base, region, country, adjacentRegions);

    // 4. Calculate target sizes (blend shifts after LEARNING_THRESHOLD swipes)
    const progress = Math.min(swipeCount / LEARNING_THRESHOLD, 1);
    const primaryPct  = 0.80 - (0.10 * progress); // 80% → 70%
    const adjacentPct = 0.15 + (0.05 * progress); // 15% → 20%
    const discoveryPct = 0.05 + (0.05 * progress); //  5% → 10%

    const primaryTarget  = Math.round(DECK_SIZE * primaryPct);
    const adjacentTarget = Math.round(DECK_SIZE * adjacentPct);
    const discoveryTarget = Math.round(DECK_SIZE * discoveryPct);

    // 5. Sample — country-specific names get a dedicated budget inside primary
    const countryPrimaryTarget = country ? Math.round(primaryTarget * 0.7) : 0;
    const regionPrimaryTarget = Math.round(primaryTarget * 0.2);
    const worldwidePrimaryTarget = primaryTarget - countryPrimaryTarget - regionPrimaryTarget;

    const sampledCountryPrimary = this._shuffle([...countrySpecific]).slice(0, countryPrimaryTarget);
    const sampledRegionPrimary = this._shuffle([...regionGeneral]).slice(
      0,
      regionPrimaryTarget + Math.max(0, countryPrimaryTarget - sampledCountryPrimary.length),
    );
    const sampledWorldwidePrimary = this._shuffle([...worldwide]).slice(0, worldwidePrimaryTarget);
    const sampledPrimary = this._dedupeById([
      ...sampledCountryPrimary,
      ...sampledRegionPrimary,
      ...sampledWorldwidePrimary,
    ]).slice(0, primaryTarget);
    const sampledAdjacent = this._shuffle([...adjacent]).slice(0, adjacentTarget);
    const sampledDiscovery = this._shuffle([...discovery]).slice(0, discoveryTarget);

    return [...sampledPrimary, ...sampledAdjacent, ...sampledDiscovery];
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  private _partitionPools(
    names: BabyName[],
    region: Region,
    country: string | undefined,
    adjacentRegions: Region[] = [],
  ): {
    countrySpecific: BabyName[];
    regionGeneral: BabyName[];
    worldwide: BabyName[];
    adjacent: BabyName[];
    discovery: BabyName[];
  } {
    const countrySpecific: BabyName[] = [];
    const regionGeneral: BabyName[] = [];
    const worldwide: BabyName[] = [];
    const adjacent: BabyName[] = [];
    const discovery: BabyName[] = [];

    for (const name of names) {
      if (country && name.country === country) {
        countrySpecific.push(name);
      } else if (name.region === region) {
        regionGeneral.push(name);
      } else if (name.is_worldwide) {
        worldwide.push(name);
      } else if (adjacentRegions.includes(name.region as Region)) {
        adjacent.push(name);
      } else {
        discovery.push(name);
      }
    }

    return { countrySpecific, regionGeneral, worldwide, adjacent, discovery };
  }

  private _adjacentRegions(region: Region, purchasedPacks: string[]): Region[] {
    const base = ADJACENT_REGIONS[region] ?? [];
    // Phase 5 hook: purchased packs expand the adjacent pool
    const extras = purchasedPacks
      .filter((p): p is Region => p in ADJACENT_REGIONS && !base.includes(p as Region) && p !== region)
      .map((p) => p as Region);
    return [...base, ...extras];
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

  private _dedupeById(names: BabyName[]): BabyName[] {
    const seen = new Set<string>();
    const result: BabyName[] = [];
    for (const name of names) {
      if (!seen.has(name.id)) {
        seen.add(name.id);
        result.push(name);
      }
    }
    return result;
  }
}

/** Singleton */
export const countryWeightingService = new CountryWeightingService();
