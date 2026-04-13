// ============================================================
// NameMatch – NameSourceService
//
// Orchestrates all name providers using a priority cascade.
// Implements stale-while-revalidate caching via NameCacheService.
//
// Provider priority (lower = higher priority):
//   ExternalNameProvider  → 5   (live public data, when wired)
//   SupabaseNameProvider  → 10  (enriched DB, primary source)
//   LocalSeedProvider     → 99  (static fallback, always works)
//
// Fetch strategy:
//   1. Return cache hit immediately (mark isStale if needed)
//   2. If stale → trigger background revalidation (no await)
//   3. If no cache → run provider cascade, cache result
//   4. Merge results from multiple providers (Supabase wins on id conflict)
//   5. Always falls back to LocalSeedProvider — never returns []
//      unless ALL providers are broken AND cache is empty
// ============================================================

import { nameCache } from './NameCacheService';
import { localSeedProvider } from './providers/LocalSeedProvider';
import { supabaseNameProvider } from './providers/SupabaseNameProvider';
import { externalNameProvider } from './providers/ExternalNameProvider';
import type { INameProvider, NameQuery } from './providers/INameProvider';
import type { NormalizedNameRecord } from './nameTypes';

/** Providers sorted ascending by priority (lowest = highest priority) */
const PROVIDERS: INameProvider[] = [
  externalNameProvider,   // priority 5
  supabaseNameProvider,   // priority 10
  localSeedProvider,      // priority 99
].sort((a, b) => a.priority - b.priority);

/** Key used for full-pool cache (no query filters) */
const POOL_QUERY: Record<string, unknown> = { _type: 'full_pool' };

export class NameSourceService {
  // ── Singleton revalidation guard ──────────────────────────
  private _revalidating = new Set<string>();

  // ──────────────────────────────────────────────────────────
  // fetchNames
  // ──────────────────────────────────────────────────────────

  /**
   * Fetch names matching the given query.
   *
   * Flow:
   *  cache hit (fresh)  → return immediately
   *  cache hit (stale)  → return immediately + revalidate in background
   *  cache miss         → cascade providers, write cache, return
   */
  async fetchNames(query: NameQuery = {}): Promise<NormalizedNameRecord[]> {
    const cacheKey = this._queryCacheKey(query);

    // 1. Check cache across providers (use first provider that has data)
    for (const provider of PROVIDERS) {
      const cached = await nameCache.get(provider.providerId, { ...query, _cacheKey: cacheKey });
      if (cached) {
        if (cached.isStale) {
          this._revalidateInBackground(provider, query, cacheKey);
        }
        return cached.data;
      }
    }

    // 2. Cache miss — run cascade
    return this._cascadeAndCache(query, cacheKey);
  }

  // ──────────────────────────────────────────────────────────
  // fetchById
  // ──────────────────────────────────────────────────────────

