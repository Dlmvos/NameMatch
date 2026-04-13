import { supabase } from '../lib/supabase';

export { supabase };

export type NameRecord = {
  id: string;
  name: string;
  gender: string | null;
  origin: string | null;
  meaning: string | null;
  style_tags: string[] | null;
  popularity_score: number | null;
};

export type SwipeRow = {
  id: string;
  room_id: string;
  user_id: string;
  baby_name_id: string | null;
  liked: boolean;
  created_at: string;
  direction?: string | null;
  gender?: string | null;
  origin?: string | null;
  style?: string[] | null;
};

export type MatchRow = {
  id: string;
  room_id: string;
  name_id: string;
  created_at: string;
};

export type RoomRow = {
  id: string;
  user1_id: string | null;
  user2_id: string | null;
};

export type PreferenceProfile = {
  preferredGenders: string[];
  preferredOrigins: string[];
  preferredStyles: string[];
  likedNameIds: string[];
  matchedNameIds: string[];
  seedNameIds: string[];
};

export type SwipeInsert = {
  user_id: string;
  room_id: string;
  baby_name_id: string;
  liked: boolean;
  direction?: 'left' | 'right';
  gender?: string | null;
  origin?: string | null;
  style?: string[] | null;
};

export async function getNames(limit = 200): Promise<NameRecord[]> {
  const { data, error } = await supabase
    .from('names')
    .select('id,name,gender,origin,meaning,style_tags,popularity_score')
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch names: ${error.message}`);
  }

  return (data ?? []) as NameRecord[];
}

export async function getNamesByIds(ids: string[]): Promise<NameRecord[]> {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('names')
    .select('id,name,gender,origin,meaning,style_tags,popularity_score')
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to fetch names by ids: ${error.message}`);
  }

  return (data ?? []) as NameRecord[];
}

export async function getSwipedBabyNameIds(roomId: string, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('swipes')
    .select('baby_name_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .not('baby_name_id', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch swiped name ids: ${error.message}`);
  }

  return [...new Set((data ?? []).map((row: { baby_name_id: string | null }) => row.baby_name_id).filter(Boolean) as string[])];
}
