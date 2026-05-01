-- Spain: remove bulk-imported public rows before loading a real INE JSONL batch.
-- Run in Supabase SQL editor (or psql) after reading `scripts/data/SPAIN_REAL_SOURCE_WORKFLOW.md` §6.
--
-- Scope matches `scripts/reportSpainEuBulkImportStats.ts` and `adaptEuNationalCsvToJsonl` origin string.
-- Does NOT delete seed/catalog rows that use other `origin` text (e.g. manual "Spanish" origins).

-- 1) Preflight: how many rows would be removed?
SELECT count(*) AS spain_eu_bulk_rows
FROM public.baby_names
WHERE country = 'Spain'
  AND region = 'EU'
  AND coalesce(is_premium, false) = false
  AND origin = 'Spain (national statistics)';

-- 2) Optional: swipes/matches that will CASCADE-delete with those rows (run ids via app report or):
--    Use `npm run report:baby-names:es-eu-bulk-stats` for chunked counts from the service role.

-- 3) Execute delete (commented — uncomment only during a planned replacement window):
-- DELETE FROM public.baby_names
-- WHERE country = 'Spain'
--   AND region = 'EU'
--   AND coalesce(is_premium, false) = false
--   AND origin = 'Spain (national statistics)';

-- 4) Then import the real batch:
--    npm run import:baby-names -- scripts/data/batches/external-eu-es-ine-real-<year>.v1.jsonl

-- 5) Post-import: count(*) here should equal Y from dry-run (`Parsed … → Y valid rows`), not wc -l.
--    npm run import:baby-names -- --dry-run scripts/data/batches/<batch>.jsonl
-- SELECT count(*) AS spain_eu_bulk_rows_after_import
-- FROM public.baby_names
-- WHERE country = 'Spain'
--   AND region = 'EU'
--   AND coalesce(is_premium, false) = false
--   AND origin = 'Spain (national statistics)';
