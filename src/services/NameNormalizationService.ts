// ============================================================
// NameMatch – NameNormalizationService
//
// Applies enrichment and normalization to NormalizedNameRecord
// objects arriving from any provider.
//
// Responsibilities:
//   1. Fill missing fields from nameEnrichment.ts (curated map)
//   2. Compute phoneticKey (Soundex) if absent
//   3. Derive trendDirection from raw trend strings
//   4. Infer genderUsage from gender field
//   5. Populate tags from style_tags + origin + trend
//   6. Merge records from multiple sources without data loss
//   7. Mark lastUpdated if missing
// ============================================================

import { enrichName } from './nameEnrichment';
import { soundex, normalizeStr } from './nameTypes';
import type { NormalizedNameRecord, TrendDirection, GenderUsage } from './nameTypes';

export class NameNormalizationService {
  // ──────────────────────────────────────────────────────────
  // normalize (single record)
  // ──────────────────────────────────────────────────────────

  /**
   * Apply all enrichment and normalization steps to a single record.
   * Returns a new object — does not mutate in place.
   */
  normalize(record: NormalizedNameRecord): NormalizedNameRecord {
    const enriched = enrichName(record.displayName || record.name);

    return {
      ...record,

      // Phonetic key
      phoneticKey: record.phoneticKey ?? soundex(record.normalizedName || record.name),

      // Normalized name (lowercase, no diacritics)
      normalizedName: record.normalizedName || normalizeStr(record.displayName || record.name),

      // Trend direction — prefer record's own value, fall back to enrichment
      trendDirection: this._mergeTrend(record.trendDirection, enriched.trend),

      // Gender usage
      genderUsage: record.genderUsage ?? this._inferGenderUsage(record.gender),

      // Pronunciation — prefer DB, fall back to enrichment
      pronunciation: record.pronunciation ?? enriched.pronunciation ?? null,

      // Popularity rank — prefer DB, fall back to enrichment
      popularityRank: record.popularityRank ?? enriched.popularity_rank ?? null,

      // Variants — merge arrays
      variants: this._mergeVariants(record.variants, enriched.similar_names),

      // Tags — merge style_tags + computed tags
      tags: this._mergeTags(record),

      // Timestamp
      lastUpdated: record.lastUpdated || new Date().toISOString(),
    };
  }

  // ──────────────────────────────────────────────────────────
  // normalizeMany
  // ──────────────────────────────────────────────────────────

  /** Normalize a batch of records */
  normalizeMany(records: NormalizedNameRecord[]): NormalizedNameRecord[] {
    return records.map((r) => this.normalize(r));
  }

  // ──────────────────────────────────────────────────────────
  // merge (two records from different sources)
  // ──────────────────────────────────────────────────────────

  /**
   * Merge two records describing the same name from different sources.
   * `primary` takes precedence for non-null fields.
   * Arrays are unioned.
   */
  merge(primary: NormalizedNameRecord, secondary: NormalizedNameRecord): NormalizedNameRecord {
    return this.normalize({
      ...secondary,
      ...primary,

      // Merge arrays
      variants: this._mergeVariants(primary.variants, secondary.variants),
      tags: [...new Set([...(primary.tags ?? []), ...(secondary.tags ?? [])])],
      style_tags: [...new Set([...(primary.style_tags ?? []), ...(secondary.style_tags ?? [])])],

      // Prefer non-null fields from either record
      meaning: primary.meaning ?? secondary.meaning,
      origin: primary.origin ?? secondary.origin,
      pronunciation: primary.pronunciation ?? secondary.pronunciation,
      popularityRank: primary.popularityRank ?? secondary.popularityRank,
      popularityScore: primary.popularityScore ?? secondary.popularityScore,
      popularity_score: primary.popularity_score ?? secondary.popularity_score,
      trendDirection: primary.trendDirection !== 'unknown' ? primary.trendDirection : secondary.trendDirection,
      language: primary.language ?? secondary.language,
      country: primary.country ?? secondary.country,
      phoneticKey: primary.phoneticKey ?? secondary.phoneticKey,

      // Keep highest-quality source label
      source: this._betterSource(primary.source, secondary.source),
    });
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  private _mergeTrend(
    recorded: TrendDirection | undefined,
    enriched: string | undefined,
  ): TrendDirection {
    if (recorded && recorded !== 'unknown') return recorded;
    if (!enriched) return 'unknown';
    const map: Record<string, TrendDirection> = {
      rising: 'rising',
      stable: 'stable',
      falling: 'falling',
      classic: 'classic',
    };
    return map[enriched] ?? 'unknown';
  }

  private _inferGenderUsage(gender: 'boy' | 'girl' | 'neutral' | undefined): GenderUsage {
    if (gender === 'boy') return 'predominantly_male';
    if (gender === 'girl') return 'predominantly_female';
    return 'unisex';
  }

  private _mergeVariants(a: string[] | undefined, b: string[] | undefined): string[] {
    return [...new Set([...(a ?? []), ...(b ?? [])])];
  }

  private _mergeTags(record: NormalizedNameRecord): string[] {
    const tags = new Set<string>(record.tags ?? []);

    // From style_tags
    for (const t of record.style_tags ?? []) tags.add(t.toLowerCase());

    // From origin
    if (record.origin) tags.add(record.origin.toLowerCase());

    // From trend
    if (record.trendDirection && record.trendDirection !== 'unknown') {
      tags.add(record.trendDirection);
    }

    // Length tag
    const len = record.displayName?.length ?? record.name?.length ?? 0;
    if (len <= 4) tags.add('short');
    else if (len <= 7) tags.add('medium');
    else tags.add('long');

    // Phonetic tags
    const n = (record.displayName || record.name || '').toLowerCase();
    if (/[aeiou]$/.test(n)) tags.add('vowel_ending');
    if (/^[aeiou]/.test(n)) tags.add('vowel_start');

    return [...tags];
  }

  private _betterSource(
    a: NormalizedNameRecord['source'],
    b: NormalizedNameRecord['source'],
  ): NormalizedNameRecord['source'] {
    const RANK: Record<NormalizedNameRecord['source'], number> = {
      ssa_us: 1,
      ons_uk: 1,
      insee_fr: 1,
      behindthename: 2,
      supabase: 3,
      local_seed: 4,
      ai_suggested: 5,
    };
    return (RANK[a] ?? 99) <= (RANK[b] ?? 99) ? a : b;
  }
}

/** Singleton */
export const nameNormalizationService = new NameNormalizationService();
