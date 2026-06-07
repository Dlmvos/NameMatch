/**
 * Shared predicate for bulk-import provenance stored in `baby_names.origin`.
 * Keep in sync with `public.baby_names_origin_is_source_like` and
 * `scripts/data/sql/baby_names_origin_hygiene_report.sql`.
 */
export const ORIGIN_HYGIENE_US_SSA = 'US SSA';

export const ORIGIN_HYGIENE_SUBSTRINGS = [
  '(national statistics)',
  '(census)',
  '(registry)',
] as const;

export type OriginHygieneBucket =
  | 'us_ssa'
  | 'national_statistics'
  | 'census'
  | 'registry';

export function classifySourceLikeOrigin(origin: string | null | undefined): OriginHygieneBucket | null {
  if (origin == null) return null;
  const trimmed = origin.trim();
  if (trimmed === ORIGIN_HYGIENE_US_SSA) return 'us_ssa';
  const lower = origin.toLowerCase();
  if (lower.includes('(national statistics)')) return 'national_statistics';
  if (lower.includes('(census)')) return 'census';
  if (lower.includes('(registry)')) return 'registry';
  return null;
}

export function isSourceLikeOrigin(origin: string | null | undefined): boolean {
  return classifySourceLikeOrigin(origin) !== null;
}

/** PostgREST `.or()` filter for source-like origins. */
export function sourceLikeOriginOrFilter(): string {
  const parts = [
    `origin.eq.${ORIGIN_HYGIENE_US_SSA}`,
    ...ORIGIN_HYGIENE_SUBSTRINGS.map((s) => `origin.ilike.%${s}%`),
  ];
  return parts.join(',');
}
