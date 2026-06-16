import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { RoomService } from '../services/RoomService';
import { BabyName, Match, Room } from '../types';
import { useAuth } from './AuthContext';
import { AnalyticsService } from '../services/AnalyticsService';
import { checkMilestone, type Milestone } from '../lib/milestoneTracker';
import { peekPendingJoinCode } from '../lib/pendingJoin';

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
  /**
   * Re-pulls matches from Supabase without resubscribing the realtime channel.
   * Used by MatchesScreen.useFocusEffect to recover from dropped realtime
   * payloads (background, brief socket disconnect) without forcing the user
   * to reload the app. Idempotent: re-applies seenMatchIdsRef so duplicates
   * are filtered cleanly when realtime payloads arrive after the refetch.
   */
  refreshMatches: () => Promise<void>;
  /**
   * Dismiss the post-pair carry-forward celebration modal. Calls a
   * SECURITY DEFINER RPC that nulls profile.pending_carry_forward_count
   * for the caller, then refreshes the local profile snapshot.
   */
  dismissCarryForward: () => Promise<void>;
}

interface CarryForwardContextValue {
  /**
   * Non-null when the user should see the post-pair carry-forward modal.
   * Mirrors profiles.pending_carry_forward_count. Cleared by
   * dismissCarryForward action. 0 is a valid display value ("no matches
   * yet from your past likes").
   */
  pendingCarryForwardCount: number | null;
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
const CarryForwardContext = createContext<CarryForwardContextValue | null>(null);

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

export function useCarryForward(): CarryForwardContextValue {
  const ctx = useContext(CarryForwardContext);
  if (!ctx) throw new Error('useCarryForward must be used within <RoomProvider>');
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

  const [room, setRoom] = useState<Room | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [latestMatch, setLatestMatch] = useState<BabyName | null>(null);
  const [pendingMilestone, setPendingMilestone] = useState<Milestone | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [isRoomHydrated, setIsRoomHydrated] = useState(false);

  const matchSubscriptionRef = useRef<ReturnType<typeof RoomService.subscribeToMatches> | null>(null);
  const roomSubscriptionRef = useRef<ReturnType<typeof RoomService.subscribeToRoom> | null>(null);
  const seenMatchIdsRef = useRef(new Set<string>());
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
      seenMatchIdsRef.current.clear();
      setRoom(null);
      setMatches([]);
      setLatestMatch(null);
      setIsLoadingRoom(false);
      setIsRoomHydrated(true);
      return;
    }

