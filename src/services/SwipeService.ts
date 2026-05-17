import { supabase } from '../lib/supabase';
import { getBundledNameById } from '../data/names';
import { rarityFromPopularityRank } from '../lib/rarityFromPopularityRank';
import { enrichName } from './nameEnrichment';
import type { BabyName, Gender, Region, SwipeDirection } from '../types';

const BABY_NAMES_IN_CHUNK = 100;

/** Row shape returned by `swipes` for liked names. */
interface LikedSwipeRow {
  id: string;
  name_id: string;
  direction: string;
  liked?: boolean | null;
  created_at: string;
}

interface LikedBabyNameRow {
  id: string;
  name: string;
  meaning: string | null;
  origin: string | null;
  gender: string;
  country: string | null;
  region: string;
  is_worldwide: boolean;
  popularity_rank: number | null;
}

export interface LikedName {
  swipeId: string;
  swipedAt: string;
  name: BabyName;
}

function likedBabyNameRowToBabyName(bn: LikedBabyNameRow): BabyName {
  const enriched = enrichName(bn.name);
  const popularity_rank = bn.popularity_rank ?? enriched.popularity_rank;
  return {
    id: bn.id,
    name: bn.name,
    meaning: bn.meaning ?? '',
    origin: bn.origin ?? '',
    gender: bn.gender as Gender,
    country: bn.country ?? undefined,
    region: bn.region as Region,
    is_worldwide: bn.is_worldwide,
    popularity_rank,
    rarity: rarityFromPopularityRank(popularity_rank),
    trend: enriched.trend,
    pronunciation: enriched.pronunciation,
    source: bn.origin === 'Custom' ? 'custom' : 'catalog',
  };
}

function toLikedNameFromDbBabyRow(row: LikedSwipeRow, bn: LikedBabyNameRow): LikedName {
  return {
    swipeId: row.id,
    swipedAt: row.created_at,
    name: likedBabyNameRowToBabyName(bn),
  };
}

function toLikedNameFromBundled(row: LikedSwipeRow, bundled: BabyName): LikedName {
  const enriched = enrichName(bundled.name);
  const popularity_rank = bundled.popularity_rank ?? enriched.popularity_rank;
  return {
    swipeId: row.id,
    swipedAt: row.created_at,
    name: {
      ...bundled,
      meaning: bundled.meaning ?? '',
      origin: bundled.origin ?? '',
      popularity_rank,
      rarity: rarityFromPopularityRank(popularity_rank),
      trend: bundled.trend ?? enriched.trend,
      pronunciation: bundled.pronunciation ?? enriched.pronunciation,
      source:
        bundled.source ??
        (bundled.origin === 'Custom' ? 'custom' : 'catalog'),
    },
  };
}

async function fetchLikedBabyNameRows(nameIds: string[]): Promise<Map<string, LikedBabyNameRow>> {
  const out = new Map<string, LikedBabyNameRow>();
  if (nameIds.length === 0) return out;
  for (let i = 0; i < nameIds.length; i += BABY_NAMES_IN_CHUNK) {
    const chunk = nameIds.slice(i, i + BABY_NAMES_IN_CHUNK);
    const { data, error } = await supabase
      .from('baby_names')
      .select('id, name, meaning, origin, gender, country, region, is_worldwide, popularity_rank')
      .in('id', chunk);
    if (error) {
      console.error('[SwipeService] fetchLikedBabyNameRows error:', error.message);
      continue;
    }
    for (const row of (data ?? []) as LikedBabyNameRow[]) {
      out.set(row.id, row);
    }
  }
  return out;
}

