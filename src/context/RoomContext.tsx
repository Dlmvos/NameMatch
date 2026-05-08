import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { hydrateMatchesWithCatalogMeanings } from '../services/catalogMeaningTranslations';
import { getEffectiveLanguage } from '../services/languageService';
import { RoomService } from '../services/RoomService';
import { BabyName, Match, Room } from '../types';
import { useAuth } from './AuthContext';
import { AnalyticsService } from '../services/AnalyticsService';
import { checkMilestone, type Milestone } from '../lib/milestoneTracker';

interface RoomStateContextValue {
  room: Room | null;
  isLoadingRoom: boolean;
  isRoomHydrated: boolean;
}

interface RoomActionsContextValue {
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  handleConfirmedMatch: (name: BabyName) => Promise<void>;
}

interface MatchStateContextValue {
  matches: Match[];
  latestMatch: BabyName | null;
  dismissLatestMatch: () => void;
  /** Non-null when a milestone was just reached and hasn't been dismissed. */
  pendingMilestone: Milestone | null;
  dismissMilestone: () => void;
}

const RoomStateContext = createContext<RoomStateContextValue | null>(null);
const RoomActionsContext = createContext<RoomActionsContextValue | null>(null);
const MatchStateContext = createContext<MatchStateContextValue | null>(null);

export function useRoomState(): RoomStateContextValue {
  const ctx = useContext(RoomStateContext);
  if (!ctx) throw new Error('useRoomState must be used within <RoomProvider>');
  return ctx;
}

export function useRoomActions(): RoomActionsContextValue {
  const ctx = useContext(RoomActionsContext);
  if (!ctx) throw new Error('useRoomActions must be used within <RoomProvider>');
  return ctx;
}

export function useMatchState(): MatchStateContextValue {
  const ctx = useContext(MatchStateContext);
  if (!ctx) throw new Error('useMatchState must be used within <RoomProvider>');
  return ctx;
}

