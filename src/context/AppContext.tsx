import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  BabyName,
  Match,
  Region,
  Room,
  SwipeDirection,
  NameFilters,
  DEFAULT_FILTERS,
} from '../types';
import { ALL_NAMES } from '../data/names';
import { enrichName, getNameLength } from '../services/nameEnrichment';
import { countryWeightingService } from '../services/CountryWeightingService';
// Preference learning — fire-and-forget only, never blocks boot
import { userPreferenceLearningService } from '../services/UserPreferenceLearningService';
import { adaptBabyName } from '../services/nameTypes';

// ─────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────
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
  // Filters
  filters: NameFilters;
  setFilters: (f: NameFilters) => void;
  activeFilterCount: number;
  // Country preference (stored in AsyncStorage, not Supabase)
  countryPreference: string | null;
  setCountryPreference: (country: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

const COUNTRY_PREF_KEY = (uid: string) => `namematch:country_pref:${uid}`;

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile, updateProfile } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [namesToSwipe, setNamesToSwipe] = useState<BabyName[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [latestMatch, setLatestMatch] = useState<BabyName | null>(null);
  const [filters, setFiltersState] = useState<NameFilters>(DEFAULT_FILTERS);
  const [countryPreference, setCountryPreferenceState] = useState<string | null>(null);

  const matchSubscription = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const swipedIdsRef = useRef<Set<string>>(new Set());

  const activeFilterCount =
    (filters.lengths.length > 0 ? 1 : 0) +
    (filters.startingLetter ? 1 : 0) +
    (filters.trends.length > 0 ? 1 : 0) +
    (filters.originsContain ? 1 : 0);

  // ── Load persisted country preference ───────────────────────
  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.getItem(COUNTRY_PREF_KEY(user.id))
      .then((val) => { if (val) setCountryPreferenceState(val); })
      .catch(() => {});
  }, [user?.id]);

  const setCountryPreference = async (country: string) => {
    setCountryPreferenceState(country);
    if (user?.id) {
      await AsyncStorage.setItem(COUNTRY_PREF_KEY(user.id), country).catch(() => {});
    }
  };

  // ── Room loading ─────────────────────────────────────────────
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

  useEffect(() => {
    if (!user || !room) return;
    loadSwipedIds().then(() => buildNameQueue());
    loadMatches();
    subscribeToMatches();
    return () => { matchSubscription.current?.unsubscribe(); };
  }, [room?.id, user?.id]);

  const loadSwipedIds = async () => {
    if (!user || !room) return;
    const { data } = await supabase
      .from('swipes')
      .select('name_id')
      .eq('user_id', user.id)
      .eq('room_id', room.id);
    if (data) {
      swipedIdsRef.current = new Set(data.map((s: { name_id: string }) => s.name_id));
    }
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

  // ── Core name queue builder (synchronous — guaranteed safe) ──
  const buildNameQueue = useCallback(() => {
    if (!profile) return;
    setIsLoadingNames(true);

    const genderPref = profile.gender_preference ?? 'both';
    const region = (profile.region_preference ?? 'WORLDWIDE') as Region;

    // Country-weighted pool: 80% primary country/region, 15% adjacent, 5% discovery
    // Gradually blends toward 70/20/10 after 30+ swipes (preference learning kicks in)
    let pool = countryWeightingService.getWeightedPool(
      ALL_NAMES,
      region,
      countryPreference ?? undefined,
      genderPref,
      swipedIdsRef.current.size,
    );

    // Apply active UI filters
    if (filters.lengths.length > 0) {
      pool = pool.filter((n) => filters.lengths.includes(getNameLength(n.name)));
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
        const enriched = enrichName(n.name);
        const trend = enriched.trend ?? n.trend;
        return trend ? filters.trends.includes(trend) : false;
      });
    }

    // Exclude already-swiped names
    pool = pool.filter((n) => !swipedIdsRef.current.has(n.id));

    setNamesToSwipe(pool);
    setIsLoadingNames(false);
  }, [profile?.gender_preference, profile?.region_preference, countryPreference, filters]);

  // Rebuild when preferences or filters change
  useEffect(() => {
    if (profile) buildNameQueue();
  }, [profile?.gender_preference, profile?.region_preference, countryPreference, filters]);

  const loadMoreNames = () => buildNameQueue();

  // ── Room management ─────────────────────────────────────────
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
    await supabase.from('profiles').update({ room_id: newRoom.id }).eq('id', user.id);
    setRoom(newRoom);
    await refreshProfile();
    return code;
  };

  const joinRoom = async (code: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    const upperCode = code.toUpperCase().trim();
    const { data: roomData, error: findError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', upperCode)
      .single();
    if (findError || !roomData) throw new Error('Room not found. Check the code and try again.');
    const foundRoom = roomData as Room;
    if (foundRoom.user1_id === user.id) throw new Error('This is your own room code!');
    if (foundRoom.user2_id && foundRoom.user2_id !== user.id) throw new Error('This room is already full.');
    const { error: joinError } = await supabase
      .from('rooms')
      .update({ user2_id: user.id })
      .eq('id', foundRoom.id);
    if (joinError) throw joinError;
    await supabase.from('profiles').update({ room_id: foundRoom.id }).eq('id', user.id);
    setRoom({ ...foundRoom, user2_id: user.id });
    await refreshProfile();
  };

  const leaveRoom = async (): Promise<void> => {
    if (!user || !room) return;
    await supabase.from('profiles').update({ room_id: null }).eq('id', user.id);
    setRoom(null);
    setMatches([]);
    swipedIdsRef.current = new Set();
    matchSubscription.current?.unsubscribe();
    await refreshProfile();
  };

  // ── Swipe recording ─────────────────────────────────────────
  const recordSwipe = async (nameId: string, direction: SwipeDirection): Promise<boolean> => {
    if (!user || !room) return false;

    const swipedName = namesToSwipe.find((n) => n.id === nameId);
    setNamesToSwipe((prev) => prev.filter((n) => n.id !== nameId));
    swipedIdsRef.current.add(nameId);

    if (profile && profile.free_swipes_remaining > 0) {
      updateProfile({ free_swipes_remaining: profile.free_swipes_remaining - 1 }).catch(() => {});
    }

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

    let isMatch = false;
    if (direction === 'right') {
      const { data } = await supabase.rpc('check_and_create_match', {
        p_room_id: room.id,
        p_name_id: nameId,
        p_user_id: user.id,
      });
      isMatch = data === true;
    }

    // Fire-and-forget preference learning (never blocks the swipe)
    if (swipedName && user?.id) {
      try {
        const normalized = adaptBabyName(swipedName);
        const signal = isMatch ? 'match' : direction === 'right' ? 'like' : 'skip';
        userPreferenceLearningService.recordSwipe(user.id, normalized, signal).catch(() => {});
      } catch {
        // ignore any conversion errors — learning is non-critical
      }
    }

    return isMatch;
  };

  const dismissLatestMatch = () => setLatestMatch(null);

  const setFilters = (f: NameFilters) => {
    swipedIdsRef.current = new Set();
    setFiltersState(f);
  };

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
        filters,
        setFilters,
        activeFilterCount,
        countryPreference,
        setCountryPreference,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
