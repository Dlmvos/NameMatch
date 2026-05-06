import type { BabyName, GenderPreference, Region, SwipeDirection } from '../types';
import { PremiumContentService } from './PremiumContentService';

export interface SwipeSignal {
  direction: SwipeDirection;
  name: BabyName;
}

export interface RecommendationInput {
  swipeHistory: SwipeSignal[];
  genderPreference?: GenderPreference | null;
  countryPreference?: string | null;
  regionPreference?: Region | null;
  purchasedPacks?: string[];
}

export interface RecommendedPack {
  packType: string;
  title: string;
  titleKey: string;
  packNames: BabyName[];
  price: number;
}

const LEGACY_AI_PREFIX = 'AI_';
const CURATED_PREFIX = 'CURATED_';

/** Companion id persisted by older app builds for the same deterministic recommendation pack. */
export function legacyCuratedPackTypeId(packType: string): string | null {
  if (packType.startsWith(CURATED_PREFIX))
    return LEGACY_AI_PREFIX + packType.slice(CURATED_PREFIX.length);
  if (packType.startsWith(LEGACY_AI_PREFIX))
    return CURATED_PREFIX + packType.slice(LEGACY_AI_PREFIX.length);
  return null;
}

export function purchasedIncludesCuratedPack(purchased: Iterable<string>, packType: string): boolean {
  const set = purchased instanceof Set ? purchased : new Set(purchased);
  if (set.has(packType)) return true;
  const legacy = legacyCuratedPackTypeId(packType);
  return legacy ? set.has(legacy) : false;
}

export function wasCuratedPackOffered(offered: ReadonlySet<string>, packType: string): boolean {
  if (offered.has(packType)) return true;
  const legacy = legacyCuratedPackTypeId(packType);
  return legacy ? offered.has(legacy) : false;
}

export function noteCuratedPackOffered(offered: Set<string>, packType: string): void {
  offered.add(packType);
  const legacy = legacyCuratedPackTypeId(packType);
  if (legacy) offered.add(legacy);
}

function pickNames(
  predicate: (name: BabyName) => boolean,
  fallback: (name: BabyName) => boolean,
  includePremium: boolean,
): BabyName[] {
  const allNames = PremiumContentService.getBundledNamesForSource({ includePremium });
  const primary = allNames.filter(predicate);
  const secondary = allNames.filter((n) => !primary.some((p) => p.id === n.id) && fallback(n));
  return [...primary, ...secondary].slice(0, 16);
}

export function getRecommendedPack(input: RecommendationInput): RecommendedPack | null {
  const likes = input.swipeHistory.filter((s) => s.direction === 'right');
  if (likes.length < 4) return null;

  const purchased = input.purchasedPacks ?? [];
  const purchasedSet = new Set(purchased);
  const includePremium = purchased.length > 0;
  const likedNames = likes.map((l) => l.name);
  const avgLength =
    likedNames.reduce((sum, n) => sum + n.name.length, 0) / Math.max(1, likedNames.length);
  const rareLikeCount = likedNames.filter((n) => (n.popularity_rank ?? 999) > 120).length;
  const rareRatio = rareLikeCount / Math.max(1, likedNames.length);

  if (input.countryPreference) {
    const countryPackType = `CURATED_COUNTRY_${input.countryPreference.replace(/\s+/g, '_').toUpperCase()}`;
    if (!purchasedIncludesCuratedPack(purchasedSet, countryPackType)) {
      const packNames = pickNames(
        (n) => n.country === input.countryPreference,
        (n) => n.region === (input.regionPreference ?? 'WORLDWIDE'),
        includePremium,
      );
      if (packNames.length >= 12) {
        const isNetherlands =
          input.countryPreference.trim().toLowerCase() === 'netherlands';
        return {
          packType: countryPackType,
          title: `${input.countryPreference} Favorites`,
          titleKey: isNetherlands ? 'pack.nlFavorites.title' : 'pack.worldwide.title',
          packNames,
          price: 1.29,
        };
      }
    }
  }

  if (avgLength <= 5 && !purchasedIncludesCuratedPack(purchasedSet, 'CURATED_MODERN_SHORT')) {
    return {
      packType: 'CURATED_MODERN_SHORT',
      title: 'Modern Short Names',
      titleKey: 'pack.worldwide.title',
      packNames: pickNames(
        (n) => n.name.length <= 5,
        (n) => n.name.length <= 6,
        includePremium,
      ),
      price: 0.99,
    };
  }

  if (input.genderPreference === 'boy' && !purchasedIncludesCuratedPack(purchasedSet, 'CURATED_STRONG_BOY')) {
    return {
      packType: 'CURATED_STRONG_BOY',
      title: 'Strong Boy Names',
      titleKey: 'pack.usPack.title',
      packNames: pickNames(
        (n) => n.gender === 'boy',
        (n) => n.gender !== 'girl',
        includePremium,
      ),
      price: 1.19,
    };
  }

  if (input.genderPreference === 'girl' && !purchasedIncludesCuratedPack(purchasedSet, 'CURATED_ELEGANT_GIRL')) {
    return {
      packType: 'CURATED_ELEGANT_GIRL',
      title: 'Elegant Girl Names',
      titleKey: 'pack.usPack.title',
      packNames: pickNames(
        (n) => n.gender === 'girl',
        (n) => n.gender !== 'boy',
        includePremium,
      ),
      price: 1.19,
    };
  }

  if (rareRatio >= 0.4 && !purchasedIncludesCuratedPack(purchasedSet, 'CURATED_RARE_GLOBAL')) {
    return {
      packType: 'CURATED_RARE_GLOBAL',
      title: 'Rare Global Names',
      titleKey: 'pack.worldwide.title',
      packNames: pickNames(
        (n) => (n.popularity_rank ?? 999) > 120,
        () => true,
        includePremium,
      ),
      price: 1.49,
    };
  }

  if (!purchasedIncludesCuratedPack(purchasedSet, 'CURATED_CLASSIC_EU')) {
    return {
      packType: 'CURATED_CLASSIC_EU',
      title: 'Classic European Names',
      titleKey: 'pack.euPack.title',
      packNames: pickNames(
        (n) => n.region === 'EU',
        () => true,
        includePremium,
      ),
      price: 1.29,
    };
  }

  return null;
}
