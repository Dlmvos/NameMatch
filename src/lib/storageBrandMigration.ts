import AsyncStorage from '@react-native-async-storage/async-storage';

const OLD_STORAGE_PREFIX = 'namematch:';
const NEW_STORAGE_PREFIX = 'namenest:';

/**
 * Copy old NameMatch-prefixed local keys to NameNest-prefixed keys.
 * This intentionally does not delete old keys, so rollback remains safe.
 */
export async function ensureNameNestStorageMigration(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const oldKeys = keys.filter((key) => key.startsWith(OLD_STORAGE_PREFIX));
  if (oldKeys.length === 0) return;

  const pairs = await AsyncStorage.multiGet(oldKeys);
  const nextPairs: [string, string][] = [];
  for (const [oldKey, value] of pairs) {
    if (value === null) continue;
    const newKey = `${NEW_STORAGE_PREFIX}${oldKey.slice(OLD_STORAGE_PREFIX.length)}`;
    if (keys.includes(newKey)) continue;
    nextPairs.push([newKey, value]);
  }

  if (nextPairs.length > 0) {
    await AsyncStorage.multiSet(nextPairs);
  }
}
