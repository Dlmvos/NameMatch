import { supabase } from '../lib/supabase';
import { getBundledNameById } from '../data/names';
import { rarityFromPopularityRank } from '../lib/rarityFromPopularityRank';
import { enrichName } from './nameEnrichment';
import type { BabyName, Gender, Region, SwipeDirection } from '../types';

const BABY_NAMES_IN_CHUNK = 100;

/**
 * PostgREST `onConflict` must match the DB unique constraint column order exactly.
 * Production: `swipes_room_id_user_id_name_id_key` = UNIQUE(room_id, user_id, name_id).
 */
const SWIPES_ON_CONFLICT = 'room_id,user_id,name_id' as const;

/** Normalize persisted UUID/text ids for consistent bundled + DB map lookups. */
export function normalizeBabyNameId(id: string): string {
  return String(id ?? '').trim().toLowerCase();
}

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
  is_premium?: boolean | null;
  /** Set on rows created via `create_custom_name` (partner suggestion). */
  suggested_by_user_id?: string | null;
}

const PARTNER_SUGGESTED_BABY_NAME_SELECT =
  'id,name,meaning,origin,gender,country,region,is_worldwide,popularity_rank,is_premium,suggested_by_user_id';

function isPremiumBabyNameRow(bn: LikedBabyNameRow): boolean {
  return bn.is_premium === true;
}

/** Partner-suggested / user-authored swipe surface (not arbitrary catalog likes). */
function isPartnerSuggestedBabyRow(partnerProfileId: string, bn: LikedBabyNameRow): boolean {
  if (isPremiumBabyNameRow(bn)) return false;
  const proposer = bn.suggested_by_user_id;
  if (proposer && normalizeBabyNameId(proposer) === normalizeBabyNameId(partnerProfileId)) {
    return true;
  }
  return (bn.origin ?? '').trim().toLowerCase() === 'custom';
}

export interface LikedName {
  swipeId: string;
  swipedAt: string;
  name: BabyName;
}

