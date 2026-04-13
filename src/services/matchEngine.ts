import { supabase, type SwipeInsert } from './supabase';

export type MatchResult = {
  matched: boolean;
  matchId?: string;
};

export async function recordSwipeAndCheckMatch(
  swipe: SwipeInsert,
): Promise<MatchResult> {
  const { user_id, room_id, baby_name_id, liked, direction, gender, origin, style } = swipe;

  const { error: swipeError } = await supabase.from('swipes').upsert(
    {
      user_id,
      room_id,
      baby_name_id,
      name_id: baby_name_id,
      liked,
      direction: direction ?? (liked ? 'right' : 'left'),
      gender: gender ?? null,
      origin: origin ?? null,
      style: style ?? null,
    },
    {
      onConflict: 'user_id,baby_name_id',
      ignoreDuplicates: false,
    },
  );

  if (swipeError) {
    throw new Error(`Failed to save swipe: ${swipeError.message}`);
  }

  if (!liked) {
    return { matched: false };
  }

  const { data: likes, error: likeError } = await supabase
    .from('swipes')
    .select('user_id')
    .eq('room_id', room_id)
    .eq('baby_name_id', baby_name_id)
    .eq('liked', true);

  if (likeError) {
    throw new Error(`Failed to check existing likes: ${likeError.message}`);
  }

  const uniqueUsers = new Set((likes ?? []).map((row: { user_id: string }) => row.user_id));

  if (uniqueUsers.size < 2) {
    return { matched: false };
  }

  const { data: existingMatch, error: existingMatchError } = await supabase
    .from('matches')
    .select('id')
    .eq('room_id', room_id)
    .eq('name_id', baby_name_id)
    .maybeSingle();

  if (existingMatchError) {
    throw new Error(`Failed to check existing match: ${existingMatchError.message}`);
  }

  if (existingMatch?.id) {
    return { matched: true, matchId: existingMatch.id };
  }

  const { data: insertedMatch, error: insertMatchError } = await supabase
    .from('matches')
    .insert({
      room_id,
      name_id: baby_name_id,
    })
    .select('id')
    .single();

  if (insertMatchError) {
    throw new Error(`Failed to create match: ${insertMatchError.message}`);
  }

  return {
    matched: true,
    matchId: insertedMatch.id,
  };
}
