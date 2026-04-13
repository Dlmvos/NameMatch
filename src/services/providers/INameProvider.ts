// ============================================================
// NameMatch – INameProvider Interface
//
// All data providers implement this interface.
// NameSourceService uses this to cascade across providers.
// ============================================================

import type { NormalizedNameRecord } from '../nameTypes';

export interface NameQuery {
  gender?: 'boy' | 'girl' | 'neutral' | 'both';
  region?: string;
  limit?: number;
  offset?: number;
  search?: string;
  includeWorldwide?: boolean;
}

export interface INameProvider {
  /** Stable identifier for logging and cache key namespacing */
  readonly providerId: string;

  /**
   * Priority: lower wins (1 = highest priority).
   * NameSourceService tries in ascending priority order.
   */
  readonly priority: number;

  /**
   * Returns true if this provider can currently serve requests.
   * Fast check — no network call (check connectivity flag, env vars, etc.)
   */
  isAvailable(): Promise<boolean>;

  /**
   * Fetch a list of names matching the query.
   * Must never throw — return [] on error and log internally.
   */
  fetchNames(query?: NameQuery): Promise<NormalizedNameRecord[]>;

  /**
   * Fetch a single name by its ID.
   * Returns null if not found.
   */
  fetchById(id: string): Promise<NormalizedNameRecord | null>;
}