function likedBabyNameRowToBabyName(bn: LikedBabyNameRow): BabyName {
  const enriched = enrichName(bn.name);
  const popularity_rank = bn.popularity_rank ?? enriched.popularity_rank;
  const customSuggestion =
    (bn.origin ?? '').trim().toLowerCase() === 'custom' || !!bn.suggested_by_user_id;
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
    source: customSuggestion ? 'custom' : 'catalog',
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
  const unique = [...new Set(nameIds.map(normalizeBabyNameId).filter(Boolean))];
  if (unique.length === 0) return out;
  for (let i = 0; i < unique.length; i += BABY_NAMES_IN_CHUNK) {
    const chunk = unique.slice(i, i + BABY_NAMES_IN_CHUNK);
    const { data, error } = await supabase
      .from('baby_names')
      .select('id, name, meaning, origin, gender, country, region, is_worldwide, popularity_rank')
      .in('id', chunk);
    if (error) {
      console.error('[SwipeService] fetchLikedBabyNameRows error:', error.message);
      continue;
    }
    for (const row of (data ?? []) as LikedBabyNameRow[]) {
      out.set(normalizeBabyNameId(row.id), row);
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
    const nameId = normalizeBabyNameId(params.nameId);
    const { error } = await supabase.from('swipes').upsert(
      {
        user_id: params.userId,
        room_id: params.roomId,
        name_id: nameId,
        direction: params.direction,
        liked: params.direction === 'right',
      },
      { onConflict: SWIPES_ON_CONFLICT },
    );
    if (error) throw error;
  },

  async checkAndCreateMatch(params: {
    userId: string;
    roomId: string;
    nameId: string;
  }): Promise<boolean> {
    const nameId = normalizeBabyNameId(params.nameId);
    const { data, error } = await supabase.rpc('check_and_create_match', {
      p_room_id: params.roomId,
      p_name_id: nameId,
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
      return [];
    }

    const uniqueIds = [...new Set(swipes.map((s) => normalizeBabyNameId(s.name_id)).filter(Boolean))];
    const idsNeedingDb = uniqueIds.filter((id) => !getBundledNameById(id));
    const babyNamesById = await fetchLikedBabyNameRows(idsNeedingDb);

    return swipes
      .map((row) => {
        const nid = normalizeBabyNameId(row.name_id);
        const bundled = getBundledNameById(nid);
        if (bundled) return toLikedNameFromBundled(row, bundled);
        const bn = babyNamesById.get(nid);
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

      const { data: partnerRows } = await supabase
        .from('swipes')
        .select(`name_id, baby_names!inner(${PARTNER_SUGGESTED_BABY_NAME_SELECT})`)
        .eq('user_id', partnerId)
        .eq('room_id', params.roomId)
        .eq('direction', 'right');

      if (!partnerRows?.length) return new Set();

      const { data: mySwiped } = await supabase
        .from('swipes')
        .select('name_id')
        .eq('user_id', params.userId)
        .eq('room_id', params.roomId);

      const mySwipedSet = new Set(
        (mySwiped ?? []).map((r: { name_id: string }) => normalizeBabyNameId(r.name_id)),
      );

      const out = new Set<string>();
      for (const raw of partnerRows as unknown as {
        name_id: string;
        baby_names: LikedBabyNameRow | LikedBabyNameRow[] | null;
      }[]) {
        if (mySwipedSet.has(normalizeBabyNameId(raw.name_id))) continue;
        const bnRaw = raw.baby_names;
        const bn = Array.isArray(bnRaw) ? bnRaw[0] : bnRaw;
        if (!bn?.id || !isPartnerSuggestedBabyRow(partnerId, bn)) continue;
        out.add(raw.name_id);
      }
      return out;
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
        .select(`name_id, baby_names!inner(${PARTNER_SUGGESTED_BABY_NAME_SELECT})`)
        .eq('user_id', partnerId)
        .eq('room_id', params.roomId)
        .eq('direction', 'right')
        .order('created_at', { ascending: false });

      if (partnerErr || !partnerRows?.length) return [];

      const { data: mySwiped } = await supabase
        .from('swipes')
        .select('name_id')
        .eq('user_id', params.userId)
        .eq('room_id', params.roomId);

      const mySwipedSet = new Set(
        (mySwiped ?? []).map((r: { name_id: string }) => normalizeBabyNameId(r.name_id)),
      );

      const out: BabyName[] = [];
      const seenId = new Set<string>();
      for (const raw of partnerRows as unknown as {
        name_id: string;
        baby_names: LikedBabyNameRow | LikedBabyNameRow[] | null;
      }[]) {
        if (mySwipedSet.has(normalizeBabyNameId(raw.name_id))) continue;
        const bnRaw = raw.baby_names;
        const bn = Array.isArray(bnRaw) ? bnRaw[0] : bnRaw;
        if (!bn?.id || !isPartnerSuggestedBabyRow(partnerId, bn)) continue;
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
    let sent = false;
    const teardown = () => {
      try {
        void supabase.removeChannel(channel);
      } catch {
        // ignore duplicate teardown
      }
    };
    const sendHint = () => {
      if (sent) return;
      sent = true;
      void channel
        .send({ type: 'broadcast', event: 'refetch_partner_custom', payload: {} })
        .finally(() => {
          setTimeout(teardown, 900);
        });
    };

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        sendHint();
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        teardown();
      }
    });

    setTimeout(sendHint, 1800);
    setTimeout(teardown, 12_000);
  },

  /**
   * Unlike a name: flip the swipe to 'left'. Prefers UPDATE (existing row); falls back to
   * normalized vs raw name_id retry, then upsert ON CONFLICT. Never touches partner swipes.
   */
  async unlikeName(params: {
    userId: string;
    roomId: string;
    nameId: string;
  }): Promise<void> {
    const normalizedId = normalizeBabyNameId(params.nameId);
    const rawTrimmed = params.nameId.trim();

    const tryUpdateWithNameId = async (nid: string) => {
      const { error, data } = await supabase
        .from('swipes')
        .update({
          direction: 'left',
          liked: false,
        })
        .eq('room_id', params.roomId)
        .eq('user_id', params.userId)
        .eq('name_id', nid)
        .select('id');

      const rows = Array.isArray(data) ? data.length > 0 : !!data;

      return { error, rows };
    };

    const finalizeSuccess = async () => {
      await supabase
        .from('matches')
        .delete()
        .eq('room_id', params.roomId)
        .eq('name_id', normalizedId);
    };

    // 1) UPDATE by normalized id (preferred when row matches getLikedNames hydration).
    let { error: u1e, rows: r1 } = await tryUpdateWithNameId(normalizedId);
    if (u1e) {
      throw u1e;
    }
    if (r1) return await finalizeSuccess();

    // 2) UPDATE by raw trimmed id when storage differs only by casing/format.
    if (rawTrimmed !== normalizedId) {
      const { error: u2e, rows: r2 } = await tryUpdateWithNameId(rawTrimmed);
      if (u2e) {
        throw u2e;
      }
      if (r2) return await finalizeSuccess();
    }

    // 3) UPSERT — creates or replaces row for this room/user/name (onConflict matches DB).
    const { error: upErr } = await supabase.from('swipes').upsert(
      {
        room_id: params.roomId,
        user_id: params.userId,
        name_id: normalizedId,
        direction: 'left',
        liked: false,
      },
      { onConflict: SWIPES_ON_CONFLICT },
    );

    if (upErr) {
      throw upErr;
    }

    await finalizeSuccess();
  },
};

