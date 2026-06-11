import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useRoom } from './RoomContext';
import { SwipeService, normalizeBabyNameId } from '../services/SwipeService';
import {
  BabyName,
  NameFilters,
  NameVibeTag,
  OriginCountryChip,
  DEFAULT_FILTERS,
  Region,
  SwipeDirection,
  ORIGIN_FILTER_WORLDWIDE,
  isWorldwideOriginName,
  matchesOriginCountry,
} from '../types';
import { findCountry } from '../data/countries';
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
/** Dev-only: pipeline counts when country=Netherlands and origin filter includes Netherlands. */
const NL_DUTCH_PIPELINE_COUNTRY = 'Netherlands';

function isNlDutchPipelineDebug(
  countryPreference: string | null | undefined,
  origins: readonly string[],
): boolean {
  if (!__DEV__) return false;
  return (
    (countryPreference ?? '').trim() === NL_DUTCH_PIPELINE_COUNTRY &&
    origins.includes(NL_DUTCH_PIPELINE_COUNTRY)
  );
}

function countOwnCountry(names: readonly BabyName[], country: string): number {
  const c = country.trim();
  return names.filter((n) => (n.country ?? '').trim() === c).length;
}

function countOriginCountry(names: readonly BabyName[], country: string): number {
  return names.filter((n) => matchesOriginCountry(n, country)).length;
}

const LEGACY_ORIGIN_TAGS = new Set(['spanish', 'dutch']);

function sanitizeOriginCountries(origins: readonly string[] | undefined): string[] {
  return (origins ?? []).filter((c) => c.trim().length > 0 && !LEGACY_ORIGIN_TAGS.has(c));
}

function logNlDutchDeckPipeline(phase: string, counts: Record<string, number | string | null>): void {
  console.log(`[SwipeDeck][NL+dutch] ${phase}`, counts);
}

/** Max wait for remote deck / swipe restores so startup cannot hang indefinitely. */
const STARTUP_HYDRATION_TIMEOUT_MS = 12_000;
/** Debounce origin-chip toggles before re-fetching the public DB supplement. */
const ORIGIN_SUPPLEMENT_REFETCH_DEBOUNCE_MS = 225;

const normalizeFilterText = (value?: string): string => value?.trim().toLowerCase() ?? '';

function isSwipedId(nameId: string, swiped: ReadonlySet<string>): boolean {
  const key = normalizeBabyNameId(nameId);
  return swiped.has(key) || swiped.has(nameId);
}

