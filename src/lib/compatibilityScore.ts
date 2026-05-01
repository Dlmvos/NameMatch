/**
 * Couple taste compatibility (v1) from room-scoped swipe rows.
 * Pure: no I/O. See product spec: Jaccard on mutual likes + (1 - disagreement) on codetermined names.
 */

export type RoomSwipeRow = {
  user_id: string;
  name_id: string;
  direction: 'left' | 'right';
};

export type CompatibilityMetrics = {
  /** |U| — names both users have rated in this room */
  codeterminedCount: number;
  /** |R ∩ R′| */
  sharedLikes: number;
  /** Jaccard(R, R′), 0 when both like-sets empty */
  overlap: number;
  /** D / |U| when |U| > 0, else 0 */
  disagreementRate: number;
  /** round(100 * (0.7 * overlap + 0.3 * (1 - disagreementRate))) */
  compatibility: number;
};

function swipeMapForUser(rows: RoomSwipeRow[], userId: string): Map<string, 'left' | 'right'> {
  const m = new Map<string, 'left' | 'right'>();
  for (const r of rows) {
    if (r.user_id !== userId) continue;
    if (r.direction !== 'left' && r.direction !== 'right') continue;
    m.set(r.name_id, r.direction);
  }
  return m;
}

function likedNameIds(map: Map<string, 'left' | 'right'>): Set<string> {
  const out = new Set<string>();
  for (const [id, d] of map) {
    if (d === 'right') out.add(id);
  }
  return out;
}

/**
 * @param rows All swipes for the room (callers typically fetch with room_id filter).
 * @param userAId First room member (order-free for the formula).
 * @param userBId Second room member.
 */
export function computeCompatibilityFromSwipes(
  rows: RoomSwipeRow[],
  userAId: string,
  userBId: string,
): CompatibilityMetrics | null {
  if (!userAId || !userBId || userAId === userBId) return null;

  const mapA = swipeMapForUser(rows, userAId);
  const mapB = swipeMapForUser(rows, userBId);

  const R = likedNameIds(mapA);
  const Rp = likedNameIds(mapB);

  let sharedLikes = 0;
  for (const id of R) {
    if (Rp.has(id)) sharedLikes += 1;
  }

  const union = new Set<string>([...R, ...Rp]);
  const overlap = union.size === 0 ? 0 : sharedLikes / union.size;

  const keysA = new Set(mapA.keys());
  const keysB = new Set(mapB.keys());
  let codeterminedCount = 0;
  let D = 0;
  for (const nameId of keysA) {
    if (!keysB.has(nameId)) continue;
    codeterminedCount += 1;
    const da = mapA.get(nameId)!;
    const db = mapB.get(nameId)!;
    if ((da === 'right' && db === 'left') || (da === 'left' && db === 'right')) {
      D += 1;
    }
  }

  const disagreementRate = codeterminedCount > 0 ? D / codeterminedCount : 0;
  const compatibility = Math.round(100 * (0.7 * overlap + 0.3 * (1 - disagreementRate)));

  return {
    codeterminedCount,
    sharedLikes,
    overlap,
    disagreementRate,
    compatibility,
  };
}

/** Minimum codetermined names before showing a hard percentage (product rule). */
export const COMPATIBILITY_MIN_CODETERMINED = 10 as const;
