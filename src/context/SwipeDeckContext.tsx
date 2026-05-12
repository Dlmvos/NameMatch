import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useRoom } from './RoomContext';
import { SwipeService } from '../services/SwipeService';
import {
  BabyName,
  NameFilters,
  NameOriginTag,
  NameVibeTag,
  DEFAULT_FILTERS,
  Region,
  SwipeDirection,
} from '../types';
import { PremiumContentService } from '../services/PremiumContentService';
import { enrichName, getNameLength } from '../services/nameEnrichment';
import { countryWeightingService } from '../services/CountryWeightingService';
import { useApp } from './AppContext';
import { userPreferenceLearningService } from '../services/UserPreferenceLearningService';
import { stableHash } from '../lib/stableHash';
import { sequenceSwipeDeck } from '../lib/deckSequencing';
import type { LearningProfile } from '../services/UserPreferenceLearningService';

function nameGenderDedupeKey(n: BabyName): string {
  return `${n.name.trim().toLowerCase()}|${n.gender}`;
}

function sanitizeFreeFilters(filters: NameFilters): NameFilters {
  if (filters.lengths.length > 0) {
    return { ...DEFAULT_FILTERS, lengths: [filters.lengths[0]] };
  }
  if (filters.trends.length > 0) {
    return { ...DEFAULT_FILTERS, trends: [filters.trends[0]] };
  }
  return DEFAULT_FILTERS;
}

/** Merges deck slices in order: bundled core → public DB supplement → remote premium; drops later duplicates by (name, gender). */
/** Bulk-import / Supabase `baby_names.id` uses UUID; bundled core uses short numeric ids. */
const UUID_LIKE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEBUG_SWIPE_DECK = false;
/** Max wait for remote deck / swipe restores so startup cannot hang indefinitely. */
const STARTUP_HYDRATION_TIMEOUT_MS = 12_000;
/** Keep top card mounted briefly after a mutual match so SwipeScreen can run pre-celebration inhale (see SwipeScreen inhale duration). */
const MATCH_DECK_FLUSH_DELAY_MS = 424;

const normalizeFilterText = (value?: string): string => value?.trim().toLowerCase() ?? '';