function applyFiltersExceptOrigins(
  pool: BabyName[],
  filters: NameFilters,
  getNameLen: (name: BabyName) => ReturnType<typeof getNameLength>,
  getTrend: (name: BabyName) => BabyName['trend'] | undefined,
  swipedIds: ReadonlySet<string>,
): BabyName[] {
  let result = pool;
  if (filters.lengths.length > 0) {
    result = result.filter((n) => filters.lengths.includes(getNameLen(n)));
  }
  if (filters.startingLetter) {
    result = result.filter((n) => n.name[0]?.toUpperCase() === filters.startingLetter);
  }
  if (filters.vibes.length > 0) {
    result = result.filter((n) => filters.vibes.some((tag) => matchesVibeTag(n, tag)));
  }
  if (filters.trends.length > 0) {
    result = result.filter((n) => {
      const trend = getTrend(n);
      return trend ? filters.trends.includes(trend) : false;
    });
  }
  return result.filter((n) => !isSwipedId(n.id, swipedIds));
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

/** True when `curr` contains every id from `prev` and has strictly more ids (merged deck grew, none removed). */
function isMergedDeckIdSetStrictGrowth(prev: ReadonlySet<string>, curr: ReadonlySet<string>): boolean {
  if (prev.size === 0 || curr.size <= prev.size) return false;
  for (const id of prev) {
    if (!curr.has(id)) return false;
  }
  return true;
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
  /** Live country/culture chip counts for the filter sheet (excludes origin filter). */
  getOriginCountryChips: (filters: NameFilters) => OriginCountryChip[];
  /**
   * Register a user-authored custom name into the in-memory deck pool *immediately*
   * after `CustomNameService.addCustomName` succeeds, so derived state (chip counts,
   * filter sheet, country pickers, partner-side broadcast consumers) reflects it
   * without waiting for the next `publicDeckSupplement` refetch — which today only
   * fires on pref/filter changes or app restart. Idempotent; safe to call multiple
   * times with the same name. Also marks it swiped locally since the creator
   * auto-right-swipes the name as part of `addCustomName`.
   */
  registerOwnCustomName: (name: BabyName) => void;
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
  /**
   * Per-country DB-truth counts from `baby_names_country_counts` view.
   * `null` = not yet fetched (FilterSheet falls back to local pool counts);
   * a map = fetched. Reflects the rows the caller's RLS lets them read, so
   * a premium-pack purchaser sees premium-row contributions too. Refetched
   * when entitlement-affecting inputs change (user id, packs, language).
   */
  const [dbCountryCounts, setDbCountryCounts] = useState<Map<string, number> | null>(null);
  const [publicDeckHydrationKey, setPublicDeckHydrationKey] = useState<string | null>(null);
  const [premiumDeckHydrationKey, setPremiumDeckHydrationKey] = useState<string | null>(null);

  const deckNames = useMemo(
    () => mergeDeckSourcesByNameGender(baselineDeckNames, publicDeckSupplement, remotePremiumList),
    [baselineDeckNames, publicDeckSupplement, remotePremiumList],
  );

  const [namesToSwipe, setNamesToSwipe] = useState<BabyName[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(true);
  const [filters, setFiltersState] = useState<NameFilters>(DEFAULT_FILTERS);
  const originsSerializedForFetch = JSON.stringify(sanitizeOriginCountries(filters.origins ?? []));
  const [debouncedOriginsSerializedForFetch, setDebouncedOriginsSerializedForFetch] =
    useState(originsSerializedForFetch);
  const [swipeStateHydrationKey, setSwipeStateHydrationKey] = useState<string | null>(null);

  const swipedIdsRef = useRef<Set<string>>(new Set());
  /** IDs of custom names the partner created that the current user hasn't swiped yet — front-loaded in deck. */
  const partnerCustomIdsRef = useRef<Set<string>>(new Set());
  /** Bumps when `buildNameQueue` runs a new deck build; stale async meaning merges ignore it. */
  const meaningEnrichmentGenerationRef = useRef(0);
  /** Snapshot of merged `deckNames` ids after last build — used to detect supplement/premium-only growth. */
  const lastMergedDeckIdSetRef = useRef<Set<string>>(new Set());
  /** With `nameQueueRebuildKey` + swipe/room/language — must match for additive tail-append. */
  const lastDeckMergeContextKeyRef = useRef<string | null>(null);
  /** Guards swipe-state reset: stray effect re-entry with the same `${user}:${room}` must not wipe optimistic `swipedIdsRef`. */
  const lastSwipeStateHydrationIdentityRef = useRef<string | null>(null);
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
  /** First-card gate: do not wait for public DB supplement or remote premium fetches. */
  const isSwipeDeckInputReady =
    !!profile && isCountryPrefHydrated && isSwipeStateHydrated;

  useEffect(() => {
    if (!__DEV__ || !DEBUG_SWIPE_DECK || isSwipeDeckInputReady) return;
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
    isSwipeDeckInputReady,
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

  const deckRebuildContextKey = useMemo(
    () =>
      [
        nameQueueRebuildKey,
        expectedSwipeStateHydrationKey,
        String(room?.id ?? profile?.room_id ?? ''),
        effectiveLanguage,
      ].join('\u0001'),
    [
      nameQueueRebuildKey,
      expectedSwipeStateHydrationKey,
      room?.id,
      profile?.room_id,
      effectiveLanguage,
    ],
  );

  useEffect(() => {
    lastDeckMergeContextKeyRef.current = null;
    lastMergedDeckIdSetRef.current = new Set();
  }, [profile?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOriginsSerializedForFetch(originsSerializedForFetch);
    }, ORIGIN_SUPPLEMENT_REFETCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [originsSerializedForFetch]);

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
    const originsForFetch = sanitizeOriginCountries(
      JSON.parse(debouncedOriginsSerializedForFetch) as string[],
    );
    void (async () => {
      try {
        const rows = await Promise.race([
          PremiumContentService.fetchRemotePublicDeckSupplement({
            // Diversity-slice cap. The user's own country and any active origin
            // tags are pulled in addition to this via targeted .eq/.in fetches
            // inside fetchRemotePublicDeckSupplement, so this number governs the
            // breadth of cultures the user sees *outside* their own — it no
            // longer single-handedly bounds the country-specific tail.
            limit: 600,
            region: profile.region_preference ?? null,
            country: countryPreference ?? null,
            origins: originsForFetch,
            gender: profile.gender_preference ?? 'both',
            meaningLocale: effectiveLanguage,
            // Two-phase publish: surface the user's own-country slice as soon
            // as it returns (~300-800ms) instead of waiting on the slower
            // diversity slice (~2-4s). Critical for snappy country-change UX —
            // the deck and filter chip counts reflect the new country within a
            // round-trip, then deepen when diversity lands. We replace state
            // (not merge) because the targeted slice already prioritises the
            // user's own country first; the diversity tail is appended on the
            // final return below. Guarded by `cancelled` to avoid late writes
            // after the effect tears down (e.g. rapid country switches).
            onTargetedReady: (targetedRows) => {
              if (!cancelled && targetedRows.length > 0) {
                setPublicDeckSupplement(targetedRows);
              }
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('public deck timeout')), STARTUP_HYDRATION_TIMEOUT_MS),
          ),
        ]);
        if (!cancelled) {
          setPublicDeckSupplement(rows);
          if (isNlDutchPipelineDebug(countryPreference, filters.origins ?? [])) {
            const mergedPreview = mergeDeckSourcesByNameGender(
              baselineDeckNames,
              rows,
              remotePremiumList,
            );
            logNlDutchDeckPipeline('publicSupplementLoaded', {
              bundledCount: baselineDeckNames.length,
              publicSupplementCount: rows.length,
              ownCountryCount: countOwnCountry(mergedPreview, NL_DUTCH_PIPELINE_COUNTRY),
              originTagCount: countOriginCountry(mergedPreview, NL_DUTCH_PIPELINE_COUNTRY),
              premiumCount: remotePremiumList?.length ?? 0,
              mergedCount: mergedPreview.length,
              weightedPoolCount: -1,
              filteredCount: -1,
              namesToSwipeCount: namesToSwipeRef.current.length,
            });
          }
        }
      } catch {
        if (!cancelled) setPublicDeckSupplement([]);
      } finally {
        if (!cancelled) setPublicDeckHydrationKey(expectedPublicDeckHydrationKey);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `countryPreference` triggers immediately; origin chips use
    // `debouncedOriginsSerializedForFetch` so rapid toggles coalesce to one query.
  }, [
    profile?.id,
    profile?.region_preference,
    profile?.gender_preference,
    isCountryPrefHydrated,
    hasFreeSwipeEntitlement,
    effectiveUnlockedPacks.length,
    effectiveLanguage,
    expectedPublicDeckHydrationKey,
    countryPreference,
    debouncedOriginsSerializedForFetch,
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
  const buildWeightedPool = useCallback((): BabyName[] => {
    if (!profile) return [];
    const genderPref = profile.gender_preference ?? 'both';
    const region = (profile.region_preference ?? 'WORLDWIDE') as Region;
    const freeSwipesRemaining = profile.free_swipes_remaining ?? 0;
    const purchasedPacks = effectiveUnlockedPacks;
    const hasPaidPack = purchasedPacks.length > 0;
    const hasFreeEntitlement = freeSwipesRemaining > 0;
    const sharedRoomId = room?.id ?? profile.room_id ?? null;

    if (!hasFreeEntitlement && !hasPaidPack) return [];
    if (!hasPaidPack) {
      return countryWeightingService.getFreeTierCountryFirstPool(
        deckNames,
        region,
        countryPreference ?? undefined,
        genderPref,
        sharedRoomId ?? '',
      );
    }
    return countryWeightingService.getWeightedPool(
      deckNames,
      region,
      countryPreference ?? undefined,
      genderPref,
      swipedIdsRef.current.size,
      purchasedPacks,
      sharedRoomId ?? '',
    );
  }, [profile, deckNames, effectiveUnlockedPacks, countryPreference, room?.id]);

  /**
   * Hydrate per-country DB-truth counts from `baby_names_country_counts`
   * view. The view's `security_invoker = true` clause means RLS applies as
   * the caller's role — counts reflect the user's accessible slice
   * (non-premium for free, plus premium when they own a pack). Fetched
   * once per (user_id, packs, language) tuple; refetched when any of those
   * changes so a fresh pack purchase shows up immediately.
   *
   * On failure or empty: leave `dbCountryCounts = null`. `getOriginCountryChips`
   * falls back to its old in-memory-pool count path until the next refetch
   * succeeds — so a transient network blip never produces a chipless picker.
   */
  useEffect(() => {
    if (!profile?.id) {
      setDbCountryCounts(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('baby_names_country_counts')
          .select('country, count');
        if (cancelled) return;
        if (error || !Array.isArray(data) || data.length === 0) {
          setDbCountryCounts(null);
          return;
        }
        const next = new Map<string, number>();
        for (const row of data as Array<{ country: string | null; count: number | null }>) {
          const c = (row.country ?? '').trim();
          const n = typeof row.count === 'number' ? row.count : Number(row.count ?? 0);
          if (!c || !Number.isFinite(n) || n <= 0) continue;
          next.set(c, n);
        }
        setDbCountryCounts(next);
      } catch {
        if (!cancelled) setDbCountryCounts(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, purchasedPacksKey, effectiveLanguage]);

  const getOriginCountryChips = useCallback(
    (draft: NameFilters): OriginCountryChip[] => {
      const pref = (countryPreference ?? '').trim();

      // Preferred path: cross-region DB-truth counts. These reflect what's
      // actually in the catalog rather than what survived the 250-row
      // weighted-pool sample. Counts don't intersect with the user's other
      // filters — that's deliberate; users want to see "how many Belgian
      // names exist in the catalog", not "how many Belgian names remain
      // after I also filter to short + classic".
      if (dbCountryCounts && dbCountryCounts.size > 0) {
        const chips: OriginCountryChip[] = [];
        for (const [country, count] of dbCountryCounts.entries()) {
          if (country === ORIGIN_FILTER_WORLDWIDE) {
            chips.push({ country, count, flag: '🌍' });
            continue;
          }
          chips.push({
            country,
            count,
            flag: findCountry(country)?.flag,
          });
        }
        return chips.sort((a, b) => {
          if (pref) {
            if (a.country === pref && b.country !== pref) return -1;
            if (b.country === pref && a.country !== pref) return 1;
          }
          return b.count - a.count || a.country.localeCompare(b.country);
        });
      }

      // Fallback while DB counts haven't hydrated (initial mount, transient
      // network failure): preserve the previous in-memory-pool behaviour so
      // the picker is never empty. Numbers will look small here but it's
      // strictly a degraded mode, not the steady state.
      const normalized: NameFilters = {
        ...DEFAULT_FILTERS,
        ...draft,
        origins: sanitizeOriginCountries(draft.origins),
        vibes: draft.vibes ?? [],
      };
      const base = applyFiltersExceptOrigins(
        buildWeightedPool(),
        normalized,
        getCachedNameLength,
        getCachedTrend,
        swipedIdsRef.current,
      );
      const counts = new Map<string, number>();
      let worldwideCount = 0;
      for (const n of base) {
        if (isWorldwideOriginName(n)) {
          worldwideCount += 1;
          continue;
        }
        const c = (n.country ?? '').trim();
        if (!c) continue;
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
      const chips = [...counts.entries()].map(([country, count]) => ({
        country,
        count,
        flag: findCountry(country)?.flag,
      }));
      if (worldwideCount > 0) {
        chips.push({
          country: ORIGIN_FILTER_WORLDWIDE,
          count: worldwideCount,
          flag: '🌍',
        });
      }
      return chips.sort((a, b) => {
        if (pref) {
          if (a.country === pref && b.country !== pref) return -1;
          if (b.country === pref && a.country !== pref) return 1;
        }
        return b.count - a.count || a.country.localeCompare(b.country);
      });
    },
    [
      buildWeightedPool,
      countryPreference,
      dbCountryCounts,
      getCachedNameLength,
      getCachedTrend,
    ],
  );

  const refineDeckOrder = useCallback((deck: BabyName[]): BabyName[] => {
    if (deck.length <= 1) return deck;
    const rawRoom = roomIdRef.current ?? '';
    const ctx = {
      roomId: rawRoom || '__solo_deck__',
      countryPreference: countryPreference ?? null,
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
  }, [countryPreference]);

  /** Inject partner suggested rows immediately; does not rebuild from pool (those rows may lack deckNames ids). */
  const mergePartnerSuggestedRowsIntoDeck = (rows: BabyName[]) => {
    if (!rows.length) return;
    partnerCustomIdsRef.current = new Set(rows.map((r) => r.id));
    setNamesToSwipe((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const toAdd = rows.filter(
        (r) => !isSwipedId(r.id, swipedIdsRef.current) && !existingIds.has(r.id),
      );
      if (!toAdd.length) return prev;
      const insertAt = Math.min(3, prev.length);
      const next = [...prev.slice(0, insertAt), ...toAdd, ...prev.slice(insertAt)];
      namesToSwipeRef.current = next;
      return next;
    });
  };

  // ── Core name queue builder: first paint uses bundled/local meanings; optional async meaning patch for non-EN. ──
  const buildNameQueue = useCallback(() => {
    if (!profile || !isSwipeDeckInputReady) {
      setIsLoadingNames(true);
      return;
    }
    setIsLoadingNames(true);

    try {
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
      const weightedPoolCount = pool.length;

      // Apply active UI filters
      if (filters.lengths.length > 0) {
        pool = pool.filter((n) => filters.lengths.includes(getCachedNameLength(n)));
      }
      if (filters.startingLetter) {
        pool = pool.filter((n) => n.name[0]?.toUpperCase() === filters.startingLetter);
      }
      const originCountries = sanitizeOriginCountries(filters.origins);
      if (originCountries.length > 0) {
        pool = pool.filter((n) => originCountries.some((c) => matchesOriginCountry(n, c)));
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
      const filteredPoolCount = pool.length;

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
      pool = pool.filter((n) => !isSwipedId(n.id, swipedIdsRef.current));

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

      const currDeckIds = new Set(deckNames.map((n) => n.id));
      const prevMergedIds = lastMergedDeckIdSetRef.current;
      const prevContext = lastDeckMergeContextKeyRef.current;

      const contextUnchanged = prevContext !== null && prevContext === deckRebuildContextKey;
      const deckGrewWithoutRemoval = isMergedDeckIdSetStrictGrowth(prevMergedIds, currDeckIds);
      // Same id-set with same context (e.g. a partner-custom-only rebuild, where deckNames
      // is unchanged): also treat as additive so the visible head is preserved and cards
      // are not reordered (the full-resequence else-branch can shift order via session ctx).
      const deckUnchanged =
        prevMergedIds.size === currDeckIds.size &&
        Array.from(currDeckIds).every((id) => prevMergedIds.has(id));
      const prevVisible = namesToSwipeRef.current;

      const useAdditiveAppend =
        contextUnchanged && (deckGrewWithoutRemoval || deckUnchanged) && prevVisible.length > 0;

      const poolById = new Map(pool.map((n) => [n.id, n]));
      const gen = ++meaningEnrichmentGenerationRef.current;

      let namesToSwipeCount = 0;
      if (useAdditiveAppend) {
        const headIds = new Set(prevVisible.map((n) => n.id));
        const stableHead = prevVisible
          .filter((n) => !isSwipedId(n.id, swipedIdsRef.current))
          .map((n) => poolById.get(n.id) ?? n);
        const fullRefined = refineDeckOrder(pool);
        const tail = fullRefined.filter(
          (n) => !headIds.has(n.id) && !isSwipedId(n.id, swipedIdsRef.current),
        );
        const nextQueue = [...stableHead, ...tail];
        namesToSwipeCount = nextQueue.length;
        setNamesToSwipe(nextQueue);
      } else {
        const nextQueue = refineDeckOrder(pool);
        namesToSwipeCount = nextQueue.length;
        setNamesToSwipe(nextQueue);
      }

      if (isNlDutchPipelineDebug(countryPreference, filters.origins)) {
        logNlDutchDeckPipeline('buildNameQueue', {
          bundledCount: baselineDeckNames.length,
          publicSupplementCount: publicDeckSupplement.length,
          ownCountryCount: countOwnCountry(deckNames, NL_DUTCH_PIPELINE_COUNTRY),
          originTagCount: countOriginCountry(deckNames, NL_DUTCH_PIPELINE_COUNTRY),
          premiumCount: remotePremiumList?.length ?? 0,
          mergedCount: deckNames.length,
          weightedPoolCount,
          filteredCount: filteredPoolCount,
          namesToSwipeCount,
        });
      }

      lastDeckMergeContextKeyRef.current = deckRebuildContextKey;
      lastMergedDeckIdSetRef.current = currDeckIds;

      if (effectiveLanguage !== 'en' && pool.length > 0) {
        void (async () => {
          try {
            const { names: enriched } =
              await PremiumContentService.attachPublicMeaningTranslationsForNames(pool, effectiveLanguage);
            if (meaningEnrichmentGenerationRef.current !== gen) return;
            const byId = new Map(enriched.map((n) => [n.id, n] as const));
            setNamesToSwipe((prev) =>
              prev
                .filter((n) => !isSwipedId(n.id, swipedIdsRef.current))
                .map((n) => byId.get(n.id) ?? n),
            );
          } catch {
            // non-fatal — bundled/local meanings remain
          }
        })();
      }
    } finally {
      setIsLoadingNames(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closure reads profile/filters/packs; nameQueueRebuildKey gates when those inputs meaningfully change
  }, [
    isSwipeDeckInputReady,
    nameQueueRebuildKey,
    deckNames,
    deckRebuildContextKey,
    room?.id,
    profile?.room_id,
    countryPreference,
    refineDeckOrder,
    effectiveLanguage,
  ]);

  useEffect(() => {
    buildNameQueueRef.current = buildNameQueue;
  }, [buildNameQueue]);

  // Rebuild when preferences, filters, packs, or swipe access *tier* change — not each free_swipes tick
  // profile?.id only (not whole profile) avoids rebuild on every free_swipes_remaining tick
  useEffect(() => {
    if (profile) buildNameQueue();
  }, [profile?.id, isSwipeDeckInputReady, nameQueueRebuildKey, buildNameQueue]);

  // Explicitly react to country/region preference changes so deck composition updates without app refresh.
  useEffect(() => {
    if (!isSwipeDeckInputReady) return;
    if (__DEV__ && DEBUG_SWIPE_DECK) {
      console.log('[SwipeDeck] preference-triggered rebuild', {
        regionPref: profile.region_preference ?? null,
        countryPref: countryPreference ?? null,
      });
    }
    // Country/region reshuffle must not reuse the additive "stable head" path with the prior pool —
    // that path preserves visible order and defeats country-first reprioritisation.
    lastDeckMergeContextKeyRef.current = null;
    lastMergedDeckIdSetRef.current = new Set();
    buildNameQueue();
  }, [profile?.region_preference, countryPreference, isSwipeDeckInputReady, profile?.id, buildNameQueue]);

  useEffect(() => {
    const roomId = room?.id ?? profile?.room_id ?? null;
    const hydrationKey = expectedSwipeStateHydrationKey;
    const swipeScopeChanged =
      lastSwipeStateHydrationIdentityRef.current !== hydrationKey;

    if (swipeScopeChanged) {
      lastSwipeStateHydrationIdentityRef.current = hydrationKey;
      swipedIdsRef.current = new Set();
      partnerCustomIdsRef.current = new Set();
      setSwipeStateHydrationKey(null);

      if (!user || !roomId) {
        setSwipeStateHydrationKey(hydrationKey);
        return;
      }
    } else {
      // Same user+room scope; effect can re-fire from unrelated parent renders. Never clear
      // `swipedIdsRef` here — a brief empty set lets the next `buildNameQueue` resurrect the
      // country-weighted head before `getSwipedNameIds` unions.
      if (!user || !roomId) return;
    }

    let cancelled = false;
    const authUserId = user.id;

    // Critical path: ONLY the swiped-id set gates first paint. It is light
    // (single indexed query on swipes(user_id, room_id)) and is required so the
    // deck can exclude already-swiped names on the first build.
    const loadSwipedIds = async () => {
      try {
        const ids = await Promise.race([
          SwipeService.getSwipedNameIds(authUserId, roomId),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('swipe state timeout')), STARTUP_HYDRATION_TIMEOUT_MS),
          ),
        ]);
        if (cancelled) return;
        // Union with in-flight optimistic swipes — a stale snapshot must not resurrect cards
        // the user swiped during this fetch / during supplement hydration-driven rebuilds.
        const fetched = [...ids];
        const union = new Set(swipedIdsRef.current);
        for (const id of fetched) {
          union.add(normalizeBabyNameId(id));
          union.add(id);
        }
        swipedIdsRef.current = union;
      } catch {
        // Best-effort: keep optimistic swipedIdsRef on fetch failure so queued rebuilds can't resurrect cards swiped mid-flight.
      } finally {
        if (!cancelled) setSwipeStateHydrationKey(hydrationKey);
      }
    };

    // Background: partner-custom ids only feed the front-boost. This lookup is
    // heavier (partner resolve + RLS-joined query), so it must NEVER gate first paint.
    const loadPartnerCustomIds = async () => {
      try {
        const rows = await Promise.race([
          SwipeService.getPartnerCustomNames({ userId: authUserId, roomId }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('partner custom timeout')), STARTUP_HYDRATION_TIMEOUT_MS),
          ),
        ]);
        if (cancelled) return;
        mergePartnerSuggestedRowsIntoDeck(rows);
      } catch {
        // best-effort — realtime broadcast still refreshes partner suggestions.
      }
    };

    void (async () => {
      await loadSwipedIds();
      if (cancelled) return;
      void loadPartnerCustomIds();
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally only `expectedSwipeStateHydrationKey`: it already encodes user + room.
    // Extra deps on `room?.id` / `profile?.room_id` caused duplicate runs with the same key and
    // wiped optimistic swipes mid-session.
  }, [expectedSwipeStateHydrationKey]);

  // Partner right-swipes on custom names: postgres_changes when `swipes` is in the Realtime publication,
  // plus broadcast hint (see SwipeService.notifyPartnerCustomSurfaceHint) for environments without it.
  useEffect(() => {
    const roomId = room?.id ?? profile?.room_id ?? null;
    const uid = user?.id;
    if (!roomId || !uid) return;

    const refetchPartnerCustom = async () => {
      try {
        const rows = await SwipeService.getPartnerCustomNames({ userId: uid, roomId });
        mergePartnerSuggestedRowsIntoDeck(rows);
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

      const nid = normalizeBabyNameId(nameId);
      const currentDeck = namesToSwipeRef.current;
      const originalIndex = currentDeck.findIndex((n) => normalizeBabyNameId(n.id) === nid);
      const swipedName = originalIndex >= 0 ? currentDeck[originalIndex] : undefined;
      if (__DEV__ && DEBUG_SWIPE_DECK) {
        console.log('[SwipeDeck] recordSwipe', nid);
      }

      const rollbackOptimisticSwipe = () => {
        swipedIdsRef.current.delete(nameId);
        swipedIdsRef.current.delete(nid);
        if (!swipedName) return;
        setNamesToSwipe((prev) => {
          if (prev.some((n) => normalizeBabyNameId(n.id) === nid)) return prev;
          const insertAt =
            originalIndex < 0 ? prev.length : Math.min(Math.max(0, originalIndex), prev.length);
          return [...prev.slice(0, insertAt), swipedName, ...prev.slice(insertAt)];
        });
      };

      swipedIdsRef.current.add(nid);
      if (nameId !== nid) swipedIdsRef.current.add(nameId);

      const flushDeckRemoval = () => {
        const next = namesToSwipeRef.current.filter((n) => normalizeBabyNameId(n.id) !== nid);
        namesToSwipeRef.current = next;
        setNamesToSwipe((prev) => prev.filter((n) => normalizeBabyNameId(n.id) !== nid));
      };

      flushDeckRemoval();

      if (!hasPaidPack && freeSwipesRemaining > 0) {
        const fn = consumeFreeSwipeRef.current;
        if (fn) await fn(1).catch(() => {});
      }

      const roomId = roomIdRef.current;
      const userId = userIdRef.current;
      if (!userId) {
        rollbackOptimisticSwipe();
        return false;
      }

      // Solo mode (no partner room yet): keep the optimistic deck advancement —
      // skip Supabase persistence (upsertSwipe requires a roomId) and the match
      // RPC (no partner = no possible match). Rolling back here was the cause of
      // the "top card snaps back to front of deck on every swipe" bug on fresh
      // installs in free mode: `rollbackOptimisticSwipe` re-inserted the swiped
      // card at originalIndex=0, React re-mounted a fresh SwipeCard with
      // position back at {0, 0}, and the user couldn't progress. Local
      // `swipedIdsRef` keeps the card out of subsequent rebuilds; once the user
      // joins/creates a room, future swipes will start persisting normally.
      if (!roomId) {
        if (direction === 'right' && swipedName) {
          recentLikedRef.current = [...recentLikedRef.current, swipedName].slice(-8);
        }
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
    /**
     * IMPORTANT: do NOT clear `swipedIdsRef` here. Earlier versions reset it
     * on every filter change, which broke the already-swiped exclusion: the
     * next `buildNameQueue` then saw an empty set and resurrected names the
     * user had already swiped (including matched ones, since matches enter
     * the swipe table). The DB hydration effect is keyed on user+room and
     * does not re-fire on a filter change, so the set never refilled until
     * the user's next swipe — leaving a stale window where the displayed
     * "names left" count included un-swipeable resurrected entries.
     *
     * `recentLikedRef` is a *recency-ordering* hint, not an exclusion list,
     * so it's still safe to drop on a filter change (deck order is allowed
     * to re-sequence with new filters).
     */
    recentLikedRef.current = [];
    const nextFilters = {
      ...DEFAULT_FILTERS,
      ...f,
      origins: sanitizeOriginCountries(f.origins),
      vibes: f.vibes ?? [],
    };
    setFiltersState(effectiveUnlockedPacks.length > 0 ? nextFilters : sanitizeFreeFilters(nextFilters));
  }, [effectiveUnlockedPacks.length]);

  const stateValue = useMemo(
    () => ({
      namesToSwipe,
      isLoadingNames: isLoadingNames || !isSwipeDeckInputReady,
      filters,
      activeFilterCount,
    }),
    [namesToSwipe, isLoadingNames, isSwipeDeckInputReady, filters, activeFilterCount],
  );

  /**
   * Fold a just-created custom name into the in-memory deck pool right after
   * `CustomNameService.addCustomName` resolves, instead of waiting for the next
   * remote `publicDeckSupplement` refetch (which only fires on pref/filter change
   * or full app restart — that is the "only appears after restart" bug).
   *
   * We append to `publicDeckSupplement` (not to a separate state) so the existing
   * `deckNames` memo picks it up via its existing dependency and downstream consumers
   * (filter chip counts via `buildWeightedPool`, partner-side fold-in, country pickers,
   * `namesToSwipe` rebuilds) see it on the next render. Dedup is by id.
   *
   * The creator already auto-right-swiped this name inside `addCustomName`; we mark it
   * in `swipedIdsRef` immediately so the next `buildNameQueue` doesn't put the user's
   * own custom back into their visible deck during the window between this call and
   * the next swipe-state hydration cycle.
   */
  const registerOwnCustomName = useCallback((name: BabyName) => {
    if (!name?.id) return;
    const id = name.id;
    swipedIdsRef.current.add(id);
    setPublicDeckSupplement((prev) => (prev.some((n) => n.id === id) ? prev : [...prev, name]));
  }, []);

  const actionsValue = useMemo(
    () => ({
      recordSwipe,
      loadMoreNames,
      setFilters,
      getOriginCountryChips,
      registerOwnCustomName,
    }),
    [recordSwipe, loadMoreNames, setFilters, getOriginCountryChips, registerOwnCustomName],
  );

  return (
    <SwipeDeckStateContext.Provider value={stateValue}>
      <SwipeDeckActionsContext.Provider value={actionsValue}>
        {children}
      </SwipeDeckActionsContext.Provider>
    </SwipeDeckStateContext.Provider>
  );
}

export { matchesOriginCountry } from '../types';