    const load = async () => {
      try {
        seenMatchIdsRef.current.clear();
        setIsLoadingRoom(true);
        setIsRoomHydrated(false);
        const [loadedRoom, loadedMatches] = await Promise.all([
          RoomService.getRoom(roomId),
          RoomService.getMatches(roomId),
        ]);
        if (cancelled) return;

        setRoom(loadedRoom);
        setMatches(loadedMatches);
        setLatestMatch(null);

        for (const row of loadedMatches) {
          seenMatchIdsRef.current.add(row.id);
        }

        clearMatchSubscription();
        clearRoomSubscription();
        if (__DEV__) {
          console.log('[RoomContext] room subscription create', {
            roomId,
            user1Id: loadedRoom?.user1_id ?? null,
            user2Id: loadedRoom?.user2_id ?? null,
          });
        }
        matchSubscriptionRef.current = RoomService.subscribeToMatches(roomId, (m) => {
          if (__DEV__) {
            console.log('[RoomContext] match realtime payload received', {
              roomId: m.room_id,
              nameId: m.name_id,
              name: m.baby_names?.name ?? null,
            });
          }
          if (seenMatchIdsRef.current.has(m.id)) {
            return;
          }
          seenMatchIdsRef.current.add(m.id);
          setMatches((prev) => [m, ...prev.filter((existing) => existing.id !== m.id)]);
          setLatestMatch(m.baby_names ?? null);
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
        seenMatchIdsRef.current.clear();
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
      seenMatchIdsRef.current.clear();
    };
  }, [profile?.room_id]);

  const createRoom = async () => {
    if (!user?.id) throw new Error('Not authenticated');
    // Guard: if a room already exists, return its code instead of creating a duplicate.
    if (room) return room.code;
    setIsLoadingRoom(true);
    try {
      const { room: newRoom, code } = await RoomService.createRoom(user.id);
      AnalyticsService.track('invite_create', { room_code_length: code.length });
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
    // Capture the caller's solo room id BEFORE the join completes. This is
    // the room we'll migrate swipes out of and soft-archive. If the user
    // never had a solo room (cold start straight from a partner-invite
    // deep link, signup → join sequence), this is null and the merge RPC
    // treats it as a no-op carry-forward.
    const soloRoomId = profile?.room_id ?? null;
    try {
      const targetRoom = await RoomService.joinRoom(user.id, code);
      AnalyticsService.track('invite_join_success', { room_code_length: code.length });

      // Carry the caller's solo-room swipes into the now-shared room and
      // recompute matches. Fire-and-forget would be wrong — we want the
      // carry_forward_count stamped on profiles before refreshProfile()
      // reads it, so the modal fires on the very first app open.
      try {
        const newMatchCount = await RoomService.mergeSoloRoomAfterJoin(
          targetRoom.id,
          soloRoomId,
        );
        AnalyticsService.track('carry_forward_completed', {
          newMatchCount,
          hadSoloRoom: soloRoomId !== null,
        });
        if (__DEV__) {
          console.log('[RoomContext] carry-forward complete', {
            targetRoomId: targetRoom.id,
            soloRoomId,
            newMatchCount,
          });
        }
      } catch (carryErr: any) {
        // Carry-forward failure must NOT block the join (user is already
        // in the room). Log + analytics; the modal won't fire but the
        // partner can still see matches from new swipes onward.
        console.error('[RoomContext] carry-forward failed (non-fatal):', carryErr?.message ?? carryErr);
        AnalyticsService.track('carry_forward_failed', {
          message: carryErr?.message ?? String(carryErr),
        });
      }

      await refreshProfile();
    } catch (err) {
      AnalyticsService.track('invite_join_failed', { room_code_length: code.length });
      throw err;
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const dismissCarryForward = useCallback(async () => {
    try {
      await RoomService.dismissCarryForwardNotice();
      await refreshProfile();
    } catch (err: any) {
      if (__DEV__) {
        console.error('[RoomContext] dismissCarryForward failed:', err?.message ?? err);
      }
    }
  }, [refreshProfile]);

  const leaveRoom = async () => {
    if (!user?.id) throw new Error('Not authenticated');
    setIsLoadingRoom(true);
    try {
      await RoomService.leaveRoom(user.id);
      await refreshProfile();

      // Immediate UI responsiveness; subscription effect will also clear on profile change.
      clearMatchSubscription();
      clearRoomSubscription();
      seenMatchIdsRef.current.clear();
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
    setMatches(loadedMatches);
    for (const row of loadedMatches) {
      seenMatchIdsRef.current.add(row.id);
    }
    if (__DEV__) {
      console.log('[RoomContext] matches refreshed after confirmed match', {
        roomId,
        count: loadedMatches.length,
      });
    }

    // Check milestone thresholds (fire-and-forget; never blocks swipe flow).
    try {
      const milestone = await checkMilestone(roomId, loadedMatches.length);
      if (milestone) {
        setPendingMilestone(milestone);
        AnalyticsService.track('milestone_reached', { roomId, milestone, matchCount: loadedMatches.length });
      }
    } catch {
      // Non-critical — swallowed silently.
    }
  };

  const dismissLatestMatch = () => setLatestMatch(null);
  const dismissMilestone = () => setPendingMilestone(null);

  const refreshMatches = useCallback(async () => {
    const roomId = room?.id ?? profile?.room_id ?? null;
    if (!roomId) return;
    try {
      const loadedMatches = await RoomService.getMatches(roomId);
      setMatches(loadedMatches);
      for (const row of loadedMatches) {
        seenMatchIdsRef.current.add(row.id);
      }
      if (__DEV__) {
        console.log('[RoomContext] refreshMatches re-hydrated', {
          roomId,
          count: loadedMatches.length,
        });
      }
    } catch (err: any) {
      if (__DEV__) {
        console.error('[RoomContext] refreshMatches failed:', err?.message ?? err);
      }
    }
  }, [room?.id, profile?.room_id]);

  // ── Solo-room auto-bootstrap ──
  //
  // Every authenticated user gets a solo room on first deck load so likes
  // and notes persist before they pair with a partner. Skipped when:
  //   - user not authenticated yet
  //   - profile already has a room_id
  //   - a partner-invite deep link is pending (they'll join into the
  //     partner's room instead, no point creating an orphan solo room)
  //   - a bootstrap is already in flight (debounces remount races)
  const bootstrapInFlightRef = useRef(false);
  useEffect(() => {
    if (!user?.id) return;
    if (profile?.room_id) return;
    if (peekPendingJoinCode()) return;
    if (bootstrapInFlightRef.current) return;

    bootstrapInFlightRef.current = true;
    void (async () => {
      try {
        const { room: newRoom, code } = await RoomService.createRoom(user.id);
        AnalyticsService.track('solo_room_auto_provisioned', {
          room_code_length: code.length,
        });
        if (__DEV__) {
          console.log('[RoomContext] auto-provisioned solo room', {
            roomId: newRoom.id,
            code,
          });
        }
        // refreshProfile is what propagates room_id to consumers; the
        // existing room-load effect will then pick up the new room and
        // subscribe / load matches.
        await refreshProfile();
      } catch (err: any) {
        // Non-fatal: user can still manually create a room via Settings →
        // Connect Partner. Log so we notice if this becomes systemic.
        console.error(
          '[RoomContext] solo-room auto-bootstrap failed:',
          err?.message ?? err,
        );
        AnalyticsService.track('solo_room_auto_provision_failed', {
          message: err?.message ?? String(err),
        });
      } finally {
        bootstrapInFlightRef.current = false;
      }
    })();
  }, [user?.id, profile?.room_id, refreshProfile]);

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
    refreshMatches,
    dismissCarryForward,
  };

  const matchStateValue: MatchStateContextValue = {
    matches,
    latestMatch,
    dismissLatestMatch,
    pendingMilestone,
    dismissMilestone,
  };

  const carryForwardValue: CarryForwardContextValue = {
    pendingCarryForwardCount: profile?.pending_carry_forward_count ?? null,
  };

  return (
    <RoomStateContext.Provider value={roomStateValue}>
      <RoomActionsContext.Provider value={roomActionsValue}>
        <MatchStateContext.Provider value={matchStateValue}>
          <CarryForwardContext.Provider value={carryForwardValue}>
            {children}
          </CarryForwardContext.Provider>
        </MatchStateContext.Provider>
      </RoomActionsContext.Provider>
    </RoomStateContext.Provider>
  );
}

