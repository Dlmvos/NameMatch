import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadPreferenceProfile } from '../algorithm/preferenceProfiler';
import { generateSwipeDeck, getCompatibilitySignal, type CompatibilitySignal } from '../algorithm/swipeDeck';
import { trackDeckLoaded, trackMatch, trackPartnerActivity, trackSwipe } from '../services/analytics';
import { recordSwipeAndCheckMatch } from '../services/matchEngine';
import { notifyMatch, notifyPartnerActivity, notifyPotentialMatches } from '../services/notificationTriggers';
import { getPartnerActivitySummary } from '../services/partnerActivity';
import { getSwipedBabyNameIds, type NameRecord, type PreferenceProfile } from '../services/supabase';
// New architecture imports
import { nameSourceService } from '../services/NameSourceService';
import { nameNormalizationService } from '../services/NameNormalizationService';
import { userPreferenceLearningService } from '../services/UserPreferenceLearningService';
import { adaptNameRecord } from '../services/nameTypes';

type Params = {
  roomId: string;
  userId: string;
  deckSize?: number;
};

const EMPTY_PROFILE: PreferenceProfile = {
  preferredGenders: [],
  preferredOrigins: [],
  preferredStyles: [],
  likedNameIds: [],
  matchedNameIds: [],
  seedNameIds: [],
};

export function useSmartSwipeFlow({ roomId, userId, deckSize = 24 }: Params) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deck, setDeck] = useState<NameRecord[]>([]);
  const [partnerLikedToday, setPartnerLikedToday] = useState(0);
  const [potentialMatchesCount, setPotentialMatchesCount] = useState(0);
  const [userProfile, setUserProfile] = useState<PreferenceProfile>(EMPTY_PROFILE);
  const [partnerProfile, setPartnerProfile] = useState<PreferenceProfile>(EMPTY_PROFILE);

  const topCard = useMemo(() => deck[0] ?? null, [deck]);

  const topCardCompatibility: CompatibilitySignal = useMemo(
    () => getCompatibilitySignal(topCard, userProfile, partnerProfile),
    [topCard, userProfile, partnerProfile],
  );

  const loadDeck = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = !!opts?.silent;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const activity = await getPartnerActivitySummary(roomId, userId);

        const [rawNames, nextUserProfile, nextPartnerProfile, excludeIds] = await Promise.all([
          // Use new NameSourceService (Supabase → LocalSeed cascade, cached)
          nameSourceService.getFullPool().catch(() => [] as Awaited<ReturnType<typeof nameSourceService.getFullPool>>),
          loadPreferenceProfile({ userId, roomId }),
          activity.partnerId
            ? loadPreferenceProfile({ userId: activity.partnerId, roomId })
            : Promise.resolve(EMPTY_PROFILE),
          getSwipedBabyNameIds(roomId, userId),
        ]);

        // Normalize and cast to NameRecord shape (NormalizedNameRecord is a superset)
        const names = nameNormalizationService.normalizeMany(rawNames) as unknown as NameRecord[];

        setUserProfile(nextUserProfile);
        setPartnerProfile(nextPartnerProfile);

        const nextDeck = generateSwipeDeck({
          names,
          userProfile: nextUserProfile,
          partnerProfile: nextPartnerProfile,
          excludeIds,
          deckSize,
        });

        console.log('[deck reload]', {
          silent,
          excludeCount: excludeIds.length,
          top5: nextDeck.slice(0, 5).map((n) => n.name),
        });

        setDeck(nextDeck);
        setPartnerLikedToday(activity.partnerLikedToday);
        setPotentialMatchesCount(activity.potentialMatchesCount);

        trackDeckLoaded({
          roomId,
          userId,
          deckSize: nextDeck.length,
          partnerLikedToday: activity.partnerLikedToday,
          potentialMatchesCount: activity.potentialMatchesCount,
        });

        if (activity.partnerLikedToday > 0) {
          trackPartnerActivity({ roomId, userId, partnerLikedToday: activity.partnerLikedToday });
        }
      } catch (error) {
        console.error('[loadDeck error]', error);
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [deckSize, roomId, userId],
  );

  useEffect(() => {
    loadDeck().catch((error) => {
      console.error('[initial loadDeck error]', error);
      setLoading(false);
    });
  }, [loadDeck]);

  const handleSwipe = useCallback(
    async (name: NameRecord, liked: boolean) => {
      console.log('[swipe start]', { id: name.id, name: name.name, liked });

      setDeck((current) => current.filter((item) => item.id !== name.id));

      try {
        const result = await recordSwipeAndCheckMatch({
          room_id: roomId,
          user_id: userId,
          baby_name_id: name.id,
          liked,
          direction: liked ? 'right' : 'left',
          gender: name.gender,
          origin: name.origin,
          style: name.style_tags ?? [],
        });

        console.log('[swipe saved]', { id: name.id, name: name.name, matched: result.matched });

        trackSwipe({
          roomId,
          userId,
          babyNameId: name.id,
          direction: liked ? 'right' : 'left',
          liked,
          compatibilityLabel: topCardCompatibility.label,
          compatibilityScore: topCardCompatibility.score,
        });

        const activity = await getPartnerActivitySummary(roomId, userId);
        setPartnerLikedToday(activity.partnerLikedToday);
        setPotentialMatchesCount(activity.potentialMatchesCount);

        // Fire-and-forget preference learning — does not block swipe UX
        {
          const normalized = adaptNameRecord(name);
          const signal = result.matched ? 'match' : liked ? 'like' : 'skip';
          userPreferenceLearningService.recordSwipe(userId, normalized, signal).catch(() => {});
        }

        if (result.matched) {
          trackMatch({
            roomId,
            userId,
            babyNameId: name.id,
            matchId: result.matchId,
            compatibilityLabel: topCardCompatibility.label,
            compatibilityScore: topCardCompatibility.score,
          });
          await notifyMatch(name.name);
        } else if (activity.potentialMatchesCount > 0) {
          await notifyPotentialMatches(activity.potentialMatchesCount);
        } else if (activity.partnerLikedToday > 0) {
          await notifyPartnerActivity(activity.partnerLikedToday);
        }

        setDeck((current) => {
          if (current.length <= 6 && !refreshing) {
            setTimeout(() => {
              loadDeck({ silent: true }).catch(console.error);
            }, 50);
          }
          return current;
        });

        return result;
      } catch (error) {
        console.error('[swipe error]', error);
        setDeck((current) => [name, ...current.filter((item) => item.id !== name.id)]);
        throw error;
      }
    },
    [loadDeck, refreshing, roomId, topCardCompatibility.label, topCardCompatibility.score, userId],
  );

  return {
    loading,
    refreshing,
    deck,
    topCard,
    topCardCompatibility,
    partnerLikedToday,
    potentialMatchesCount,
    reload: loadDeck,
    swipeLeft: async (name: NameRecord) => handleSwipe(name, false),
    swipeRight: async (name: NameRecord) => handleSwipe(name, true),
  };
}
