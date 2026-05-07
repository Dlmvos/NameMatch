import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'BABINOM_MILESTONE_CELEBRATED';

/** Milestones that trigger a celebration, in ascending order. */
export const MILESTONES = [1, 5, 10, 25] as const;
export type Milestone = (typeof MILESTONES)[number];

/** Progress copy key suffix for the *next* milestone after the one just reached. */
export function nextMilestoneAfter(current: Milestone): Milestone | null {
  const idx = MILESTONES.indexOf(current);
  return idx >= 0 && idx < MILESTONES.length - 1 ? MILESTONES[idx + 1] : null;
}

/**
 * Returns the milestone that `matchCount` just crossed, if it hasn't been
 * celebrated yet on this device.  Returns `null` otherwise.
 *
 * Thread-safe: read → check → write is a single async sequence and the
 * caller (RoomContext) serialises calls via `handleConfirmedMatch`.
 */
export async function checkMilestone(
  roomId: string,
  matchCount: number,
): Promise<Milestone | null> {
  const hit = MILESTONES.find((m) => matchCount === m);
  if (!hit) return null;

  const celebrated = await loadCelebrated(roomId);
  if (celebrated.has(hit)) return null;

  celebrated.add(hit);
  await saveCelebrated(roomId, celebrated);
  return hit;
}

// ── persistence helpers ──

async function loadCelebrated(roomId: string): Promise<Set<number>> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}:${roomId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as number[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

async function saveCelebrated(roomId: string, set: Set<number>): Promise<void> {
  await AsyncStorage.setItem(
    `${STORAGE_KEY}:${roomId}`,
    JSON.stringify([...set]),
  ).catch(() => {});
}
