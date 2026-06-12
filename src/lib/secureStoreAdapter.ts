import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage adapter for Supabase's auth session. The session blob (access JWT
 * + long-lived refresh token + user metadata) routinely exceeds the ~2 KB
 * iOS Keychain / Android SecureStore single-entry limit, so we can't just
 * call `SecureStore.setItemAsync(key, value)` and be done.
 *
 * Prior implementation fell back to **unencrypted** AsyncStorage above 1800
 * chars, which meant the refresh token spent its whole life in plaintext on
 * disk — accessible via rooted/jailbroken devices, unencrypted backups, or
 * other apps with storage access. That was audit finding S1 (2026-06-12).
 *
 * The new design chunks oversized values into sub-cap SecureStore entries so
 * the encryption guarantee holds end-to-end. Layout:
 *
 *   <key>              single-entry path (fast / backwards-compat read)
 *   <key>__c__meta     decimal-string chunk count for the chunked path
 *   <key>__c__0..N-1   the chunks themselves, each ≤ SECURE_STORE_CHUNK_SIZE
 *
 * The legacy plaintext fallback prefix is still **read** so existing users
 * don't get signed out, but `setItem` migrates the value into the chunked
 * SecureStore path on the next write and deletes the AsyncStorage copy.
 */

// Conservative cap for iOS Keychain (~2 KB hard limit). 1700 leaves headroom
// for key/metadata overhead inside the keychain entry.
const SECURE_STORE_CHUNK_SIZE = 1700;

// Read-only — present so existing installs upgrade cleanly; never written.
const LEGACY_FALLBACK_PREFIX = '__rn_secure_store_fallback__:';

const CHUNK_META_SUFFIX = '__c__meta';
const chunkKey = (key: string, i: number): string => `${key}__c__${i}`;
const legacyFallbackKey = (key: string): string => `${LEGACY_FALLBACK_PREFIX}${key}`;

async function readChunkedSecure(key: string): Promise<string | null> {
  let meta: string | null = null;
  try {
    meta = await SecureStore.getItemAsync(key + CHUNK_META_SUFFIX);
  } catch {
    return null;
  }
  if (meta == null) return null;

  const count = Number.parseInt(meta, 10);
  // Cap chunk count defensively. 1000 × 1700 chars = ~1.6 MB, well above any
  // realistic Supabase session size and below anything that'd thrash storage.
  if (!Number.isInteger(count) || count <= 0 || count > 1000) return null;

  const parts: string[] = new Array(count);
  for (let i = 0; i < count; i++) {
    try {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      // Any missing chunk → treat the whole value as absent; caller will
      // recover via re-auth rather than rebuild a corrupt session.
      if (part == null) return null;
      parts[i] = part;
    } catch {
      return null;
    }
  }
  return parts.join('');
}

async function clearChunkedSecure(key: string, knownCount?: number): Promise<void> {
  let count = knownCount;
  if (count == null) {
    try {
      const meta = await SecureStore.getItemAsync(key + CHUNK_META_SUFFIX);
      if (meta != null) {
        const n = Number.parseInt(meta, 10);
        if (Number.isInteger(n) && n > 0 && n <= 1000) count = n;
      }
    } catch {
      /* nothing to clear */
    }
  }
  const deletions: Promise<unknown>[] = [
    SecureStore.deleteItemAsync(key + CHUNK_META_SUFFIX).catch(() => {}),
  ];
  if (count != null) {
    for (let i = 0; i < count; i++) {
      deletions.push(SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => {}));
    }
  }
  await Promise.all(deletions);
}

async function writeChunkedSecure(key: string, value: string): Promise<void> {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += SECURE_STORE_CHUNK_SIZE) {
    chunks.push(value.slice(i, i + SECURE_STORE_CHUNK_SIZE));
  }
  // Write payload chunks first, meta last. Meta is the read trigger; if a
  // crash interleaves the writes, a partial state fails meta or count and
  // the caller treats the session as missing — safer than reconstructing a
  // half-written blob.
  for (let i = 0; i < chunks.length; i++) {
    await SecureStore.setItemAsync(chunkKey(key, i), chunks[i]);
  }
  await SecureStore.setItemAsync(key + CHUNK_META_SUFFIX, String(chunks.length));
}

export const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    // Fast path: single small SecureStore entry (covers small values + the
    // SDK's older writes pre-chunking migration).
    try {
      const secure = await SecureStore.getItemAsync(key);
      if (secure != null) return secure;
    } catch {
      /* fall through to chunked / legacy paths */
    }

    // Encrypted chunked path — current write target for large values.
    const chunked = await readChunkedSecure(key);
    if (chunked != null) return chunked;

    // Legacy plaintext AsyncStorage fallback — read once on devices upgrading
    // from the pre-fix build. The next setItem rewrites into chunks and
    // deletes the plaintext copy.
    try {
      return await AsyncStorage.getItem(legacyFallbackKey(key));
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const legacyKey = legacyFallbackKey(key);

    if (value.length <= SECURE_STORE_CHUNK_SIZE) {
      // Small enough for a single Keychain entry. Clean up any prior chunked
      // state + the legacy plaintext blob in one pass.
      try {
        await SecureStore.setItemAsync(key, value);
        await clearChunkedSecure(key);
        await AsyncStorage.removeItem(legacyKey).catch(() => {});
        return;
      } catch {
        // Single-entry write failed (rare — usually means SecureStore is
        // disabled entirely). Fall through to chunked write so we at least
        // try the secondary path. We DO NOT silently drop to plaintext.
      }
    }

    try {
      // Cleanup-then-write so the chunk-count is always consistent with the
      // chunks actually present (otherwise a shrink could leave orphaned
      // chunks readChunkedSecure would happily glue back on).
      await clearChunkedSecure(key);
      await writeChunkedSecure(key, value);
      await SecureStore.deleteItemAsync(key).catch(() => {});
      await AsyncStorage.removeItem(legacyKey).catch(() => {});
    } catch (err) {
      // Hard failure across both SecureStore paths. We deliberately do NOT
      // write to AsyncStorage in plaintext (audit S1, 2026-06-12). Surface
      // in dev so the failure is visible; in prod the caller observes a
      // missing session on next read and re-authenticates.
      if (__DEV__) {
        console.warn('[secureStoreAdapter] setItem failed for', key, err);
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    const legacyKey = legacyFallbackKey(key);
    await Promise.all([
      SecureStore.deleteItemAsync(key).catch(() => {}),
      clearChunkedSecure(key),
      AsyncStorage.removeItem(legacyKey).catch(() => {}),
    ]);
  },
};
