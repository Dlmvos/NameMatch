-- Northern Ireland: remove bulk-imported public rows before loading a nisra-derived JSONL batch.
-- Run in Supabase SQL editor (or psql) after reading `scripts/data/NORTHERN_IRELAND_REAL_SOURCE_WORKFLOW.md`.
--
-- Scope matches `scripts/reportNorthernIrelandEuBulkImportStats.ts` and `adaptEuNationalCsvToJsonl`
-- with `--slug eu-ni-nisra` (meaning_source provenance; origin stays null).

-- 1) Preflight: how many rows would be removed?
SELECT count(*) AS northern_ireland_eu_bulk_rows
FROM public.baby_names
WHERE country = 'Northern Ireland'
  AND region = 'EU'
  AND coalesce(is_premium, false) = false
  AND meaning_source = 'Northern Ireland national statistics (eu-ni-nisra)';

-- 2) Optional: swipes/matches that will CASCADE-delete with those rows:
--    Use `npm run report:baby-names:ni-eu-bulk-stats` for chunked counts from the service role.

-- 3) Execute delete (commented — uncomment only during a planned replacement window):
-- DELETE FROM public.baby_names
-- WHERE country = 'Northern Ireland'
--   AND region = 'EU'
--   AND coalesce(is_premium, false) = false
--   AND meaning_source = 'Northern Ireland national statistics (eu-ni-nisra)';

-- 4) Then import the real batch:
--    npm run import:baby-names -- scripts/data/batches/external-eu-ni-nisra.v1.jsonl

-- 5) Post-import: count(*) here should equal Y from dry-run (`Parsed … → Y valid rows`), not wc -l.
-- SELECT count(*) AS northern_ireland_eu_bulk_rows_after_import
-- FROM public.baby_names
-- WHERE country = 'Northern Ireland'
--   AND region = 'EU'
--   AND coalesce(is_premium, false) = false
--   AND meaning_source = 'Northern Ireland national statistics (eu-ni-nisra)';
