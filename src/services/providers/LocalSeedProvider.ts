// ============================================================
// NameMatch – LocalSeedProvider
//
// Wraps src/data/names.ts (static array) as a NameProvider.
// Always available — it's the final fallback in the cascade.
// ============================================================

import { ALL_NAMES, filterByGender } from '../../data/names';
import { adaptBabyName } from '../nameTypes';
import type { NormalizedNameRecord } from '../nameTypes';
import type { INameProvider, NameQuery } from './INameProvider';

export class LocalSeedProvider implements INameProvider {
  readonly providerId = 'local_seed';
  readonly priority = 99; // lowest priority — always the fallback

  /** Pre-adapted at import time (static data, no point re-adapting) */
  private readonly _records: NormalizedNameRecord[];

  constructor() {
    this._records = ALL_NAMES.map(adaptBabyName);
  }

  async isAvailable(): Promise<boolean> {
    return true; // static data, always available
  }

  async fetchNames(query: NameQuery = {}): Promise<NormalizedNameRecord[]> {
    let pool = this._records;

    // Filter by region
    if (query.region && query.region !== 'WORLDWIDE') {
      pool = pool.filter(
        (n) => n.region === query.region || (query.includeWorldwide !== false && n.is_worldwide),
      );
    }

    // Filter by gender
    if (query.gender && query.gender !== 'both') {
      pool = pool.filter((n) => n.gender === query.gender || n.gender === 'neutral');
    }

    // Text search
    if (query.search) {
      const q = query.search.toLowerCase();
      pool = pool.filter(
        (n) =>
          n.normalizedName.includes(q) ||
          (n.origin?.toLowerCase().includes(q) ?? false) ||
          (n.meaning?.toLowerCase().includes(q) ?? false),
      );
    }

    // Pagination
    const offset = query.offset ?? 0;
    const limit = query.limit ?? pool.length;

    return pool.slice(offset, offset + limit);
  }

  async fetchById(id: string): Promise<NormalizedNameRecord | null> {
    return this._records.find((n) => n.id === id) ?? null;
  }

  /** Expose all records for in-memory operations (e.g. similarity engine) */
  get allRecords(): NormalizedNameRecord[] {
    return this._records;
  }
}

/** Singleton — one instance per app session */
export const localSeedProvider = new LocalSeedProvider();
