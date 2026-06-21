import { getBundledNameById } from '../data/names';
import { rarityForBabyName } from '../lib/rarityFromPopularityRank';
import { supabase } from '../lib/supabase';
import type { BabyName, Match, Room } from '../types';

export type SubscribeToMatchesCallback = (
  match: Match,
  options: {
    /**
     * True when the inserted match was tagged 'carry_forward' by the
     * merge RPC — the CarryForwardModal handles the announcement for
     * the bulk batch, so the per-match MatchCelebration overlay should
     * NOT fire (otherwise N realtime payloads in rapid succession all
     * race setLatestMatch and only one celebration survives — the
     * "Noah only" symptom from build-26 smoke testing).
     */
    silent: boolean;
  },
) => void;
/** Fired when a match row is DELETED in this room (partner unliked). */
export type SubscribeToMatchDeleteCallback = (matchId: string) => void;
export type SubscribeToRoomCallback = (room: Room) => void;

function matchWithBabyNameRarity(match: Match): Match {
  const bn = match.baby_names;
  if (!bn) return match;
  return { ...match, baby_names: { ...bn, rarity: rarityForBabyName(bn) } };
}

// Raw match rows — baby_names resolved client-side (bundled ids are not DB rows).
const MATCH_RAW_SELECT = 'id, room_id, name_id, created_at';

const BABY_NAME_MATCH_SELECT =
  'id, name, meaning, origin, gender, country, region, is_worldwide, popularity_rank';

type RawMatchRow = Pick<Match, 'id' | 'room_id' | 'name_id' | 'created_at'>;

const BABY_NAMES_IN_CHUNK = 100;

async function enrichMatchesWithBabyNames(rows: RawMatchRow[]): Promise<Match[]> {
  if (rows.length === 0) return [];

  const bundledByNameId = new Map<string, BabyName>();
  const uniqueNameIds = [...new Set(rows.map((r) => r.name_id))];
  for (const nameId of uniqueNameIds) {
    const bundled = getBundledNameById(nameId);
    if (bundled) bundledByNameId.set(nameId, bundled);
  }

  const dbFetchIds = uniqueNameIds.filter((id) => !bundledByNameId.has(id));

  const dbByNameId = new Map<string, BabyName>();
  for (let i = 0; i < dbFetchIds.length; i += BABY_NAMES_IN_CHUNK) {
    const chunk = dbFetchIds.slice(i, i + BABY_NAMES_IN_CHUNK);
    const { data, error } = await supabase.from('baby_names').select(BABY_NAME_MATCH_SELECT).in('id', chunk);
    if (error) {
      if (__DEV__) console.warn('[RoomService] enrichMatches baby_names chunk failed:', error.message);
      continue;
    }
    for (const row of data ?? []) {
      const bn = row as BabyName;
      if (bn?.id) dbByNameId.set(bn.id, bn);
    }
  }

  return rows.map((row) => ({
    ...row,
    baby_names: dbByNameId.get(row.name_id) ?? bundledByNameId.get(row.name_id),
  }));
}

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

  /**
   * Carry the joiner's solo-room swipes into the shared room, recompute
   * matches against the host's likes, soft-archive the solo room, and
   * stamp `pending_carry_forward_count` on BOTH profiles so each side
   * sees the celebration modal on next app open.
   *
   * Must be called AFTER RoomService.joinRoom has already set
   * target_room.user2_id and profile.room_id. Server-side this is one
   * SECURITY DEFINER RPC (idempotent — safe to retry).
   *
   * @param targetRoomId  the now-shared partner room
   * @param sourceRoomId  the joiner's previous solo room (their profile.room_id BEFORE join); pass null if they joined without a solo room.
   * @returns count of NEW matches created by the recompute.
   */
  async mergeSoloRoomAfterJoin(
    targetRoomId: string,
    sourceRoomId: string | null,
  ): Promise<number> {
    const { data, error } = await supabase.rpc('merge_solo_into_room_after_join', {
      p_target_room_id: targetRoomId,
      p_source_room_id: sourceRoomId,
    });
    if (error) {
      console.error('[RoomService] mergeSoloRoomAfterJoin error:', error.message);
      throw error;
    }
    return typeof data === 'number' ? data : 0;
  },

  /**
   * Clear the post-pair carry-forward modal. Idempotent; calling
   * twice just keeps the column NULL.
   */
  async dismissCarryForwardNotice(): Promise<void> {
    const { error } = await supabase.rpc('dismiss_carry_forward_notice');
    if (error) {
      console.error('[RoomService] dismissCarryForwardNotice error:', error.message);
      throw error;
    }
  },

  async getRoom(roomId: string): Promise<Room | null> {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (error) return null;
    return data as Room;
  },

  async getMatches(roomId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_RAW_SELECT)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });
    if (error) return [];
    const rows = (data ?? []) as RawMatchRow[];
    const enriched = await enrichMatchesWithBabyNames(rows);
    return enriched.map(matchWithBabyNameRarity);
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

    const { error } = await supabase.rpc('grant_room_premium', {
      p_room_id: roomId,
      p_premium_packs: additions,
    });
    if (error) throw error;
    return this.getRoom(roomId);
  },

  subscribeToMatches(
    roomId: string,
    onInsert: SubscribeToMatchesCallback,
    onDelete?: SubscribeToMatchDeleteCallback,
  ): ReturnType<typeof supabase.channel> {
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

          // `created_via` was added in migration 20260625. Older rows
          // (pre-migration) have it set by the default 'swipe', so the
          // strict-equality check below correctly defaults to non-silent
          // when the column is missing or unexpected.
          const createdVia = (payload as any)?.new?.created_via as string | undefined;
          const silent = createdVia === 'carry_forward';

          const { data } = await supabase.from('matches').select(MATCH_RAW_SELECT).eq('id', insertedId).single();
          if (!data) return;
          const [enriched] = await enrichMatchesWithBabyNames([data as RawMatchRow]);
          if (enriched) onInsert(matchWithBabyNameRarity(enriched), { silent });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'matches',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Partner unliked a previously-matched name → server-side
          // remove_match_for_name RPC delete the matches row. Without
          // this listener, the local matches list keeps showing the
          // phantom match until manual refresh / next focus. Forward
          // the deleted id to the room context so it can drop the row.
          //
          // Postgres realtime DELETE payloads include OLD only (NEW is
          // null for DELETE). Extract id from old.
          const deletedId = (payload as any)?.old?.id as string | undefined;
          if (!deletedId) return;
          onDelete?.(deletedId);
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

