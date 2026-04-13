// ============================================================
// NameMatch – SupabaseNameProvider
//
// Fetches enriched names from Supabase `names` table.
// Higher priority than LocalSeed — if available, prefer this.
// Falls back gracefully (returns [] on error).
// ============================================================

import { supabase } from '../../lib/supabase';
import { adaptNameRecord } from '../nameTypes';
import type { NormalizedNameRecord } from '../nameTypes';
import type { INameProvider, NameQuery } from './INameProvider';

// Supabase row shape (mirrors the `names` table)
interface SupabaseNameRow {
  id: string;
  name: string;
  gender: string | null;
  origin: string | null;
  meaning: string | null;
  style_tags: string[] | null;
  popularity_score: number | null;
  pronunciation?: string | null;
  popularity_rank?: number | null;
  trend_direction?: string | null;
  language?: string | null;
  country?: string | null;
  region?: string | null;
  is_worldwide?: boolean | null;
  variants?: string[] | null;
}

export class SupabaseNameProvider implements INameProvider {
  readonly providerId = 'supabase';
  readonly priority = 10; // higher priority than local seed

  async isAvailable(): Promise<boolean> {
    // Quick check: can we reach Supabase?
    // We don't want to make a full network call here, so we rely on
    // session state. Treat as available if supabase client exists.
    try {
      return !!supabase;
    } catch {
      return false;
    }
  }

  async fetchNames(query: NameQuery = {}): Promise<NormalizedNameRecord[]> {
    try {
      let q = supabase
        .from('names')
        .select(
          'id,name,gender,origin,meaning,style_tags,popularity_score,' +
          'pronunciation,popularity_rank,trend_direction,language,country,region,is_worldwide,variants',
        );

      if (query.gender && query.gender !== 'both') {
        q = q.or(`gender.eq.${query.gender},gender.eq.neutral`);
      }

      if (query.region && query.region !== 'WORLDWIDE') {
        // Include region-specific AND worldwide names
        q = q.or(`region.eq.${query.region},is_worldwide.eq.true`);
      }

      if (query.search) {
        q = q.ilike('name', `%${query.search}%`);
      }

      q = q.limit(query.limit ?? 500);

      if (query.offset) {
        q = q.range(query.offset, (query.offset) + (query.limit ?? 500) - 1);
      }

      const { data, error } = await q;

      if (error) {
        console.warn('[SupabaseNameProvider] fetchNames error:', error.message);
        return [];
      }

      // data is GenericStringError[] when no Database generic is provided to createClient.
      // We own the select column list and know the shape, so widen via unknown then narrow.
      return ((data ?? []) as unknown as SupabaseNameRow[]).map((row) =>
        this._mapRow(row, query.region),
      );
    } catch (err) {
      console.warn('[SupabaseNameProvider] unexpected error:', err);
      return [];
    }
  }

  async fetchById(id: string): Promise<NormalizedNameRecord | null> {
    try {
      const { data, error } = await supabase
        .from('names')
        .select(
          'id,name,gender,origin,meaning,style_tags,popularity_score,' +
          'pronunciation,popularity_rank,trend_direction,language,country,region,is_worldwide,variants',
        )
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;

      return this._mapRow(data as unknown as SupabaseNameRow);
    } catch {
      return null;
    }
  }

  private _mapRow(row: SupabaseNameRow, queryRegion?: string): NormalizedNameRecord {
    const base = adaptNameRecord(
      {
        id: row.id,
        name: row.name,
        gender: row.gender,
        origin: row.origin,
        meaning: row.meaning,
        style_tags: row.style_tags,
        popularity_score: row.popularity_score,
      },
      row.region ?? queryRegion ?? 'WORLDWIDE',
    );

    // Override with richer Supabase fields where available
    return {
      ...base,
      pronunciation: row.pronunciation ?? null,
      popularityRank: row.popularity_rank ?? null,
      popularityScore: row.popularity_score ?? null,
      popularity_score: row.popularity_score ?? null,
      trendDirection: this._mapTrend(row.trend_direction),
      language: row.language ?? base.language,
      country: row.country ?? null,
      is_worldwide: row.is_worldwide ?? base.is_worldwide,
      variants: row.variants ?? [],
      source: 'supabase',
    };
  }

  private _mapTrend(t: string | null | undefined) {
    if (t === 'rising') return 'rising' as const;
    if (t === 'stable') return 'stable' as const;
    if (t === 'falling') return 'falling' as const;
    if (t === 'classic') return 'classic' as const;
    return 'unknown' as const;
  }
}

/** Singleton */
export const supabaseNameProvider = new SupabaseNameProvider();
