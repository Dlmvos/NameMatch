-- baby_names origin hygiene: report + optional in-place cleanup.
--
-- Problem: bulk import adapters stamp dataset provenance on `origin` (e.g. `US SSA`,
-- `France (national statistics)`). That is not etymological origin and pollutes UI/filters.
--
-- This script ONLY updates `baby_names.origin`. It does NOT change `country`, `region`,
-- or any other column. Rows are kept; provenance is cleared so `baby_names_with_meaning`
-- can coalesce canonical etymology from `canonical_name_meanings` when linked.
--
-- Read-only report (CLI):  npm run report:baby-names:origin-hygiene
-- Automated cleanup (idempotent): supabase/migrations/20260607_baby_names_origin_hygiene.sql

-- Predicate (inline — works before/after the hygiene migration):
--   origin = 'US SSA'
--   OR origin ILIKE '%(national statistics)%'
--   OR origin ILIKE '%(census)%'
--   OR origin ILIKE '%(registry)%'

-- ── 1) Preflight: total source-like origins ─────────────────────────────────
SELECT count(*) AS source_like_origin_rows
FROM public.baby_names
WHERE origin IS NOT NULL
  AND (
    btrim(origin) = 'US SSA'
    OR origin ILIKE '%(national statistics)%'
    OR origin ILIKE '%(census)%'
    OR origin ILIKE '%(registry)%'
  );

-- ── 2) Breakdown by exact origin string ─────────────────────────────────────
SELECT
  origin,
  count(*) AS row_count
FROM public.baby_names
WHERE origin IS NOT NULL
  AND (
    btrim(origin) = 'US SSA'
    OR origin ILIKE '%(national statistics)%'
    OR origin ILIKE '%(census)%'
    OR origin ILIKE '%(registry)%'
  )
GROUP BY origin
ORDER BY row_count DESC, origin;

-- ── 3) Sanity: country/region distribution (read-only; not modified) ────────
SELECT
  country,
  region,
  count(*) AS row_count
FROM public.baby_names
WHERE origin IS NOT NULL
  AND (
    btrim(origin) = 'US SSA'
    OR origin ILIKE '%(national statistics)%'
    OR origin ILIKE '%(census)%'
    OR origin ILIKE '%(registry)%'
  )
GROUP BY country, region
ORDER BY row_count DESC, country, region;

-- ── 4) Optional sample rows before change ───────────────────────────────────
SELECT id, name, origin, country, region, coalesce(is_premium, false) AS is_premium
FROM public.baby_names
WHERE origin IS NOT NULL
  AND (
    btrim(origin) = 'US SSA'
    OR origin ILIKE '%(national statistics)%'
    OR origin ILIKE '%(census)%'
    OR origin ILIKE '%(registry)%'
  )
ORDER BY origin, country, name
LIMIT 25;

-- ── 5) Manual cleanup (commented — prefer idempotent migration) ─────────────
-- UPDATE public.baby_names
-- SET origin = NULL
-- WHERE origin IS NOT NULL
--   AND (
--     btrim(origin) = 'US SSA'
--     OR origin ILIKE '%(national statistics)%'
--     OR origin ILIKE '%(census)%'
--     OR origin ILIKE '%(registry)%'
--   );

-- ── 6) Post-update verification (expect 0) ──────────────────────────────────
-- SELECT count(*) AS source_like_origin_rows_remaining
-- FROM public.baby_names
-- WHERE origin IS NOT NULL
--   AND (
--     btrim(origin) = 'US SSA'
--     OR origin ILIKE '%(national statistics)%'
--     OR origin ILIKE '%(census)%'
--     OR origin ILIKE '%(registry)%'
--   );
