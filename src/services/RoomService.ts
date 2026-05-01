import { rarityForBabyName } from '../lib/rarityFromPopularityRank';
import { supabase } from '../lib/supabase';
import type { Match, Room } from '../types';

export type SubscribeToMatchesCallback = (match: Match) => void;
export type SubscribeToRoomCallback = (room: Room) => void;

function matchWithBabyNameRarity(match: Match): Match {
  const bn = match.baby_names;
  if (!bn) return match;
  return { ...match, baby_names: { ...bn, rarity: rarityForBabyName(bn) } };
}

// Narrow DTO for match list + celebration UI (avoid fetching broad `*` payloads).
const MATCH_SELECT =
  'id, room_id, name_id, created_at, baby_names(id, name, meaning, origin, gender, country, region, is_worldwide, popularity_rank)';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes I, O, 0, 1

function generateRoomCode(): string {
  return Array.from({ length: 6 }, () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]).join('');
}

export const RoomService = {
  async createRoom(userId: string): Promise<{ room: Room; code: string }> {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from('rooms')
      .insert({ code, user1_id: userId })
      .select()
      .single();
    if (error) throw error;
    const room = data as Room;

    // Keep profile bootstrap in sync with room creation.
    const { error: profileErr } = await supabase.from('profiles').update({ room_id: room.id }).eq('id', userId);
    if (profileErr) throw profileErr;

    return { room, code };
  },

  async joinRoom(userId: string, code: string): Promise<Room> {
    const upperCode = code.toUpperCase().trim();

    // ── 1. Atomic claim: UPDATE directly by code ──
    // Avoids the pre-SELECT that fails under restrictive SELECT RLS.
    const { data: claimed, error: claimErr } = await supabase
      .from('rooms')
      .update({ user2_id: userId })
      .eq('code', upperCode)
      .is('user2_id', null)
      .eq('is_active', true)
      .select('*')
      .maybeSingle();

    if (__DEV__) {
      console.log('[RoomService] joinRoom atomic claim result', {
        code: upperCode,
        userId,
        hasClaimedRoom: !!claimed,
        claimError: claimErr?.message ?? null,
      });
    }

    if (!claimErr && claimed) {
      const room = claimed as Room;
      // Shouldn't happen (user claiming own room), but guard:
      if (room.user1_id === userId) throw new Error('This is your own room code!');
      const { error: profileErr } = await supabase.from('profiles').update({ room_id: room.id }).eq('id', userId);
      if (profileErr) throw profileErr;
      return room;
    }
    if (claimErr) {
      console.error('[RoomService] joinRoom claim error:', claimErr.message);
    }

    // ── 2. Claim didn't match — diagnose why ──
    // Try SELECT (works if user is already a member, or if RLS allows discovery).
    const { data: existingRoom, error: existingErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', upperCode)
      .maybeSingle();

    if (__DEV__) {
      console.log('[RoomService] joinRoom fallback diagnosis', {
        code: upperCode,
        userId,
        hasExistingRoom: !!existingRoom,
        selectError: existingErr?.message ?? null,
        user1Id: (existingRoom as Room | null)?.user1_id ?? null,
        user2Id: (existingRoom as Room | null)?.user2_id ?? null,
        isActive: (existingRoom as Room | null)?.is_active ?? null,
      });
    }

    if (existingErr) {
      console.error('[RoomService] joinRoom fallback select error:', existingErr.message);
    }

    if (!existingRoom) {
      if (__DEV__) console.log('[RoomService] joinRoom diagnosis branch: not-found-or-not-visible');
      throw new Error('Room not found. Check the code and try again.');
    }

    const room = existingRoom as Room;
    if (room.user1_id === userId) {
      if (__DEV__) console.log('[RoomService] joinRoom diagnosis branch: own-room');
      throw new Error('This is your own room code!');
    }

    if (room.user2_id && room.user2_id !== userId) {
      if (__DEV__) console.log('[RoomService] joinRoom diagnosis branch: full-room');
      throw new Error('This room is already full.');
    }

    if (room.user2_id === userId) {
      if (__DEV__) console.log('[RoomService] joinRoom diagnosis branch: already-joined');
      // Already joined — sync profile and return.
      const { error: profileErr } = await supabase.from('profiles').update({ room_id: room.id }).eq('id', userId);
      if (profileErr) throw profileErr;
      return room;
    }

    if (__DEV__) console.log('[RoomService] joinRoom diagnosis branch: open-but-unclaimed');
    throw new Error('Could not join room. Please try again.');
  },

  async leaveRoom(userId: string): Promise<void> {
    const { error } = await supabase.from('profiles').update({ room_id: null }).eq('id', userId);
    if (error) throw error;
  },

  async getRoom(roomId: string): Promise<Room | null> {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (error) return null;
    return data as Room;
  },

  async getMatches(roomId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return ((data ?? []) as unknown as Match[]).map(matchWithBabyNameRarity);
  },

  async grantRoomPremiumPacks(roomId: string, packKeys: string[]): Promise<Room | null> {
    const additions = packKeys.filter(Boolean);
    if (additions.length === 0) return this.getRoom(roomId);

    const currentRoom = await this.getRoom(roomId);
    if (!currentRoom) return null;

    const nextPacks = [...new Set([...(currentRoom.premium_packs ?? []), ...additions])];
    if (nextPacks.length === (currentRoom.premium_packs ?? []).length) {
      return currentRoom;
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ premium_packs: nextPacks })
      .eq('id', roomId)
      .select('*')
      .single();

    if (error) throw error;
    return data as Room;
  },

  subscribeToMatches(roomId: string, onInsert: SubscribeToMatchesCallback): ReturnType<typeof supabase.channel> {
    const channel = supabase
      .channel(`matches:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch inserted match with only UI-needed fields.
          const insertedId = (payload as any)?.new?.id as string | undefined;
          if (!insertedId) return;

          const { data } = await supabase
            .from('matches')
            .select(MATCH_SELECT)
            .eq('id', insertedId)
            .single();
          if (data) onInsert(matchWithBabyNameRarity(data as unknown as Match));
        },
      )
      .subscribe();

    return channel;
  },

  subscribeToRoom(roomId: string, onUpdate: SubscribeToRoomCallback): ReturnType<typeof supabase.channel> {
    if (__DEV__) {
      console.log('[RoomService] subscribeToRoom create', {
        roomId,
        filter: `id=eq.${roomId}`,
      });
    }
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const nextRoom = (payload as any)?.new as Room | undefined;
          if (__DEV__) {
            console.log('[RoomService] subscribeToRoom payload', {
              eventType: (payload as any)?.eventType ?? null,
              roomId: nextRoom?.id ?? null,
              user1Id: nextRoom?.user1_id ?? null,
              user2Id: nextRoom?.user2_id ?? null,
            });
          }
          if (nextRoom?.id) onUpdate(nextRoom);
        },
      )
      .subscribe();

    return channel;
  },
};

