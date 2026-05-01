-- Brazil: remove bulk-imported public rows before loading a real hybrid JSONL batch
-- (Top 150 + allowed-names PDF or other `adaptEuNationalCsvToJsonl` bulk with
-- `--output-region LATIN_AMERICA`; same origin `Brazil (national statistics)`).
-- Run in Supabase SQL editor (or psql) after reading `scripts/data/BRAZIL_REAL_SOURCE_WORKFLOW.md`.
--
-- Scope matches `scripts/reportBrazilLatamBulkImportStats.ts` and `adaptEuNationalCsvToJsonl` origin string.
-- Does NOT delete seed/catalog rows that use other `origin` text.

-- 1) Preflight: how many rows would be removed?
SELECT count(*) AS brazil_latam_bulk_rows
FROM public.baby_names
WHERE country = 'Brazil'
  AND region = 'LATIN_AMERICA'
  AND coalesce(is_premium, false) = false
  AND origin = 'Brazil (national statistics)';

-- 2) Optional: swipes/matches that will CASCADE-delete with those rows:
--    Use `npm run report:baby-names:br-latam-bulk-stats` for chunked counts from the service role.

-- 3) Execute delete (commented — uncomment only during a planned replacement window):
-- DELETE FROM public.baby_names
-- WHERE country = 'Brazil'
--   AND region = 'LATIN_AMERICA'
--   AND coalesce(is_premium, false) = false
--   AND origin = 'Brazil (national statistics)';

-- 4) Then import the real batch (example):
--    npm run import:baby-names -- scripts/data/batches/external-latin-br-hybrid-2024.v1.jsonl

-- 5) Post-import: count(*) here should equal Y from dry-run (`Parsed … → Y valid rows`), not wc -l.
-- SELECT count(*) AS brazil_latam_bulk_rows_after_import
-- FROM public.baby_names
-- WHERE country = 'Brazil'
--   AND region = 'LATIN_AMERICA'
--   AND coalesce(is_premium, false) = false
--   AND origin = 'Brazil (national statistics)';
