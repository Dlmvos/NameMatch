import type { BabyName } from '../types';

export type SwipeMetadataLabelKey =
  | 'swipe.next.risingNow'
  | 'swipe.next.classicPick'
  | 'swipe.next.newVibe'
  | 'swipe.next.popularChoice';

/**
 * Shared metadata-chip derivation for swipe cards and stacked preview.
 * Keep this in one place so a card preserves the same category label when promoted.
 */
export function getSwipeMetadataLabelKey(
  name: Pick<BabyName, 'trend' | 'country' | 'popularity_rank'>,
  countryPreference: string | null,
): SwipeMetadataLabelKey | null {
  if (name.trend === 'rising') return 'swipe.next.risingNow';
  if (name.trend === 'classic') return 'swipe.next.classicPick';
  if (countryPreference && name.country && name.country !== countryPreference) return 'swipe.next.newVibe';
  if ((name.popularity_rank ?? 999) <= 30) return 'swipe.next.popularChoice';
  return null;
}