export const SwipeService = {
  async getSwipedNameIds(userId: string, roomId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('swipes')
      .select('name_id')
      .eq('user_id', userId)
      .eq('room_id', roomId);

    if (error) {
      // Best-effort: on query failures we still want the swipe deck to build (with an empty swiped-id set).
      console.error('[SwipeService] getSwipedNameIds error:', error.message);
      return new Set();
    }

    return new Set((data ?? []).map((s: { name_id: string }) => s.name_id));
  },

  async upsertSwipe(params: {
    userId: string;
    roomId: string;
    nameId: string;
    direction: SwipeDirection;
  }): Promise<void> {
    const { error } = await supabase.from('swipes').upsert(
      {
        user_id: params.userId,
        room_id: params.roomId,
        name_id: params.nameId,
        direction: params.direction,
        liked: params.direction === 'right',
      },
      { onConflict: 'room_id,user_id,name_id' },
    );
    if (error) throw error;
  },

  async checkAndCreateMatch(params: {
    userId: string;
    roomId: string;
    nameId: string;
  }): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_and_create_match', {
      p_room_id: params.roomId,
      p_name_id: params.nameId,
      p_user_id: params.userId,
    });
    if (error) throw error;
    return data === true;
  },

  /**
   * Fetch all names the current user swiped right on in this room.
   * Uses two queries instead of Supabase embedded joins so schema-cache FK naming cannot break My Likes.
   */
  async getLikedNames(userId: string, roomId: string): Promise<LikedName[]> {
    const { data: swipeRows, error: swipeError } = await supabase
      .from('swipes')
      .select('id, name_id, direction, liked, created_at')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .or('direction.eq.right,liked.eq.true')
      .order('created_at', { ascending: false });

    if (swipeError) {
      console.error('[SwipeService] getLikedNames swipes error:', swipeError.message);
      return [];
    }

    const swipes = (swipeRows ?? []).filter((r) => {
      const row = r as LikedSwipeRow;
      return row.direction === 'right' || row.liked === true;
    }) as LikedSwipeRow[];
    if (swipes.length === 0) {
      if (__DEV__) console.log('[SwipeService] getLikedNames: no liked swipes');
      return [];
    }

    const uniqueIds = [...new Set(swipes.map((s) => s.name_id).filter(Boolean))];
    const idsNeedingDb = uniqueIds.filter((id) => !getBundledNameById(id));
    const babyNamesById = await fetchLikedBabyNameRows(idsNeedingDb);

    if (__DEV__) {
      console.log('[SwipeService] getLikedNames loaded', {
        swipes: swipes.length,
        uniqueNameIds: uniqueIds.length,
        bundledResolvable: uniqueIds.length - idsNeedingDb.length,
        dbBabyNames: babyNamesById.size,
      });
    }

    return swipes
      .map((row) => {
        const bundled = getBundledNameById(row.name_id);
        if (bundled) return toLikedNameFromBundled(row, bundled);
        const bn = babyNamesById.get(row.name_id);
        if (!bn) return null;
        return toLikedNameFromDbBabyRow(row, bn);
      })
      .filter((x): x is LikedName => x !== null);
  },

  /**
   * Fetch IDs of custom names created by the partner that the current user
   * hasn't swiped yet.  Used by the deck builder to front-load them.
   */
  async getPartnerCustomNameIds(params: {
    userId: string;
    roomId: string;
  }): Promise<Set<string>> {
    try {
      // 1. Resolve partner
      const { data: room } = await supabase
        .from('rooms')
        .select('user1_id,user2_id')
        .eq('id', params.roomId)
        .maybeSingle();

      if (!room) return new Set();
      const partnerId =
        room.user1_id === params.userId
          ? room.user2_id
          : room.user2_id === params.userId
          ? room.user1_id
          : null;
      if (!partnerId) return new Set();

      // 2. Partner's right-swiped custom names
      const { data: partnerCustomSwipes } = await supabase
        .from('swipes')
        .select('name_id, baby_names!inner(origin)')
        .eq('user_id', partnerId)
        .eq('room_id', params.roomId)
        .eq('direction', 'right')
        .eq('baby_names.origin', 'Custom');

      if (!partnerCustomSwipes?.length) return new Set();

      // 3. Exclude names the current user already swiped
      const { data: mySwiped } = await supabase
        .from('swipes')
        .select('name_id')
        .eq('user_id', params.userId)
        .eq('room_id', params.roomId);

      const mySwipedSet = new Set(
        (mySwiped ?? []).map((r: { name_id: string }) => r.name_id),
      );

      return new Set(
        (partnerCustomSwipes as unknown as { name_id: string }[])
          .map((r) => r.name_id)
          .filter((id) => !mySwipedSet.has(id)),
      );
    } catch (err: any) {
      console.error('[SwipeService] getPartnerCustomNameIds error:', err?.message ?? err);
      return new Set();
    }
  },

  /**
   * Partner right-swipes on custom `baby_names`: full rows for surfacing into the deck when the
   * name is not yet present in the weighted pool (IDs-only refetch is insufficient).
   */
  async getPartnerCustomNames(params: {
    userId: string;
    roomId: string;
  }): Promise<BabyName[]> {
    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('user1_id,user2_id')
        .eq('id', params.roomId)
        .maybeSingle();

      if (!room) return [];
      const partnerId =
        room.user1_id === params.userId
          ? room.user2_id
          : room.user2_id === params.userId
            ? room.user1_id
            : null;
      if (!partnerId) return [];

      const { data: partnerRows, error: partnerErr } = await supabase
        .from('swipes')
        .select(
          [
            'name_id',
            'baby_names!inner(id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank)',
          ].join(','),
        )
        .eq('user_id', partnerId)
        .eq('room_id', params.roomId)
        .eq('direction', 'right')
        .eq('baby_names.origin', 'Custom')
        .order('created_at', { ascending: false });

      if (partnerErr || !partnerRows?.length) return [];

      const { data: mySwiped } = await supabase
        .from('swipes')
        .select('name_id')
        .eq('user_id', params.userId)
        .eq('room_id', params.roomId);

      const mySwipedSet = new Set((mySwiped ?? []).map((r: { name_id: string }) => r.name_id));

      const out: BabyName[] = [];
      const seenId = new Set<string>();
      for (const raw of partnerRows as unknown as {
        name_id: string;
        baby_names: LikedBabyNameRow | LikedBabyNameRow[] | null;
      }[]) {
        if (mySwipedSet.has(raw.name_id)) continue;
        const bnRaw = raw.baby_names;
        const bn = Array.isArray(bnRaw) ? bnRaw[0] : bnRaw;
        if (!bn?.id || bn.origin !== 'Custom') continue;
        if (seenId.has(bn.id)) continue;
        seenId.add(bn.id);
        out.push(likedBabyNameRowToBabyName(bn));
      }
      return out;
    } catch (err: any) {
      console.error('[SwipeService] getPartnerCustomNames error:', err?.message ?? err);
      return [];
    }
  },

  /**
   * Ephemeral Realtime broadcast so the partner can refetch `getPartnerCustomNameIds`
   * without `swipes` being in `supabase_realtime` (postgres_changes still used when available).
   */
  notifyPartnerCustomSurfaceHint(roomId: string): void {
    const channel = supabase.channel(`partner-swipe-deck:${roomId}`, {
      config: { broadcast: { self: true } },
    });
    void channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      void channel
        .send({ type: 'broadcast', event: 'refetch_partner_custom', payload: {} })
        .finally(() => {
          void supabase.removeChannel(channel);
        });
    });
  },

  /**
   * Unlike a name: flip the swipe to 'left' and clean up any match.
   * Uses upsert (existing unique constraint on user_id+room_id+name_id).
   *
   * Match cleanup: attempts DELETE on the match row. If RLS blocks it
   * (no DELETE policy yet), we silently skip — the match list is still
   * accurate because the swipe direction changed and the match only existed
   * because both users swiped right.
   */
  async unlikeName(params: {
    userId: string;
    roomId: string;
    nameId: string;
  }): Promise<void> {
    // 1. Flip swipe to 'left'
    const { error: swipeErr } = await supabase.from('swipes').upsert(
      {
        user_id: params.userId,
        room_id: params.roomId,
        name_id: params.nameId,
        direction: 'left',
        liked: false,
      },
      { onConflict: 'room_id,user_id,name_id' },
    );
    if (swipeErr) throw swipeErr;

    // 2. Best-effort match cleanup (may fail without DELETE RLS — that's OK)
    try {
      await supabase
        .from('matches')
        .delete()
        .eq('room_id', params.roomId)
        .eq('name_id', params.nameId);
    } catch {
      // Non-fatal: match row stays but is now inconsistent.
      // The UI hides it once user refreshes matches.
    }
  },
};

