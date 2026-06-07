-- Scotland: remove bulk-imported public rows before loading a nrs-derived JSONL batch.
-- Run in Supabase SQL editor (or psql) after reading `scripts/data/SCOTLAND_REAL_SOURCE_WORKFLOW.md`.
--
-- Scope matches `scripts/reportScotlandEuBulkImportStats.ts` and `adaptEuNationalCsvToJsonl`
-- with `--slug eu-sct-nrs` (meaning_source provenance; origin stays null).

-- 1) Preflight: how many rows would be removed?
SELECT count(*) AS scotland_eu_bulk_rows
FROM public.baby_names
WHERE country = 'Scotland'
  AND region = 'EU'
  AND coalesce(is_premium, false) = false
  AND meaning_source = 'Scotland national statistics (eu-sct-nrs)';

-- 2) Optional: swipes/matches that will CASCADE-delete with those rows:
--    Use `npm run report:baby-names:sct-eu-bulk-stats` for chunked counts from the service role.

-- 3) Execute delete (commented — uncomment only during a planned replacement window):
-- DELETE FROM public.baby_names
-- WHERE country = 'Scotland'
--   AND region = 'EU'
--   AND coalesce(is_premium, false) = false
--   AND meaning_source = 'Scotland national statistics (eu-sct-nrs)';

-- 4) Then import the real batch:
--    npm run import:baby-names -- scripts/data/batches/external-eu-sct-nrs.v1.jsonl

-- 5) Post-import: count(*) here should equal Y from dry-run (`Parsed … → Y valid rows`), not wc -l.
-- SELECT count(*) AS scotland_eu_bulk_rows_after_import
-- FROM public.baby_names
-- WHERE country = 'Scotland'
--   AND region = 'EU'
--   AND coalesce(is_premium, false) = false
--   AND meaning_source = 'Scotland national statistics (eu-sct-nrs)';