// Back-compat combined hook. Prefer useRoomState/useRoomActions/useMatchState.
export function useRoom(): RoomStateContextValue & RoomActionsContextValue & MatchStateContextValue {
  const roomState = useRoomState();
  const roomActions = useRoomActions();
  const matchState = useMatchState();
  return { ...roomState, ...roomActions, ...matchState };
}

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();

  const deviceLanguage =
    Intl.DateTimeFormat().resolvedOptions().locale?.split(/[-_]/)[0] ?? 'en';
  const effectiveLanguage = useMemo(
    () => getEffectiveLanguage(profile?.language_preference ?? null, deviceLanguage),
    [profile?.language_preference, deviceLanguage],
  );
  const effectiveLanguageRef = useRef(effectiveLanguage);
  effectiveLanguageRef.current = effectiveLanguage;

  const [room, setRoom] = useState<Room | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [latestMatch, setLatestMatch] = useState<BabyName | null>(null);
  const [pendingMilestone, setPendingMilestone] = useState<Milestone | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [isRoomHydrated, setIsRoomHydrated] = useState(false);

  const matchSubscriptionRef = useRef<ReturnType<typeof RoomService.subscribeToMatches> | null>(null);
  const roomSubscriptionRef = useRef<ReturnType<typeof RoomService.subscribeToRoom> | null>(null);
  const clearMatchSubscription = () => {
    matchSubscriptionRef.current?.unsubscribe();
    matchSubscriptionRef.current = null;
  };
  const clearRoomSubscription = () => {
    roomSubscriptionRef.current?.unsubscribe();
    roomSubscriptionRef.current = null;
  };

  // Bootstrap + subscribe when room_id becomes available.
  useEffect(() => {
    let cancelled = false;

    const roomId = profile?.room_id;
    if (!roomId) {
      clearMatchSubscription();
      clearRoomSubscription();
      setRoom(null);
      setMatches([]);
      setLatestMatch(null);
      setIsLoadingRoom(false);
      setIsRoomHydrated(true);
      return;
    }

    const load = async () => {
      try {
        setIsLoadingRoom(true);
        setIsRoomHydrated(false);
        const [loadedRoom, loadedMatches] = await Promise.all([
          RoomService.getRoom(roomId),
          RoomService.getMatches(roomId),
        ]);
        if (cancelled) return;

        setRoom(loadedRoom);
        const hydratedMatches = await hydrateMatchesWithCatalogMeanings(
          loadedMatches,
          effectiveLanguageRef.current,
        );
        setMatches(hydratedMatches);
        setLatestMatch(null);

        clearMatchSubscription();
        clearRoomSubscription();
        if (__DEV__) {
          console.log('[RoomContext] room subscription create', {
            roomId,
            user1Id: loadedRoom?.user1_id ?? null,
            user2Id: loadedRoom?.user2_id ?? null,
          });
        }
        matchSubscriptionRef.current = RoomService.subscribeToMatches(roomId, async (m) => {
          if (__DEV__) {
            console.log('[RoomContext] match realtime payload received', {
              roomId: m.room_id,
              nameId: m.name_id,
              name: m.baby_names?.name ?? null,
            });
          }
          const [hm] = await hydrateMatchesWithCatalogMeanings([m], effectiveLanguageRef.current);
          setMatches((prev) => [hm, ...prev.filter((existing) => existing.id !== hm.id)]);
          setLatestMatch(hm.baby_names ?? null);
        });
        roomSubscriptionRef.current = RoomService.subscribeToRoom(roomId, (nextRoom) => {
          if (__DEV__) {
            console.log('[RoomContext] setRoom from realtime', {
              roomId: nextRoom.id,
              user1Id: nextRoom.user1_id,
              user2Id: nextRoom.user2_id,
            });
          }
          setRoom(nextRoom);
        });
        setTimeout(async () => {
          if (cancelled) return;
          try {
            const refreshedRoom = await RoomService.getRoom(roomId);
            if (!cancelled && refreshedRoom) {
              setRoom(refreshedRoom);
            }
          } catch (err: any) {
            if (__DEV__) {
              console.error('[RoomContext] delayed room refresh failed:', err?.message ?? err);
            }
          }
        }, 2000);
      } catch (err: any) {
        if (cancelled) return;
        console.error('[RoomContext] startup room hydration failed:', err?.message ?? err);
        clearMatchSubscription();
        clearRoomSubscription();
        setRoom(null);
        setMatches([]);
        setLatestMatch(null);
      } finally {
        if (!cancelled) {
          setIsLoadingRoom(false);
          setIsRoomHydrated(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      clearMatchSubscription();
      clearRoomSubscription();
    };
  }, [profile?.room_id]);

  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  useEffect(() => {
    if (matchesRef.current.length === 0) return;
    let cancelled = false;
    void hydrateMatchesWithCatalogMeanings(matchesRef.current, effectiveLanguage).then((h) => {
      if (!cancelled) setMatches(h);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveLanguage]);

  const createRoom = async () => {
    if (!user?.id) throw new Error('Not authenticated');
    // Guard: if a room already exists, return its code instead of creating a duplicate.
    if (room) return room.code;
    setIsLoadingRoom(true);
    try {
      const { room: newRoom, code } = await RoomService.createRoom(user.id);
      // Set room state immediately so the screen can display the code
      // before refreshProfile triggers a navigator key change.
      setRoom(newRoom);
      await refreshProfile();
      return code;
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const joinRoom = async (code: string) => {
    if (!user?.id) throw new Error('Not authenticated');
    setIsLoadingRoom(true);
    try {
      await RoomService.joinRoom(user.id, code);
      await refreshProfile();
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const leaveRoom = async () => {
    if (!user?.id) throw new Error('Not authenticated');
    setIsLoadingRoom(true);
    try {
      await RoomService.leaveRoom(user.id);
      await refreshProfile();

      // Immediate UI responsiveness; subscription effect will also clear on profile change.
      clearMatchSubscription();
      clearRoomSubscription();
      setRoom(null);
      setMatches([]);
      setLatestMatch(null);
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const handleConfirmedMatch = async (name: BabyName) => {
    const roomId = room?.id ?? profile?.room_id ?? null;
    AnalyticsService.track('match_created', {
      roomId,
      nameId: name.id,
      name: name.name,
    });
    if (__DEV__) {
      console.log('[RoomContext] confirmed match received from swipe RPC', {
        roomId,
        nameId: name.id,
        name: name.name,
      });
    }
    setLatestMatch(name);
    if (__DEV__) {
      console.log('[RoomContext] celebration state set', {
        nameId: name.id,
        name: name.name,
      });
    }
    if (!roomId) return;

    const loadedMatches = await RoomService.getMatches(roomId);
    const hydratedMatches = await hydrateMatchesWithCatalogMeanings(
      loadedMatches,
      effectiveLanguage,
    );
    setMatches(hydratedMatches);
    if (__DEV__) {
      console.log('[RoomContext] matches refreshed after confirmed match', {
        roomId,
        count: hydratedMatches.length,
      });
    }

    // Check milestone thresholds (fire-and-forget; never blocks swipe flow).
    try {
      const milestone = await checkMilestone(roomId, hydratedMatches.length);
      if (milestone) {
        setPendingMilestone(milestone);
        AnalyticsService.track('milestone_reached', { roomId, milestone, matchCount: hydratedMatches.length });
      }
    } catch {
      // Non-critical — swallowed silently.
    }
  };

  const dismissLatestMatch = () => setLatestMatch(null);
  const dismissMilestone = () => setPendingMilestone(null);

  const roomStateValue: RoomStateContextValue = {
    room,
    isLoadingRoom,
    isRoomHydrated,
  };

  const roomActionsValue: RoomActionsContextValue = {
    createRoom,
    joinRoom,
    leaveRoom,
    handleConfirmedMatch,
  };

  const matchStateValue: MatchStateContextValue = {
    matches,
    latestMatch,
    dismissLatestMatch,
    pendingMilestone,
    dismissMilestone,
  };

  return (
    <RoomStateContext.Provider value={roomStateValue}>
      <RoomActionsContext.Provider value={roomActionsValue}>
        <MatchStateContext.Provider value={matchStateValue}>
          {children}
        </MatchStateContext.Provider>
      </RoomActionsContext.Provider>
    </RoomStateContext.Provider>
  );
}

