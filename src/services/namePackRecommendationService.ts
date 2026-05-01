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

  const purchased = new Set(input.purchasedPacks ?? []);
  const includePremium = (input.purchasedPacks?.length ?? 0) > 0;
  const likedNames = likes.map((l) => l.name);
  const avgLength =
    likedNames.reduce((sum, n) => sum + n.name.length, 0) / Math.max(1, likedNames.length);
  const rareLikeCount = likedNames.filter((n) => (n.popularity_rank ?? 999) > 120).length;
  const rareRatio = rareLikeCount / Math.max(1, likedNames.length);

  if (input.countryPreference) {
    const countryPackType = `AI_COUNTRY_${input.countryPreference.replace(/\s+/g, '_').toUpperCase()}`;
    if (!purchased.has(countryPackType)) {
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

  if (avgLength <= 5 && !purchased.has('AI_MODERN_SHORT')) {
    return {
      packType: 'AI_MODERN_SHORT',
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

  if (input.genderPreference === 'boy' && !purchased.has('AI_STRONG_BOY')) {
    return {
      packType: 'AI_STRONG_BOY',
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

  if (input.genderPreference === 'girl' && !purchased.has('AI_ELEGANT_GIRL')) {
    return {
      packType: 'AI_ELEGANT_GIRL',
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

  if (rareRatio >= 0.4 && !purchased.has('AI_RARE_GLOBAL')) {
    return {
      packType: 'AI_RARE_GLOBAL',
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

  if (!purchased.has('AI_CLASSIC_EU')) {
    return {
      packType: 'AI_CLASSIC_EU',
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
