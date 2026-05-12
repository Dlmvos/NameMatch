import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const LARGE_VALUE_THRESHOLD = 1800;
const FALLBACK_PREFIX = '__rn_secure_store_fallback__:';

function fallbackStorageKey(key: string): string {
  return `${FALLBACK_PREFIX}${key}`;
}

export const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const secure = await SecureStore.getItemAsync(key);
      if (secure != null) return secure;
    } catch {
      /* read fallback below */
    }
    try {
      return await AsyncStorage.getItem(fallbackStorageKey(key));
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const fbKey = fallbackStorageKey(key);

    if (value.length > LARGE_VALUE_THRESHOLD) {
      await AsyncStorage.setItem(fbKey, value);
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        /* SecureStore may be unavailable; value is in AsyncStorage */
      }
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(fbKey);
    } catch {
      await AsyncStorage.setItem(fbKey, value);
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        /* best-effort cleanup */
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    const fbKey = fallbackStorageKey(key);
    await Promise.all([
      SecureStore.deleteItemAsync(key).catch(() => {}),
      AsyncStorage.removeItem(fbKey).catch(() => {}),
    ]);
  },
};
