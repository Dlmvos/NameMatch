import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsService } from '../services/AnalyticsService';

/** Legacy global key — superseded by {@link matchNotesStorageKey}. */
export const MATCH_NOTES_LEGACY_KEY = 'namenest:match_notes';

/** Legacy global key — superseded by {@link curatedUnlocksStorageKey}. */
export const CURATED_UNLOCKS_LEGACY_KEY = 'AI_PACK_UNLOCKS';

export function matchNotesStorageKey(userId: string): string {
  return `namenest:match_notes:${userId}`;
}

export function curatedUnlocksStorageKey(userId: string): string {
  return `namenest:curated_pack_unlocks:${userId}`;
}

function safeParseRecord(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Merge legacy global notes into the signed-out user's scoped key and drop the legacy bucket. */
async function migrateLegacyMatchNotes(userId: string): Promise<void> {
  const legacyRaw = await AsyncStorage.getItem(MATCH_NOTES_LEGACY_KEY).catch(() => null);
  if (!legacyRaw) return;
  const scopedKey = matchNotesStorageKey(userId);
  const scopedRaw = await AsyncStorage.getItem(scopedKey).catch(() => null);
  const legacyObj = safeParseRecord(legacyRaw);
  const scopedObj = scopedRaw ? safeParseRecord(scopedRaw) : {};
  const merged = { ...legacyObj, ...scopedObj };
  await AsyncStorage.setItem(scopedKey, JSON.stringify(merged)).catch(() => {});
  await AsyncStorage.removeItem(MATCH_NOTES_LEGACY_KEY).catch(() => {});
}

/** Merge legacy curated unlock map into scoped key and drop legacy. */
async function migrateLegacyCuratedUnlocks(userId: string): Promise<void> {
  const legacyRaw = await AsyncStorage.getItem(CURATED_UNLOCKS_LEGACY_KEY).catch(() => null);
  if (!legacyRaw) return;
  const scopedKey = curatedUnlocksStorageKey(userId);
  const scopedRaw = await AsyncStorage.getItem(scopedKey).catch(() => null);
  const legacyObj = safeParseRecord(legacyRaw);
  const scopedObj = scopedRaw ? safeParseRecord(scopedRaw) : {};
  const merged = { ...legacyObj, ...scopedObj };
  await AsyncStorage.setItem(scopedKey, JSON.stringify(merged)).catch(() => {});
  await AsyncStorage.removeItem(CURATED_UNLOCKS_LEGACY_KEY).catch(() => {});
}

/** Clears analytics queue and assigns legacy local buckets to `userId` before session clears (same device). */
export async function prepareLocalStorageForSignOut(userId: string | null): Promise<void> {
  await AnalyticsService.clearEvents().catch(() => {});
  if (userId) {
    await migrateLegacyMatchNotes(userId).catch(() => {});
    await migrateLegacyCuratedUnlocks(userId).catch(() => {});
    return;
  }
  await AsyncStorage.removeItem(MATCH_NOTES_LEGACY_KEY).catch(() => {});
  await AsyncStorage.removeItem(CURATED_UNLOCKS_LEGACY_KEY).catch(() => {});
}
