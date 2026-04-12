import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { BabyName, Match, Room, SwipeDirection } from '../types';
import { ALL_NAMES, filterByGender } from '../data/names';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
interface AppContextValue {
  room: Room | null;
  matches: Match[];
  namesToSwipe: BabyName[];
  isLoadingNames: boolean;
  latestMatch: BabyName | null;
  dismissLatestMatch: () => void;
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  recordSwipe: (nameId: string, direction: SwipeDirection) => Promise<boolean>;
  loadMoreNames: () => void;
}

// ──────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// ──────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [namesToSwipe, setNamesToSwipe] = useState<BabyName[]>([]);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [latestMatch, setLatestMatch] = useState<BabyName | null>(null);
  const matchSubscription = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const swipeInFlight = useRef(false);

  // ── Load room on profile change ─────────────────────────
  useEffect(() => {
    if (profile?.room_id) {
      loadRoom(profile.room_id);
    } else {
      setRoom(null);
    }
  }, [profile?.room_id]);

  const loadRoom = async (roomId: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    if (!error && data) setRoom(data as Room);
  };

  // ── Load previously swiped names ───────────────────────
  useEffect(() => {
    if (!user || !room) return;
    loadSwipedIds();
    loadMatches();
    subscribeToMatches();
    return () => {
      matchSubscription.current?.unsubscribe();
    };
  }, [room?.id, user?.id]);

  const loadSwipedIds = async () => {
    if (!user || !room) return;
    const { data } = await supabase
      .from('swipes')
      .select('name_id')
      .eq('user_id', user.id)
      .eq('room_id', room.id);
    if (data) setSwipedIds(new Set(data.map((s) => s.name_id)));
  };

  const loadMatches = async () => {
    if (!room) return;
    const { data } = await supabase
      .from('matches')
      .select('*, baby_names(*)')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false });
    if (data) setMatches(data as Match[]);
  };

  const subscribeToMatches = () => {
    if (!room) return;
    matchSubscription.current?.unsubscribe();
    matchSubscription.current = supabase
      .channel(`matches:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          // Fetch the full match with name data
          const { data } = await supabase
            .from('matches')
            .select('*, baby_names(*)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setMatches((prev) => [data as Match, ...prev]);
            setLatestMatch((data as Match).baby_names ?? null);
          }
        }
      )
      .subscribe();
  };

  // ── Build name queue ────────────────────────────────────
  useEffect(() => {
    if (profile) buildNameQueue();
  }, [profile?.gender_preference, profile?.region_preference, swipedIds]);

  const buildNameQueue = useCallback(() => {
    setIsLoadingNames(true);
    const genderPref = profile?.gender_preference ?? 'both';
    const region = profile?.region_preference ?? 'WORLDWIDE';

    let pool = ALL_NAMES;
    // Filter by region
    if (region !== 'WORLDWIDE') {
      pool = pool.filter((n) => n.region === region || n.is_worldwide);
    }
    // Filter by gender
    pool = filterByGender(pool, genderPref);
    // Exclude already swiped
    pool = pool.filter((n) => !swipedIds.has(n.id));
    // Shuffle
    pool = [...pool].sort(() => Math.random() - 0.5);

    setNamesToSwipe(pool);
    setIsLoadingNames(false);
  }, [profile?.gender_preference, profile?.region_preference, swipedIds]);

  const loadMoreNames = () => buildNameQueue();

  // ── Room actions ────────────────────────────────────────
  const createRoom = async (): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const code = generateRoomCode();

    const { data, error } = await supabase
      .from('rooms')
      .insert({ code, user1_id: user.id })
      .select()
      .single();
    if (error) throw error;

    const newRoom = data as Room;
    // Link room to profile
    await supabase
      .from('profiles')
      .update({ room_id: newRoom.id })
      .eq('id', user.id);

    setRoom(newRoom);
    await refreshProfile();
    return code;
  };

  const joinRoom = async (code: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    const upperCode = code.toUpperCase().trim();

    // Find the room
    const { data: roomData, error: findError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', upperCode)
      .single();
    if (findError || !roomData) throw new Error('Room not found. Check the code and try again.');

    const foundRoom = roomData as Room;
    if (foundRoom.user1_id === user.id) throw new Error('This is your own room code!');
    if (foundRoom.user2_id && foundRoom.user2_id !== user.id) {
      throw new Error('This room is already full.');
    }

    // Join the room
    const { error: joinError } = await supabase
      .from('rooms')
      .update({ user2_id: user.id })
      .eq('id', foundRoom.id);
    if (joinError) throw joinError;

    // Link to profile
    await supabase
      .from('profiles')
      .update({ room_id: foundRoom.id })
      .eq('id', user.id);

    setRoom({ ...foundRoom, user2_id: user.id });
    await refreshProfile();
  };

  const leaveRoom = async (): Promise<void> => {
    if (!user || !room) return;
    await supabase
      .from('profiles')
      .update({ room_id: null })
      .eq('id', user.id);
    setRoom(null);
    setMatches([]);
    setSwipedIds(new Set());
    matchSubscription.current?.unsubscribe();
    await refreshProfile();
  };

  // ── Swipe action ────────────────────────────────────────
  const recordSwipe = async (
    nameId: string,
    direction: SwipeDirection
  ): Promise<boolean> => {
    if (!user || !room) return false;
    if (swipeInFlight.current) return false;

    swipeInFlight.current = true;

    try {
      const { error } = await supabase.from('swipes').upsert({
        user_id: user.id,
        room_id: room.id,
        name_id: nameId,
        direction,
      });

      if (error) {
        console.error('[AppContext] recordSwipe error:', error.message);
        return false;
      }

      if (profile && profile.free_swipes_remaining > 0) {
        await supabase
          .from('profiles')
          .update({ free_swipes_remaining: profile.free_swipes_remaining - 1 })
          .eq('id', user.id);
      }

      setSwipedIds((prev) => new Set([...prev, nameId]));
      setNamesToSwipe((prev) => prev.filter((n) => n.id !== nameId));

      if (direction === 'right') {
        const { data, error: matchError } = await supabase.rpc('check_and_create_match', {
          p_room_id: room.id,
          p_name_id: nameId,
          p_user_id: user.id,
        });

        if (matchError) {
          console.error('[AppContext] check_and_create_match error:', matchError.message);
          return false;
        }

        return data === true;
      }

      return false;
    } finally {
      swipeInFlight.current = false;
    }
  };

  const dismissLatestMatch = () => setLatestMatch(null);

  return (
    <AppContext.Provider
      value={{
        room,
        matches,
        namesToSwipe,
        isLoadingNames,
        latestMatch,
        dismissLatestMatch,
        createRoom,
        joinRoom,
        leaveRoom,
        recordSwipe,
        loadMoreNames,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
