import { supabase } from './supabase';

export type PartnerActivitySummary = {
  partnerId: string | null;
  partnerLikedToday: number;
  potentialMatchesCount: number;
  unseenPartnerLikedNameIds: string[];
  partnerPriorityIds: string[];
};

export async function getPartnerId(roomId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('user1_id,user2_id')
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch room partner: ${error.message}`);
  }

  if (!data) return null;

  if (data.user1_id === userId) return data.user2_id ?? null;
  if (data.user2_id === userId) return data.user1_id ?? null;

  return null;
}

export async function getPartnerActivitySummary(
  roomId: string,
  userId: string,
): Promise<PartnerActivitySummary> {
  const partnerId = await getPartnerId(roomId, userId);

  if (!partnerId) {
    return {
      partnerId: null,
      partnerLikedToday: 0,
      potentialMatchesCount: 0,
      unseenPartnerLikedNameIds: [],
      partnerPriorityIds: [],
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: partnerLikedTodayRows, error: todayError } = await supabase
    .from('swipes')
    .select('baby_name_id')
    .eq('room_id', roomId)
    .eq('user_id', partnerId)
    .eq('liked', true)
    .gte('created_at', todayStart.toISOString())
    .not('baby_name_id', 'is', null);

  if (todayError) {
    throw new Error(`Failed to fetch partner daily activity: ${todayError.message}`);
  }

  const { data: partnerLikedRows, error: partnerLikedError } = await supabase
    .from('swipes')
    .select('baby_name_id,created_at')
    .eq('room_id', roomId)
    .eq('user_id', partnerId)
    .eq('liked', true)
    .not('baby_name_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (partnerLikedError) {
    throw new Error(`Failed to fetch partner likes: ${partnerLikedError.message}`);
  }

  const { data: mySwipeRows, error: mySwipeError } = await supabase
    .from('swipes')
    .select('baby_name_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .not('baby_name_id', 'is', null);

  if (mySwipeError) {
    throw new Error(`Failed to fetch user swipes: ${mySwipeError.message}`);
  }

  const partnerLikedSet = new Set(
    (partnerLikedRows ?? [])
      .map((row: { baby_name_id: string | null }) => row.baby_name_id)
      .filter(Boolean) as string[],
  );

  const mySwipedSet = new Set(
    (mySwipeRows ?? [])
      .map((row: { baby_name_id: string | null }) => row.baby_name_id)
      .filter(Boolean) as string[],
  );

  const unseenPartnerLikedNameIds = [...partnerLikedSet].filter((id) => !mySwipedSet.has(id));

  return {
    partnerId,
    partnerLikedToday: (partnerLikedTodayRows ?? []).length,
    potentialMatchesCount: unseenPartnerLikedNameIds.length,
    unseenPartnerLikedNameIds,
    partnerPriorityIds: unseenPartnerLikedNameIds.slice(0, 3),
  };
}