function setsEqualString(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function discoveryMatchText(name: BabyName): string {
  const nameText = normalizeFilterText(name.name);
  const origin = normalizeFilterText(name.origin);
  const country = normalizeFilterText(name.country);
  const region = normalizeFilterText(name.region);
  return `${nameText} ${origin} ${country} ${region}`;
}

export function matchesOriginTag(name: BabyName, tag: NameOriginTag): boolean {
  const combined = discoveryMatchText(name);
  switch (tag) {
    case 'spanish':
      return /\b(spanish|spain|hispanic|latin america|latam|mexico|argentina|chile|colombia)\b/.test(
        combined,
      );
    case 'dutch':
      return /\b(dutch|netherlands|nederland|flemish|belgium)\b/.test(combined);
    default:
      return false;
  }
}

export function matchesVibeTag(name: BabyName, tag: NameVibeTag): boolean {
  const nameText = normalizeFilterText(name.name);
  const country = normalizeFilterText(name.country);
  const region = normalizeFilterText(name.region);
  switch (tag) {
    case 'unique':
      return name.rarity?.tier === 'uncommon' ||
        name.rarity?.tier === 'rare' ||
        name.rarity?.tier === 'very_rare' ||
        (name.popularity_rank ?? 0) >= 30;
    case 'international':
      return name.is_worldwide || region === 'worldwide' || country === 'worldwide';
    case 'soft':
      return /[aeiy]$/.test(nameText) || /(ia|ella|elle|ina|ana|ora|lia|mila|luna)/.test(nameText);
    case 'strong':
      return /[bdgkrtxz]$/.test(nameText) || /(max|rex|leo|ax|kai|bram|thijs|mav|rock|wolf)/.test(nameText);
    default:
      return false;
  }
}

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
  pendingMatchAnticipation: BabyName | null;
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
  const [publicDeckHydrationKey, setPublicDeckHydrationKey] = useState<string | null>(null);
  const [premiumDeckHydrationKey, setPremiumDeckHydrationKey] = useState<string | null>(null);

  const deckNames = useMemo(
    () => mergeDeckSourcesByNameGender(baselineDeckNames, publicDeckSupplement, remotePremiumList),
    [baselineDeckNames, publicDeckSupplement, remotePremiumList],
  );

  const [namesToSwipe, setNamesToSwipe] = useState<BabyName[]>([]);
  const [pendingMatchAnticipation, setPendingMatchAnticipation] = useState<BabyName | null>(null);
  const [isLoadingNames, setIsLoadingNames] = useState(true);
  const [filters, setFiltersState] = useState<NameFilters>(DEFAULT_FILTERS);
  const [swipeStateHydrationKey, setSwipeStateHydrationKey] = useState<string | null>(null);

  const swipedIdsRef = useRef<Set<string>>(new Set());
  /** IDs of custom names the partner created that the current user hasn't swiped yet — front-loaded in deck. */
  const partnerCustomIdsRef = useRef<Set<string>>(new Set());
  const buildNameQueueRef = useRef<() => void>(() => {});
  const countryPreferenceRef = useRef<string | null>(null);
  const regionPreferenceRef = useRef<Region>('WORLDWIDE');
  const learningProfileRef = useRef<LearningProfile | null>(null);
  const recentLikedRef = useRef<BabyName[]>([]);
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
    countryPreferenceRef.current = countryPreference ?? null;
    regionPreferenceRef.current = (profile?.region_preference ?? 'WORLDWIDE') as Region;
    consumeFreeSwipeRef.current = consumeFreeSwipe;
    handleConfirmedMatchRef.current = handleConfirmedMatch;
  }, [
    consumeFreeSwipe,
    countryPreference,
    effectiveUnlockedPacks,
    handleConfirmedMatch,
    profile?.free_swipes_remaining,
    profile?.region_preference,
    profile?.room_id,
    profile?.id,
    room?.id,
    user?.id,
  ]);

  const activeFilterCount =
    (filters.lengths.length > 0 ? 1 : 0) +
    (filters.startingLetter ? 1 : 0) +
    (filters.trends.length > 0 ? 1 : 0) +
    (filters.origins.length > 0 ? 1 : 0) +
    (filters.vibes.length > 0 ? 1 : 0);

  useEffect(() => {
    if (effectiveUnlockedPacks.length > 0) return;
    const sanitized = sanitizeFreeFilters(filters);
    if (JSON.stringify(sanitized) !== JSON.stringify(filters)) {
      setFiltersState(sanitized);
    }
  }, [effectiveUnlockedPacks.length, filters]);

  const purchasedPacksKey = useMemo(
    () => effectiveUnlockedPacks.join(','),
    [effectiveUnlockedPacks],
  );

  const hasFreeSwipeEntitlement = (profile?.free_swipes_remaining ?? 0) > 0;
  const expectedSwipeStateHydrationKey = `${user?.id ?? 'no-user'}:${room?.id ?? profile?.room_id ?? 'no-room'}`;
  const expectedPublicDeckHydrationKey = [
    profile?.id ?? 'no-profile',
    isCountryPrefHydrated ? 'country-ready' : 'country-loading',
    hasFreeSwipeEntitlement ? 'free' : 'no-free',
    effectiveUnlockedPacks.length > 0 ? 'paid' : 'unpaid',
    profile?.region_preference ?? '',
    profile?.gender_preference ?? '',
    effectiveLanguage,
  ].join('|');
  const expectedPremiumDeckHydrationKey = [
    user?.id ?? 'no-user',
    purchasedPacksKey,
    effectiveLanguage,
  ].join('|');
  const isSwipeStateHydrated = swipeStateHydrationKey === expectedSwipeStateHydrationKey;
  const isPublicDeckHydrated = publicDeckHydrationKey === expectedPublicDeckHydrationKey;
  const isPremiumDeckHydrated = premiumDeckHydrationKey === expectedPremiumDeckHydrationKey;
  const isDeckReadyToBuild =
    !!profile &&
    isCountryPrefHydrated &&
    isSwipeStateHydrated &&
    isPublicDeckHydrated &&
    isPremiumDeckHydrated;

  useEffect(() => {
    if (!__DEV__ || !DEBUG_SWIPE_DECK || isDeckReadyToBuild) return;
    console.log('[SwipeDeck] initial render gated', {
      hasProfile: !!profile,
      isCountryPrefHydrated,
      isSwipeStateHydrated,
      isPublicDeckHydrated,
      isPremiumDeckHydrated,
      expectedSwipeStateHydrationKey,
      swipeStateHydrationKey,
    });
  }, [
    isDeckReadyToBuild,
    profile,
    isCountryPrefHydrated,
    isSwipeStateHydrated,
    isPublicDeckHydrated,
    isPremiumDeckHydrated,
    expectedSwipeStateHydrationKey,
    swipeStateHydrationKey,
  ]);

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
      setPublicDeckHydrationKey(expectedPublicDeckHydrationKey);
      return;
    }
    if (!hasFreeSwipeEntitlement && effectiveUnlockedPacks.length === 0) {
      setPublicDeckSupplement([]);
      setPublicDeckHydrationKey(expectedPublicDeckHydrationKey);
      return;
    }

    let cancelled = false;
    setPublicDeckHydrationKey(null);
    void (async () => {
      try {
        const rows = await Promise.race([
          PremiumContentService.fetchRemotePublicDeckSupplement({
            limit: 400,
            region: profile.region_preference ?? null,
            gender: profile.gender_preference ?? 'both',
            meaningLocale: effectiveLanguage,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('public deck timeout')), STARTUP_HYDRATION_TIMEOUT_MS),
          ),
        ]);
        if (!cancelled) setPublicDeckSupplement(rows);
      } catch {
        if (!cancelled) setPublicDeckSupplement([]);
      } finally {
        if (!cancelled) setPublicDeckHydrationKey(expectedPublicDeckHydrationKey);
      }
    })();

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
    effectiveLanguage,
    expectedPublicDeckHydrationKey,
  ]);

  useEffect(() => {
    const includePremium = effectiveUnlockedPacks.length > 0;
    if (!includePremium || !user?.id) {
      setRemotePremiumList(null);
      setPremiumDeckHydrationKey(expectedPremiumDeckHydrationKey);
      return;
    }

    let cancelled = false;
    setPremiumDeckHydrationKey(null);
    void (async () => {
      try {
        const remotePremium = await Promise.race([
          PremiumContentService.fetchRemotePremiumNames({
            includePremium: true,
            userId: user.id,
            meaningLocale: effectiveLanguage,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('premium deck timeout')), STARTUP_HYDRATION_TIMEOUT_MS),
          ),
        ]);
        if (cancelled) return;
        if (!remotePremium?.length) setRemotePremiumList(null);
        else setRemotePremiumList(remotePremium);
      } catch {
        if (!cancelled) setRemotePremiumList(null);
      } finally {
        if (!cancelled) setPremiumDeckHydrationKey(expectedPremiumDeckHydrationKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, effectiveUnlockedPacks.length, purchasedPacksKey, effectiveLanguage, expectedPremiumDeckHydrationKey]);

  useEffect(() => {
    if (!__DEV__ || !DEBUG_SWIPE_DECK) return;
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
    if (!__DEV__ || !DEBUG_SWIPE_DECK) return;
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

  useEffect(() => {
    if (!user?.id) {
      learningProfileRef.current = null;
      return;
    }
    void userPreferenceLearningService.loadProfile(user.id).then((p) => {
      learningProfileRef.current = p;
    });
  }, [user?.id]);

  useEffect(() => {
    recentLikedRef.current = [];
  }, [user?.id]);

  /**
   * Lightweight pacing after stableHash ordering: break streaky letters / locales / trends /
   * rarity bands while keeping partner-visible decks deterministic for identical pool + ctx.
   * Personal taste nudges read local refs only (recent likes + cached learning profile).
   */
  const refineDeckOrder = useCallback((deck: BabyName[]): BabyName[] => {
    if (deck.length <= 1) return deck;
    const rawRoom = roomIdRef.current ?? '';
    const ctx = {
      roomId: rawRoom || '__solo_deck__',
      countryPreference: countryPreferenceRef.current,
      region: regionPreferenceRef.current,
      sessionSwipeDepth: swipedIdsRef.current.size,
      learningProfile: learningProfileRef.current,
      recentLiked: recentLikedRef.current.slice(),
    };
    const custom = partnerCustomIdsRef.current;
    if (custom.size === 0) return sequenceSwipeDeck(deck, ctx);
    const prio = deck.filter((n) => custom.has(n.id));
    const rest = deck.filter((n) => !custom.has(n.id));
    return [...prio, ...sequenceSwipeDeck(rest, ctx)];
  }, []);

  // ── Core name queue builder (synchronous — guaranteed safe) ──
  const buildNameQueue = useCallback(() => {
    if (!profile || !isDeckReadyToBuild) {
      setIsLoadingNames(true);
      return;
    }
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
        sharedRoomId ?? '',
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
        sharedRoomId ?? '',
      );
    }

    // Apply active UI filters
    if (filters.lengths.length > 0) {
      pool = pool.filter((n) => filters.lengths.includes(getCachedNameLength(n)));
    }
    if (filters.startingLetter) {
      pool = pool.filter((n) => n.name[0]?.toUpperCase() === filters.startingLetter);
    }
    if (filters.origins.length > 0) {
      pool = pool.filter((n) => filters.origins.some((tag) => matchesOriginTag(n, tag)));
    }
    if (filters.vibes.length > 0) {
      pool = pool.filter((n) => filters.vibes.some((tag) => matchesVibeTag(n, tag)));
    }
    if (filters.trends.length > 0) {
      pool = pool.filter((n) => {
        const trend = getCachedTrend(n);
        return trend ? filters.trends.includes(trend) : false;
      });
    }

    pool = applySharedRoomOrderingWithinPriorityGroups(pool, sharedRoomId, countryPreference, region);
    if (__DEV__ && DEBUG_SWIPE_DECK && sharedRoomId) {
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
        if (__DEV__ && DEBUG_SWIPE_DECK) {
          console.log(`[SwipeDeck] boosted ${priority.length} partner custom name(s) to front`);
        }
      }
    }

    if (__DEV__ && DEBUG_SWIPE_DECK) {
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

    setNamesToSwipe(refineDeckOrder(pool));
    setIsLoadingNames(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closure reads profile/filters/packs; nameQueueRebuildKey gates when those inputs meaningfully change
  }, [isDeckReadyToBuild, nameQueueRebuildKey, deckNames, room?.id, profile?.room_id, refineDeckOrder]);

  useEffect(() => {
    buildNameQueueRef.current = buildNameQueue;
  }, [buildNameQueue]);

  // Rebuild when preferences, filters, packs, or swipe access *tier* change — not each free_swipes tick
  // profile?.id only (not whole profile) avoids rebuild on every free_swipes_remaining tick
  useEffect(() => {
    if (profile) buildNameQueue();
  }, [profile?.id, isDeckReadyToBuild, nameQueueRebuildKey, buildNameQueue]);

  // Explicitly react to country/region preference changes so deck composition updates without app refresh.
  useEffect(() => {
    if (!isDeckReadyToBuild) return;
    if (__DEV__ && DEBUG_SWIPE_DECK) {
      console.log('[SwipeDeck] preference-triggered rebuild', {
        regionPref: profile.region_preference ?? null,
        countryPref: countryPreference ?? null,
      });
    }
    buildNameQueue();
  }, [profile?.region_preference, countryPreference, isDeckReadyToBuild, profile?.id, buildNameQueue]);

  useEffect(() => {
    const roomId = room?.id ?? profile?.room_id ?? null;
    const hydrationKey = expectedSwipeStateHydrationKey;

    swipedIdsRef.current = new Set();
    partnerCustomIdsRef.current = new Set();
    setSwipeStateHydrationKey(null);

    if (!user || !roomId) {
      setSwipeStateHydrationKey(hydrationKey);
      return;
    }

    let cancelled = false;

    const loadSwipedIds = async () => {
      try {
        const [ids, partnerCustom] = await Promise.race([
          Promise.all([
            SwipeService.getSwipedNameIds(user.id, roomId),
            SwipeService.getPartnerCustomNameIds({ userId: user.id, roomId }),
          ]),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('swipe state timeout')), STARTUP_HYDRATION_TIMEOUT_MS),
          ),
        ]);
        if (cancelled) return;
        swipedIdsRef.current = ids;
        partnerCustomIdsRef.current = partnerCustom;
      } catch {
        if (!cancelled) {
          swipedIdsRef.current = new Set();
          partnerCustomIdsRef.current = new Set();
        }
      } finally {
        if (!cancelled) setSwipeStateHydrationKey(hydrationKey);
      }
    };

    void loadSwipedIds();

    return () => {
      cancelled = true;
    };
  }, [expectedSwipeStateHydrationKey, room?.id, profile?.room_id, user?.id]);

  // Partner right-swipes on custom names: postgres_changes when `swipes` is in the Realtime publication,
  // plus broadcast hint (see SwipeService.notifyPartnerCustomSurfaceHint) for environments without it.
  useEffect(() => {
    const roomId = room?.id ?? profile?.room_id ?? null;
    const uid = user?.id;
    if (!roomId || !uid || !isSwipeStateHydrated) return;

    const refetchPartnerCustom = async () => {
      try {
        const next = await SwipeService.getPartnerCustomNameIds({ userId: uid, roomId });
        if (setsEqualString(partnerCustomIdsRef.current, next)) return;
        partnerCustomIdsRef.current = next;
        buildNameQueueRef.current();
      } catch {
        // best-effort
      }
    };

    const partnerDeckChannel = supabase
      .channel(`partner-swipe-deck:${roomId}`, { config: { broadcast: { self: true } } })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swipes',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newRow = payload.new as { user_id?: string; direction?: string } | undefined;
          const oldRow = payload.old as { user_id?: string; direction?: string } | undefined;
          if (payload.eventType === 'INSERT') {
            if (!newRow?.user_id || newRow.user_id === uid) return;
            if (newRow.direction !== 'right') return;
            void refetchPartnerCustom();
            return;
          }
          if (payload.eventType === 'UPDATE') {
            if (!newRow?.user_id || newRow.user_id === uid) return;
            if (newRow.direction === 'right' || oldRow?.direction === 'right') {
              void refetchPartnerCustom();
            }
          }
        },
      )
      .on('broadcast', { event: 'refetch_partner_custom' }, () => {
        void refetchPartnerCustom();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(partnerDeckChannel);
    };
  }, [room?.id, profile?.room_id, user?.id, isSwipeStateHydrated]);

  // ── Swipe recording ─────────────────────────────────────────
  const loadMoreNames = useCallback(() => buildNameQueue(), [buildNameQueue]);

  const recordSwipe = useCallback(
    async (nameId: string, direction: SwipeDirection): Promise<boolean> => {
      const freeSwipesRemaining = freeSwipesRemainingRef.current;
      const hasPaidPack = hasPaidPackRef.current;
      if (freeSwipesRemaining <= 0 && !hasPaidPack) {
        return false;
      }

      const currentDeck = namesToSwipeRef.current;
      const originalIndex = currentDeck.findIndex((n) => n.id === nameId);
      const swipedName = originalIndex >= 0 ? currentDeck[originalIndex] : undefined;
      if (__DEV__ && DEBUG_SWIPE_DECK) {
        console.log('[SwipeDeck] recordSwipe', nameId);
      }

      const rollbackOptimisticSwipe = () => {
        swipedIdsRef.current.delete(nameId);
        if (!swipedName) return;
        setNamesToSwipe((prev) => {
          if (prev.some((n) => n.id === nameId)) return prev;
          const insertAt =
            originalIndex < 0 ? prev.length : Math.min(Math.max(0, originalIndex), prev.length);
          return [...prev.slice(0, insertAt), swipedName, ...prev.slice(insertAt)];
        });
      };

      swipedIdsRef.current.add(nameId);

      const flushDeckRemoval = () => {
        setNamesToSwipe((prev) => prev.filter((n) => n.id !== nameId));
      };

      flushDeckRemoval();

      if (!hasPaidPack && freeSwipesRemaining > 0) {
        const fn = consumeFreeSwipeRef.current;
        if (fn) await fn(1).catch(() => {});
      }

      const roomId = roomIdRef.current;
      const userId = userIdRef.current;
      if (!userId || !roomId) {
        rollbackOptimisticSwipe();
        return false;
      }

      try {
        await SwipeService.upsertSwipe({
          userId,
          roomId,
          nameId,
          direction,
        });
        if (direction === 'right' && swipedName) {
          recentLikedRef.current = [...recentLikedRef.current, swipedName].slice(-8);
        }
        if (direction === 'right' && swipedName?.source === 'custom') {
          SwipeService.notifyPartnerCustomSurfaceHint(roomId);
        }
      } catch (err: any) {
        console.error('[SwipeDeck] recordSwipe error:', err?.message ?? err);
        rollbackOptimisticSwipe();
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
          if (__DEV__ && DEBUG_SWIPE_DECK) {
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
            if (__DEV__ && DEBUG_SWIPE_DECK) {
              console.log('[SwipeDeck] match true received', {
                userId,
                roomId,
                nameId,
                name: swipedName.name,
              });
            }
            setPendingMatchAnticipation(swipedName);
            setTimeout(() => {
              setPendingMatchAnticipation((current) =>
                current?.id === nameId ? null : current,
              );
            }, MATCH_DECK_FLUSH_DELAY_MS);
            void Promise.resolve(handleConfirmedMatchRef.current?.(swipedName)).catch(() => {});
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
          void userPreferenceLearningService
            .recordSwipe(userId, swipedName, signal)
            .then(() => userPreferenceLearningService.loadProfile(userId))
            .then((p) => {
              learningProfileRef.current = p;
            })
            .catch(() => {});
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
    recentLikedRef.current = [];
    const nextFilters = {
      ...DEFAULT_FILTERS,
      ...f,
      origins: f.origins ?? [],
      vibes: f.vibes ?? [],
    };
    setFiltersState(effectiveUnlockedPacks.length > 0 ? nextFilters : sanitizeFreeFilters(nextFilters));
  }, [effectiveUnlockedPacks.length]);

  const stateValue = useMemo(
    () => ({
      namesToSwipe,
      isLoadingNames: isLoadingNames || !isDeckReadyToBuild,
      filters,
      activeFilterCount,
      pendingMatchAnticipation,
    }),
    [namesToSwipe, isLoadingNames, isDeckReadyToBuild, filters, activeFilterCount, pendingMatchAnticipation],
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

