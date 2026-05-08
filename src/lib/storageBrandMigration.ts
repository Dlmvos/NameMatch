import AsyncStorage from '@react-native-async-storage/async-storage';

const OLD_STORAGE_PREFIX = 'namematch:';
const NEW_STORAGE_PREFIX = 'namenest:';
const MIGRATION_DONE_KEY = 'namenest:storage_brand_migration_v1_done';

const LEGACY_PREF_BASES = ['country_pref', 'residence_country', 'language_pref'] as const;

function isUnscopedLegacyPrefKey(oldKey: string): boolean {
  for (const base of LEGACY_PREF_BASES) {
    if (oldKey === `${OLD_STORAGE_PREFIX}${base}`) return true;
  }
  return false;
}

/**
 * One-time copy of `namematch:*` → `namenest:*` for user-scoped keys only.
 * Unscoped legacy pref keys (no user segment) are dropped so they never attach to a new account.
 * After the attempt, `namematch:*` keys are removed; re-runs are no-ops.
 */
export async function ensureNameNestStorageMigration(): Promise<void> {
  const done = await AsyncStorage.getItem(MIGRATION_DONE_KEY).catch(() => null);
  if (done === '1') return;

  const keys = await AsyncStorage.getAllKeys();
  const oldKeys = keys.filter((key) => key.startsWith(OLD_STORAGE_PREFIX));
  const pairs = oldKeys.length > 0 ? await AsyncStorage.multiGet(oldKeys) : [];
  const nextPairs: [string, string][] = [];

  for (const [oldKey, value] of pairs) {
    if (value === null) continue;
    if (isUnscopedLegacyPrefKey(oldKey)) continue;
    const newKey = `${NEW_STORAGE_PREFIX}${oldKey.slice(OLD_STORAGE_PREFIX.length)}`;
    if (keys.includes(newKey)) continue;
    nextPairs.push([newKey, value]);
  }

  if (nextPairs.length > 0) {
    await AsyncStorage.multiSet(nextPairs);
  }
  if (oldKeys.length > 0) {
    await AsyncStorage.multiRemove(oldKeys);
  }

  const keysAfter = await AsyncStorage.getAllKeys();
  const orphanUnscoped = LEGACY_PREF_BASES.map((b) => `${NEW_STORAGE_PREFIX}${b}`).filter((k) =>
    keysAfter.includes(k),
  );
  if (orphanUnscoped.length > 0) {
    await AsyncStorage.multiRemove(orphanUnscoped);
  }

  await AsyncStorage.setItem(MIGRATION_DONE_KEY, '1').catch(() => {});
}
