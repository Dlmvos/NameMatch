-- England and Wales: remove bulk-imported public rows before loading a ons-derived JSONL batch.
-- Run in Supabase SQL editor (or psql) after reading `scripts/data/ENGLAND_WALES_REAL_SOURCE_WORKFLOW.md`.
--
-- Scope matches `scripts/reportEnglandWalesEuBulkImportStats.ts` and `adaptEuNationalCsvToJsonl`
-- with `--slug eu-ew-ons` (meaning_source provenance; origin stays null).

-- 1) Preflight: how many rows would be removed?
SELECT count(*) AS england_wales_eu_bulk_rows
FROM public.baby_names
WHERE country = 'England and Wales'
  AND region = 'EU'
  AND coalesce(is_premium, false) = false
  AND meaning_source = 'England and Wales national statistics (eu-ew-ons)';

-- 2) Optional: swipes/matches that will CASCADE-delete with those rows:
--    Use `npm run report:baby-names:ew-eu-bulk-stats` for chunked counts from the service role.

-- 3) Execute delete (commented — uncomment only during a planned replacement window):
-- DELETE FROM public.baby_names
-- WHERE country = 'England and Wales'
--   AND region = 'EU'
--   AND coalesce(is_premium, false) = false
--   AND meaning_source = 'England and Wales national statistics (eu-ew-ons)';

-- 4) Then import the real batch:
--    npm run import:baby-names -- scripts/data/batches/external-eu-ew-ons.v1.jsonl

-- 5) Post-import: count(*) here should equal Y from dry-run (`Parsed … → Y valid rows`), not wc -l.
-- SELECT count(*) AS england_wales_eu_bulk_rows_after_import
-- FROM public.baby_names
-- WHERE country = 'England and Wales'
--   AND region = 'EU'
--   AND coalesce(is_premium, false) = false
--   AND meaning_source = 'England and Wales national statistics (eu-ew-ons)';
