import { computeCompatibilityFromSwipes, type CompatibilityMetrics, type RoomSwipeRow } from '../lib/compatibilityScore';
import { supabase } from '../lib/supabase';

/**
 * Loads room swipes visible to the caller (RLS) and computes v1 compatibility between two members.
 */
export async function fetchRoomCompatibilityMetrics(
  roomId: string,
  user1Id: string,
  user2Id: string,
): Promise<CompatibilityMetrics | null> {
  const { data, error } = await supabase
    .from('swipes')
    .select('user_id, name_id, direction')
    .eq('room_id', roomId);

  if (error) {
    console.warn('[compatibilitySwipeService]', error.message);
    return null;
  }

  const rows = (data ?? []) as RoomSwipeRow[];
  return computeCompatibilityFromSwipes(rows, user1Id, user2Id);
}