  /**
   * Fetch a single name by ID. Tries providers in priority order.
   * Falls back to LocalSeed (in-memory lookup) as final safety net.
   */
  async fetchById(id: string): Promise<NormalizedNameRecord | null> {
    for (const provider of PROVIDERS) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        const result = await provider.fetchById(id);
        if (result) return result;
      } catch (err) {
        console.warn(`[NameSourceService] fetchById error in ${provider.providerId}:`, err);
      }
    }
    return null;
  }

  // ──────────────────────────────────────────────────────────
  // getFullPool
  // ──────────────────────────────────────────────────────────

  /**
   * Return the complete unfiltered name pool — used by the recommendation
   * pipeline to score and rank candidates before applying filters.
   *
   * Merges Supabase + LocalSeed so we always have a rich dataset.
   * External provider contributes when available.
   * Results are deduped by normalizedName, higher-priority provider wins.
   */
  async getFullPool(): Promise<NormalizedNameRecord[]> {
    // Check full-pool cache against any provider
    for (const provider of PROVIDERS) {
      const cached = await nameCache.get(provider.providerId, POOL_QUERY);
      if (cached) {
        if (cached.isStale) {
          this._revalidatePoolInBackground();
        }
        return cached.data;
      }
    }

    return this._buildFullPool();
  }

  // ──────────────────────────────────────────────────────────
  // invalidate / purge
  // ──────────────────────────────────────────────────────────

  /** Invalidate cache for a specific query across all providers */
  async invalidate(query: NameQuery = {}): Promise<void> {
    const cacheKey = this._queryCacheKey(query);
    await Promise.all(
      PROVIDERS.map((p) => nameCache.invalidate(p.providerId, { ...query, _cacheKey: cacheKey })),
    );
  }

  /** Purge everything — call after logout or region switch */
  async purgeAll(): Promise<void> {
    await nameCache.purgeAll();
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  /** Run the provider cascade and write results to cache */
  private async _cascadeAndCache(
    query: NameQuery,
    cacheKey: string,
  ): Promise<NormalizedNameRecord[]> {
    const allResults: NormalizedNameRecord[][] = [];

    for (const provider of PROVIDERS) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        const results = await provider.fetchNames(query);
        if (results.length > 0) {
          allResults.push(results);
          // Cache per-provider result
          await nameCache.set(provider.providerId, { ...query, _cacheKey: cacheKey }, results);
        }
      } catch (err) {
        console.warn(`[NameSourceService] cascade error in ${provider.providerId}:`, err);
      }
    }

    // Always ensure LocalSeed is included as final safety net
    if (allResults.length === 0) {
      try {
        const seedResults = await localSeedProvider.fetchNames(query);
        allResults.push(seedResults);
        await nameCache.set(localSeedProvider.providerId, { ...query, _cacheKey: cacheKey }, seedResults);
      } catch {
        // Nothing we can do
      }
    }

    return this._mergeResults(allResults);
  }

  /**
   * Merge results from multiple providers.
   * Higher-priority providers win on id conflict.
   * Since PROVIDERS is sorted ascending priority (low = high priority),
   * we iterate in reverse so higher-priority overwrites lower-priority.
   */
  private _mergeResults(resultSets: NormalizedNameRecord[][]): NormalizedNameRecord[] {
    const byId = new Map<string, NormalizedNameRecord>();
    const byNormalizedName = new Map<string, NormalizedNameRecord>();

    // Iterate reversed so highest-priority provider overwrites
    for (const set of [...resultSets].reverse()) {
      for (const record of set) {
        byId.set(record.id, record);
        byNormalizedName.set(record.normalizedName, record);
      }
    }

    // Prefer id-keyed map, fall back to name-keyed dedup
    const seen = new Set<string>();
    const merged: NormalizedNameRecord[] = [];

    for (const record of byId.values()) {
      if (!seen.has(record.normalizedName)) {
        seen.add(record.normalizedName);
        merged.push(record);
      }
    }

    return merged;
  }

  /** Build the full unfiltered pool from all providers and cache it */
  private async _buildFullPool(): Promise<NormalizedNameRecord[]> {
    const allResults: NormalizedNameRecord[][] = [];

    for (const provider of PROVIDERS) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        const results = await provider.fetchNames({});
        if (results.length > 0) {
          allResults.push(results);
          await nameCache.set(provider.providerId, POOL_QUERY, results);
        }
      } catch (err) {
        console.warn(`[NameSourceService] getFullPool error in ${provider.providerId}:`, err);
      }
    }

    // Guarantee LocalSeed is always in the pool
    if (allResults.length === 0) {
      const seed = await localSeedProvider.fetchNames({});
      allResults.push(seed);
      await nameCache.set(localSeedProvider.providerId, POOL_QUERY, seed);
    }

    return this._mergeResults(allResults);
  }

  /** Fire-and-forget revalidation for a specific query */
  private _revalidateInBackground(
    _provider: INameProvider,
    query: NameQuery,
    cacheKey: string,
  ): void {
    const guard = `query:${cacheKey}`;
    if (this._revalidating.has(guard)) return;
    this._revalidating.add(guard);

    this._cascadeAndCache(query, cacheKey)
      .catch((err) => console.warn('[NameSourceService] background revalidation failed:', err))
      .finally(() => this._revalidating.delete(guard));
  }

  /** Fire-and-forget revalidation for the full pool */
  private _revalidatePoolInBackground(): void {
    const guard = 'full_pool';
    if (this._revalidating.has(guard)) return;
    this._revalidating.add(guard);

    this._buildFullPool()
      .catch((err) => console.warn('[NameSourceService] pool revalidation failed:', err))
      .finally(() => this._revalidating.delete(guard));
  }

  /**
   * Create a stable string key for a query object.
   * Sorts keys so { gender: 'boy', region: 'US' } and
   * { region: 'US', gender: 'boy' } produce the same key.
   */
  private _queryCacheKey(query: NameQuery): string {
    return Object.keys(query as Record<string, unknown>)
      .sort()
      .map((k) => `${k}=${JSON.stringify((query as Record<string, unknown>)[k])}`)
      .join('&');
  }
}

/** Singleton — one per app session */
export const nameSourceService = new NameSourceService();
