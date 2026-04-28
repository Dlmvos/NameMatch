import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useRoom } from './RoomContext';
import { SwipeService } from '../services/SwipeService';
import {
  BabyName,
  NameFilters,
  DEFAULT_FILTERS,
  Region,
  SwipeDirection,
} from '../types';
import { PremiumContentService } from '../services/PremiumContentService';
import { enrichName, getNameLength } from '../services/nameEnrichment';
import { countryWeightingService } from '../services/CountryWeightingService';
import { useApp } from './AppContext';
import { userPreferenceLearningService } from '../services/UserPreferenceLearningService';

function nameGenderDedupeKey(n: BabyName): string {
  return `${n.name.trim().toLowerCase()}|${n.gender}`;
}

/** Merges deck slices in order: bundled core → public DB supplement → remote premium; drops later duplicates by (name, gender). */
/** Bulk-import / Supabase `baby_names.id` uses UUID; bundled core uses short numeric ids. */
const UUID_LIKE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mergeDeckSourcesByNameGender(
  core: BabyName[],
  publicSupplement: BabyName[],
  premiumRemote: BabyName[] | null,
): BabyName[] {
  const seen = new Set<string>();
  const out: BabyName[] = [];
  for (const n of core) {
    seen.add(nameGenderDedupeKey(n));
    out.push(n);
  }
  for (const n of publicSupplement) {
    const k = nameGenderDedupeKey(n);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  if (premiumRemote) {
    for (const n of premiumRemote) {
      const k = nameGenderDedupeKey(n);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
  }
  return out;
}

function stableHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function applySharedRoomOrdering(names: BabyName[], roomId: string | null): BabyName[] {
  if (!roomId) return names;
  return names
    .map((name, index) => ({
      name,
      index,
      score: stableHash(`${roomId}:${name.id}`),
    }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.name);
}

function applySharedRoomOrderingWithinPriorityGroups(
  names: BabyName[],
  roomId: string | null,
  countryPreference: string | null,
  regionPreference: Region,
): BabyName[] {
  if (!roomId || !countryPreference) return applySharedRoomOrdering(names, roomId);
  const orderDbThenBundled = (group: BabyName[]): BabyName[] => {
    const dbBacked = group.filter((name) => UUID_LIKE_ID.test(name.id));
    const bundled = group.filter((name) => !UUID_LIKE_ID.test(name.id));
    return [
      ...applySharedRoomOrdering(dbBacked, roomId),
      ...applySharedRoomOrdering(bundled, roomId),
    ];
  };
  const countrySpecific: BabyName[] = [];
  const sameRegion: BabyName[] = [];
  const fallback: BabyName[] = [];
  for (const name of names) {
    if (name.country === countryPreference) {
      countrySpecific.push(name);
    } else if (name.region === regionPreference) {
      sameRegion.push(name);
    } else {
      fallback.push(name);
    }
  }
  return [
    ...orderDbThenBundled(countrySpecific),
    ...orderDbThenBundled(sameRegion),
    ...orderDbThenBundled(fallback),
  ];
}

interface SwipeDeckStateContextValue {
  namesToSwipe: BabyName[];
  isLoadingNames: boolean;
  filters: NameFilters;
  activeFilterCount: number;
}

interface SwipeDeckActionsContextValue {
  recordSwipe: (nameId: string, direction: SwipeDirection) => Promise<boolean>;
  loadMoreNames: () => void;
  setFilters: (f: NameFilters) => void;
}

const SwipeDeckStateContext = createContext<SwipeDeckStateContextValue | null>(null);
const SwipeDeckActionsContext = createContext<SwipeDeckActionsContextValue | null>(null);

export function useSwipeDeckState(): SwipeDeckStateContextValue {
  const ctx = useContext(SwipeDeckStateContext);
  if (!ctx) throw new Error('useSwipeDeckState must be used within <SwipeDeckProvider>');
  return ctx;
}

export function useSwipeDeckActions(): SwipeDeckActionsContextValue {
  const ctx = useContext(SwipeDeckActionsContext);
  if (!ctx) throw new Error('useSwipeDeckActions must be used within <SwipeDeckProvider>');
  return ctx;
}

// Back-compat combined hook. Prefer state/actions hooks for performance.
export function useSwipeDeck(): SwipeDeckStateContextValue & SwipeDeckActionsContextValue {
  const state = useSwipeDeckState();
  const actions = useSwipeDeckActions();
  return { ...state, ...actions };
}

export function SwipeDeckProvider({ children }: { children: React.ReactNode }) {
  const { profile, user, consumeFreeSwipe } = useAuth();
  const { room, handleConfirmedMatch } = useRoom();
  const { effectiveUnlockedPacks, countryPreference, isCountryPrefHydrated, effectiveLanguage } =
    useApp();
  const baselineDeckNames = useMemo(
    () =>
      PremiumContentService.getBundledNamesForSource({
        includePremium: effectiveUnlockedPacks.length > 0,
      }),
    [effectiveUnlockedPacks.length],
  );

  /** Non-premium DB rows; empty after failed fetch or no swipe access. */
  const [publicDeckSupplement, setPublicDeckSupplement] = useState<BabyName[]>([]);
  /** Remote premium rows only; `null` = not entitled, failed fetch, or empty catalog. */
  const [remotePremiumList, setRemotePremiumList] = useState<BabyName[] | null>(null);

  const deckNames = useMemo(
    () => mergeDeckSourcesByNameGender(baselineDeckNames, publicDeckSupplement, remotePremiumList),
    [baselineDeckNames, publicDeckSupplement, remotePremiumList],
  );

  const [namesToSwipe, setNamesToSwipe] = useState<BabyName[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [filters, setFiltersState] = useState<NameFilters>(DEFAULT_FILTERS);

  const swipedIdsRef = useRef<Set<string>>(new Set());
  /** IDs of custom names the partner created that the current user hasn't swiped yet — front-loaded in deck. */
  const partnerCustomIdsRef = useRef<Set<string>>(new Set());
  const nameLengthCacheRef = useRef<Map<string, ReturnType<typeof getNameLength>>>(new Map());
  const trendCacheRef = useRef<Map<string, BabyName['trend'] | undefined>>(new Map());

  // Refs to keep swipe actions stable even while deck state is changing rapidly.
  const namesToSwipeRef = useRef<BabyName[]>([]);
  const freeSwipesRemainingRef = useRef<number>(0);
  const hasPaidPackRef = useRef<boolean>(false);
  const userIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const consumeFreeSwipeRef = useRef<((count?: number) => Promise<void>) | null>(null);
  const handleConfirmedMatchRef = useRef<((name: BabyName) => Promise<void>) | null>(null);

  useEffect(() => {
    namesToSwipeRef.current = namesToSwipe;
  }, [namesToSwipe]);

  useEffect(() => {
    freeSwipesRemainingRef.current = profile?.free_swipes_remaining ?? 0;
    hasPaidPackRef.current = effectiveUnlockedPacks.length > 0;
    userIdRef.current = user?.id ?? null;
    roomIdRef.current = room?.id ?? profile?.room_id ?? null;
    consumeFreeSwipeRef.current = consumeFreeSwipe;
    handleConfirmedMatchRef.current = handleConfirmedMatch;
  }, [consumeFreeSwipe, effectiveUnlockedPacks, handleConfirmedMatch, profile?.free_swipes_remaining, profile?.room_id, profile?.id, room?.id, user?.id]);

  const activeFilterCount =
    (filters.lengths.length > 0 ? 1 : 0) +
    (filters.startingLetter ? 1 : 0) +
    (filters.trends.length > 0 ? 1 : 0) +
    (filters.originsContain ? 1 : 0);

  const purchasedPacksKey = useMemo(
    () => effectiveUnlockedPacks.join(','),
    [effectiveUnlockedPacks],
  );

  const hasFreeSwipeEntitlement = (profile?.free_swipes_remaining ?? 0) > 0;

  /** Stable key: rebuild deck only when pool inputs change — not on every `free_swipes_remaining` tick. */
  const nameQueueRebuildKey = useMemo(() => {
    if (!profile?.id) return '';
    const hasPaidPack = effectiveUnlockedPacks.length > 0;
    const swipeAccessTier = hasPaidPack ? 'paid' : hasFreeSwipeEntitlement ? 'free' : 'locked';
    return [
      profile.id,
      profile.gender_preference ?? '',
      profile.region_preference ?? '',
      swipeAccessTier,
      purchasedPacksKey,
      countryPreference ?? '',
      JSON.stringify(filters),
    ].join('|');
  }, [
    profile?.id,
    profile?.gender_preference,
    profile?.region_preference,
    hasFreeSwipeEntitlement,
    effectiveUnlockedPacks.length,
    purchasedPacksKey,
    countryPreference,
    filters,
  ]);

  useEffect(() => {
    if (!profile?.id || !isCountryPrefHydrated) {
      setPublicDeckSupplement([]);
      return;
    }
    if (!hasFreeSwipeEntitlement && effectiveUnlockedPacks.length === 0) {
      setPublicDeckSupplement([]);
      return;
    }

    let cancelled = false;
    PremiumContentService.fetchRemotePublicDeckSupplement({
      limit: 400,
      region: profile.region_preference ?? null,
      gender: profile.gender_preference ?? 'both',
    }).then((rows) => {
      if (!cancelled) setPublicDeckSupplement(rows);
    });

    return () => {
      cancelled = true;
    };
  }, [
    profile?.id,
    profile?.region_preference,
    profile?.gender_preference,
    isCountryPrefHydrated,
    hasFreeSwipeEntitlement,
    effectiveUnlockedPacks.length,
  ]);

  useEffect(() => {
    const includePremium = effectiveUnlockedPacks.length > 0;
    if (!includePremium || !user?.id) {
      setRemotePremiumList(null);
      return;
    }

    let cancelled = false;
    PremiumContentService.fetchRemotePremiumNames({
      includePremium: true,
      userId: user.id,
      meaningLocale: effectiveLanguage,
    }).then((remotePremium) => {
      if (cancelled || !remotePremium?.length) {
        if (!cancelled) setRemotePremiumList(null);
        return;
      }
      if (!cancelled) setRemotePremiumList(remotePremium);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, effectiveUnlockedPacks.length, purchasedPacksKey, effectiveLanguage]);

  useEffect(() => {
    if (!__DEV__) return;
    const mergeInputCount =
      baselineDeckNames.length + publicDeckSupplement.length + (remotePremiumList?.length ?? 0);
    const mergeDuplicatesSuppressedByNameGender = Math.max(0, mergeInputCount - deckNames.length);
    const supplementByRegion = publicDeckSupplement.reduce<Record<string, number>>((acc, n) => {
      const k = n.region ?? '?';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    const supplementEuByCountry = publicDeckSupplement.reduce<Record<string, number>>((acc, n) => {
      if (n.region !== 'EU') return acc;
      const k = (n.country ?? '').trim() || '(no country)';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    const supplementLatamByCountry = publicDeckSupplement.reduce<Record<string, number>>((acc, n) => {
      if (n.region !== 'LATIN_AMERICA') return acc;
      const k = (n.country ?? '').trim() || '(no country)';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    const mergedDeckEuByCountry = deckNames.reduce<Record<string, number>>((acc, n) => {
      if (n.region !== 'EU') return acc;
      const k = (n.country ?? '').trim() || '(no country)';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    const mergedDeckLatamByCountry = deckNames.reduce<Record<string, number>>((acc, n) => {
      if (n.region !== 'LATIN_AMERICA') return acc;
      const k = (n.country ?? '').trim() || '(no country)';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    // ── Dedup-loss breakdown: which source lost names to dedup? ──
    const coreKeys = new Set(baselineDeckNames.map(nameGenderDedupeKey));
    const supplementSuppressedByCore = publicDeckSupplement.filter((n) => coreKeys.has(nameGenderDedupeKey(n)));
    const supplementSuppressedCountries: Record<string, number> = {};
    for (const n of supplementSuppressedByCore) {
      const c = (n.country ?? '').trim() || '(no country)';
      supplementSuppressedCountries[c] = (supplementSuppressedCountries[c] ?? 0) + 1;
    }

    // ── Merged deck: full region + country breakdown ──
    const mergedByRegion = deckNames.reduce<Record<string, number>>((acc, n) => {
      acc[n.region ?? '?'] = (acc[n.region ?? '?'] ?? 0) + 1;
      return acc;
    }, {});
    const mergedByCountry = deckNames.reduce<Record<string, number>>((acc, n) => {
      const c = (n.country ?? '').trim() || '(no country)';
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {});

    console.log('[SwipeDeck] merged pool', {
      regionPref: profile?.region_preference ?? null,
      genderPref: profile?.gender_preference ?? null,
      countryPref: countryPreference ?? null,
      bundledCore: baselineDeckNames.length,
      publicDbSupplement: publicDeckSupplement.length,
      publicSupplementByRegion: supplementByRegion,
      publicSupplementEuByCountry: supplementEuByCountry,
      publicSupplementLatamByCountry: supplementLatamByCountry,
      mergedDeckEuByCountry,
      mergedDeckLatamByCountry,
      mergedNetherlandsInDeck: mergedDeckEuByCountry['Netherlands'] ?? 0,
      mergedFranceInDeck: mergedDeckEuByCountry['France'] ?? 0,
      mergedItalyInDeck: mergedDeckEuByCountry['Italy'] ?? 0,
      mergedPortugalInDeck: mergedDeckEuByCountry['Portugal'] ?? 0,
      mergedSpainInDeck: mergedDeckEuByCountry['Spain'] ?? 0,
      mergedBrazilInDeck: mergedDeckLatamByCountry['Brazil'] ?? 0,
      mergeDuplicatesSuppressedByNameGender,
      remotePremium: remotePremiumList?.length ?? 0,
      mergedDeckNames: deckNames.length,
    });
    console.log('[SwipeDeck] dedup loss', {
      supplementSuppressedByCore: supplementSuppressedByCore.length,
      suppressedByCountry: supplementSuppressedCountries,
    });
    console.log('[SwipeDeck] merged full breakdown', {
      byRegion: mergedByRegion,
      byCountry: mergedByCountry,
    });
  }, [
    profile?.region_preference,
    profile?.gender_preference,
    countryPreference,
    baselineDeckNames.length,
    publicDeckSupplement.length,
    remotePremiumList,
    deckNames,
  ]);

  useEffect(() => {
    if (!__DEV__) return;
    const dbBackedInVisibleQueue = namesToSwipe.filter((n) => UUID_LIKE_ID.test(n.id)).length;
    const spainInVisibleQueue = namesToSwipe.filter((n) => n.country === 'Spain').length;
    const portugalInVisibleQueue = namesToSwipe.filter((n) => n.country === 'Portugal').length;
    const brazilInVisibleQueue = namesToSwipe.filter((n) => n.country === 'Brazil').length;
    // ── Full visible-queue breakdown ──
    const visibleByRegion = namesToSwipe.reduce<Record<string, number>>((acc, n) => {
      acc[n.region ?? '?'] = (acc[n.region ?? '?'] ?? 0) + 1;
      return acc;
    }, {});
    const visibleByCountry = namesToSwipe.reduce<Record<string, number>>((acc, n) => {
      const c = (n.country ?? '').trim() || '(no country)';
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {});
    const visibleBundledCount = namesToSwipe.filter((n) => !UUID_LIKE_ID.test(n.id)).length;
    console.log('[SwipeDeck] visible queue', {
      visible: namesToSwipe.length,
      dbBackedInVisibleQueue,
      bundledInVisibleQueue: visibleBundledCount,
      spainInVisibleQueue,
      portugalInVisibleQueue,
      brazilInVisibleQueue,
    });
    console.log('[SwipeDeck] visible queue breakdown', {
      byRegion: visibleByRegion,
      byCountry: visibleByCountry,
    });
    console.log('[SwipeDeck] top visible cards', {
      cards: namesToSwipe.slice(0, 5).map((n, index) => ({
        index,
        id: n.id,
        isUuid: UUID_LIKE_ID.test(n.id),
        name: n.name,
        country: n.country ?? null,
        origin: n.origin ?? null,
        source: n.source ?? null,
      })),
    });
  }, [namesToSwipe]);

  const getCachedNameLength = useCallback((name: BabyName): ReturnType<typeof getNameLength> => {
    const cached = nameLengthCacheRef.current.get(name.id);
    if (cached) return cached;
    const computed = getNameLength(name.name);
    nameLengthCacheRef.current.set(name.id, computed);
    return computed;
  }, []);

  const getCachedTrend = useCallback((name: BabyName): BabyName['trend'] | undefined => {
    if (trendCacheRef.current.has(name.id)) {
      return trendCacheRef.current.get(name.id);
    }
    const computed = enrichName(name.name).trend ?? name.trend;
    trendCacheRef.current.set(name.id, computed);
    return computed;
  }, []);

  // ── Core name queue builder (synchronous — guaranteed safe) ──
  const buildNameQueue = useCallback(() => {
    if (!profile || !isCountryPrefHydrated) return;
    setIsLoadingNames(true);

    const genderPref = profile.gender_preference ?? 'both';
    const region = (profile.region_preference ?? 'WORLDWIDE') as Region;
    const freeSwipesRemaining = profile.free_swipes_remaining ?? 0;
    const purchasedPacks = effectiveUnlockedPacks;
    const hasPaidPack = purchasedPacks.length > 0;
    const hasFreeEntitlement = freeSwipesRemaining > 0;
    const sharedRoomId = room?.id ?? profile.room_id ?? null;

    let pool: BabyName[] = [];
    if (!hasFreeEntitlement && !hasPaidPack) {
      // No free entitlement and no purchased packs: lock swipe deck.
      pool = [];
    } else if (!hasPaidPack) {
      pool = countryWeightingService.getFreeTierCountryFirstPool(
        deckNames,
        region,
        countryPreference ?? undefined,
        genderPref,
      );
    } else {
      // Paid tier: keep weighted discovery flow, expanded by purchased packs.
      pool = countryWeightingService.getWeightedPool(
        deckNames,
        region,
        countryPreference ?? undefined,
        genderPref,
        swipedIdsRef.current.size,
        purchasedPacks,
      );
    }

    // Apply active UI filters
    if (filters.lengths.length > 0) {
      pool = pool.filter((n) => filters.lengths.includes(getCachedNameLength(n)));
    }
    if (filters.startingLetter) {
      pool = pool.filter((n) => n.name[0]?.toUpperCase() === filters.startingLetter);
    }
    if (filters.originsContain) {
      const q = filters.originsContain.toLowerCase();
      pool = pool.filter((n) => n.origin.toLowerCase().includes(q));
    }
    if (filters.trends.length > 0) {
      pool = pool.filter((n) => {
        const trend = getCachedTrend(n);
        return trend ? filters.trends.includes(trend) : false;
      });
    }

    pool = applySharedRoomOrderingWithinPriorityGroups(pool, sharedRoomId, countryPreference, region);
    if (__DEV__ && sharedRoomId) {
      console.log('[SwipeDeck] shared-room ordering applied', {
        roomId: sharedRoomId,
        seedApplied: true,
        countryPref: countryPreference ?? null,
        regionPref: region,
        top5: pool.slice(0, 5).map((n, index) => ({
          index,
          id: n.id,
          name: n.name,
          country: n.country ?? null,
        })),
      });
    }

    // Exclude already-swiped names
    pool = pool.filter((n) => !swipedIdsRef.current.has(n.id));

    // ── Priority boost: partner custom names to the front ──
    if (partnerCustomIdsRef.current.size > 0) {
      const priority: BabyName[] = [];
      const rest: BabyName[] = [];
      for (const n of pool) {
        if (partnerCustomIdsRef.current.has(n.id)) {
          priority.push(n);
        } else {
          rest.push(n);
        }
      }
      if (priority.length > 0) {
        pool = [...priority, ...rest];
        if (__DEV__) {
          console.log(`[SwipeDeck] boosted ${priority.length} partner custom name(s) to front`);
        }
      }
    }

    if (__DEV__) {
      const top10 = pool.slice(0, 10);
      const top10CountryCounts = top10.reduce<Record<string, number>>((acc, n) => {
        const key = (n.country ?? '').trim() || '(no country)';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
      const top10DbBacked = top10.filter((n) => UUID_LIKE_ID.test(n.id)).length;
      console.log('[SwipeDeck] final ordering top10 country counts', {
        countryPref: countryPreference ?? null,
        regionPref: region,
        roomId: sharedRoomId,
        dbBacked: top10DbBacked,
        bundled: top10.length - top10DbBacked,
        top10CountryCounts,
      });
    }

    setNamesToSwipe(pool);
    setIsLoadingNames(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closure reads profile/filters/packs; nameQueueRebuildKey gates when those inputs meaningfully change
  }, [isCountryPrefHydrated, nameQueueRebuildKey, deckNames, room?.id, profile?.room_id]);

  // Rebuild when preferences, filters, packs, or swipe access *tier* change — not each free_swipes tick
  // profile?.id only (not whole profile) avoids rebuild on every free_swipes_remaining tick
  useEffect(() => {
    if (profile && isCountryPrefHydrated) buildNameQueue();
  }, [profile?.id, isCountryPrefHydrated, nameQueueRebuildKey, buildNameQueue]);

  // Explicitly react to country/region preference changes so deck composition updates without app refresh.
  useEffect(() => {
    if (!profile || !isCountryPrefHydrated) return;
    if (__DEV__) {
      console.log('[SwipeDeck] preference-triggered rebuild', {
        regionPref: profile.region_preference ?? null,
        countryPref: countryPreference ?? null,
      });
    }
    buildNameQueue();
  }, [profile?.region_preference, countryPreference, isCountryPrefHydrated, profile?.id, buildNameQueue]);

  useEffect(() => {
    const roomId = room?.id ?? profile?.room_id ?? null;
    if (!user || !roomId) return;

    const loadSwipedIds = async () => {
      const [ids, partnerCustom] = await Promise.all([
        SwipeService.getSwipedNameIds(user.id, roomId),
        SwipeService.getPartnerCustomNameIds({ userId: user.id, roomId }),
      ]);
      swipedIdsRef.current = ids;
      partnerCustomIdsRef.current = partnerCustom;
    };

    loadSwipedIds().then(() => buildNameQueue());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildNameQueue closure is gated by isCountryPrefHydrated + nameQueueRebuildKey
  }, [room?.id, profile?.room_id, user?.id]);

  // ── Swipe recording ─────────────────────────────────────────
  const loadMoreNames = useCallback(() => buildNameQueue(), [buildNameQueue]);

  const recordSwipe = useCallback(
    async (nameId: string, direction: SwipeDirection): Promise<boolean> => {
      const freeSwipesRemaining = freeSwipesRemainingRef.current;
      const hasPaidPack = hasPaidPackRef.current;
      if (freeSwipesRemaining <= 0 && !hasPaidPack) {
        return false;
      }

      const swipedName = namesToSwipeRef.current.find((n) => n.id === nameId);
      if (__DEV__) {
        console.log('[SwipeDeck] recordSwipe', nameId);
      }
      setNamesToSwipe((prev) => prev.filter((n) => n.id !== nameId));
      swipedIdsRef.current.add(nameId);

      if (!hasPaidPack && freeSwipesRemaining > 0) {
        const fn = consumeFreeSwipeRef.current;
        if (fn) await fn(1).catch(() => {});
      }

      const roomId = roomIdRef.current;
      const userId = userIdRef.current;
      if (!userId || !roomId) {
        return false;
      }

      try {
        await SwipeService.upsertSwipe({
          userId,
          roomId,
          nameId,
          direction,
        });
      } catch (err: any) {
        console.error('[SwipeDeck] recordSwipe error:', err?.message ?? err);
        return false;
      }

      let isMatch = false;
      if (direction === 'right') {
        try {
          isMatch = await SwipeService.checkAndCreateMatch({
            userId,
            roomId,
            nameId,
          });
          if (__DEV__) {
            console.log('[SwipeDeck] match RPC result after right swipe', {
              userId,
              roomId,
              nameId,
              name: swipedName?.name ?? null,
              isMatch,
              error: null,
            });
          }
          if (isMatch && swipedName) {
            if (__DEV__) {
              console.log('[SwipeDeck] match true received', {
                userId,
                roomId,
                nameId,
                name: swipedName.name,
              });
            }
            await handleConfirmedMatchRef.current?.(swipedName);
          }
        } catch (err: any) {
          if (__DEV__) {
            console.error('[SwipeDeck] match RPC error after right swipe', {
              userId,
              roomId,
              nameId,
              name: swipedName?.name ?? null,
              error: err?.message ?? String(err),
            });
          }
          isMatch = false;
        }
      }

      // Fire-and-forget preference learning (never blocks the swipe)
      if (swipedName && userId) {
        try {
          const signal = isMatch ? 'match' : direction === 'right' ? 'like' : 'skip';
          userPreferenceLearningService.recordSwipe(userId, swipedName, signal).catch(() => {});
        } catch {
          // ignore any conversion errors — learning is non-critical
        }
      }

      return isMatch;
    },
    [],
  );

  const setFilters = useCallback((f: NameFilters) => {
    swipedIdsRef.current = new Set();
    setFiltersState(f);
  }, []);

  const stateValue = useMemo(
    () => ({
      namesToSwipe,
      isLoadingNames,
      filters,
      activeFilterCount,
    }),
    [namesToSwipe, isLoadingNames, filters, activeFilterCount],
  );

  const actionsValue = useMemo(
    () => ({
      recordSwipe,
      loadMoreNames,
      setFilters,
    }),
    [recordSwipe, loadMoreNames, setFilters],
  );

  return (
    <SwipeDeckStateContext.Provider value={stateValue}>
      <SwipeDeckActionsContext.Provider value={actionsValue}>
        {children}
      </SwipeDeckActionsContext.Provider>
    </SwipeDeckStateContext.Provider>
  );
}

