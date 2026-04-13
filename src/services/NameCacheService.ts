// ============================================================
// NameMatch – NameCacheService
//
// AsyncStorage-backed cache with TTL.
// Uses a stale-while-revalidate pattern: returns cached data
// immediately and triggers a background refresh if stale.
//
// Cache key format:  nc:{providerId}:{queryHash}
// TTL defaults by source:
//   local_seed   → never expires (static data)
//   supabase     → 6 hours
//   external     → 24 hours
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NormalizedNameRecord } from './nameTypes';

const PREFIX = 'nc:';

const DEFAULT_TTL_MS: Record<string, number> = {
  local_seed: Infinity,
  supabase: 6 * 60 * 60 * 1000,    // 6 hours
  external: 24 * 60 * 60 * 1000,   // 24 hours
  default: 4 * 60 * 60 * 1000,     // 4 hours
};

interface CacheEntry {
  data: NormalizedNameRecord[];
  cachedAt: number;
  ttlMs: number;
  providerId: string;
}

export class NameCacheService {
  private _memory = new Map<string, CacheEntry>();

  /** Hash a query object into a short string key */
  private _hashQuery(providerId: string, query: Record<string, unknown>): string {
    const sorted = Object.keys(query)
      .sort()
      .map((k) => `${k}=${JSON.stringify(query[k])}`)
      .join('&');
    return `${PREFIX}${providerId}:${sorted}`;
  }

  private _ttl(providerId: string): number {
    return DEFAULT_TTL_MS[providerId] ?? DEFAULT_TTL_MS.default;
  }

  private _isExpired(entry: CacheEntry): boolean {
    if (entry.ttlMs === Infinity) return false;
    return Date.now() - entry.cachedAt > entry.ttlMs;
  }

  /**
   * Read from memory first, then AsyncStorage.
   * Returns { data, isStale } so callers can revalidate.
   */
  async get(
    providerId: string,
    query: Record<string, unknown>,
  ): Promise<{ data: NormalizedNameRecord[]; isStale: boolean } | null> {
    const key = this._hashQuery(providerId, query);

    // Check memory cache first (fastest)
    const mem = this._memory.get(key);
    if (mem) {
      return { data: mem.data, isStale: this._isExpired(mem) };
    }

    // Check AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      const entry: CacheEntry = JSON.parse(raw);
      this._memory.set(key, entry); // warm memory cache
      return { data: entry.data, isStale: this._isExpired(entry) };
    } catch {
      return null;
    }
  }

  /** Write to both memory and AsyncStorage */
  async set(
    providerId: string,
    query: Record<string, unknown>,
    data: NormalizedNameRecord[],
  ): Promise<void> {
    const key = this._hashQuery(providerId, query);
    const entry: CacheEntry = {
      data,
      cachedAt: Date.now(),
      ttlMs: this._ttl(providerId),
      providerId,
    };

    this._memory.set(key, entry);

    try {
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (err) {
      // AsyncStorage can fail on quota exceeded — memory cache still works
      console.warn('[NameCacheService] AsyncStorage write failed:', err);
    }
  }

  /** Invalidate a specific key */
  async invalidate(providerId: string, query: Record<string, unknown>): Promise<void> {
    const key = this._hashQuery(providerId, query);
    this._memory.delete(key);
    try { await AsyncStorage.removeItem(key); } catch { /* ignore */ }
  }

  /** Purge all name cache entries (e.g., after user logs out or region changes) */
  async purgeAll(): Promise<void> {
    this._memory.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(PREFIX));
      if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
    } catch (err) {
      console.warn('[NameCacheService] purgeAll failed:', err);
    }
  }
}

export const nameCache = new NameCacheService();
