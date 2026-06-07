-- Australia: remove bulk-imported public rows before loading an RBDM-combined workbook-derived JSONL batch.
-- Run in Supabase SQL editor (or psql) after reading `scripts/data/AUSTRALIA_REAL_SOURCE_WORKFLOW.md`.
--
-- Scope matches `scripts/reportAustraliaWorldwideBulkImportStats.ts` and `adaptEuNationalCsvToJsonl`
-- with `--slug au-rbdm-combined --output-region WORLDWIDE` (meaning_source provenance; origin stays null).
--
-- Region note: AppRegion has no OCEANIA bucket, so Australia rows live under WORLDWIDE.
-- If you later add OCEANIA, change `region = 'WORLDWIDE'` to `region = 'OCEANIA'` here AND
-- in `reportAustraliaWorldwideBulkImportStats.ts` AND in the adapter command line, in one PR.

-- 1) Preflight: how many rows would be removed?
SELECT count(*) AS australia_worldwide_bulk_rows
FROM public.baby_names
WHERE country = 'Australia'
  AND region = 'WORLDWIDE'
  AND coalesce(is_premium, false) = false
  AND meaning_source = 'Australia national statistics (au-rbdm-combined)';

-- 2) Optional: swipes/matches that will CASCADE-delete with those rows:
--    Use `npm run report:baby-names:au-worldwide-bulk-stats` for chunked counts from the service role.

-- 3) Execute delete (commented — uncomment only during a planned replacement window):
-- DELETE FROM public.baby_names
-- WHERE country = 'Australia'
--   AND region = 'WORLDWIDE'
--   AND coalesce(is_premium, false) = false
--   AND meaning_source = 'Australia national statistics (au-rbdm-combined)';

-- 4) Then import the real batch:
--    npm run import:baby-names -- scripts/data/batches/external-au-rbdm-combined.v1.jsonl

-- 5) Post-import: count(*) here should equal Y from dry-run (`Parsed … → Y valid rows`), not wc -l.
-- SELECT count(*) AS australia_worldwide_bulk_rows_after_import
-- FROM public.baby_names
-- WHERE country = 'Australia'
--   AND region = 'WORLDWIDE'
--   AND coalesce(is_premium, false) = false
--   AND meaning_source = 'Australia national statistics (au-rbdm-combined)';
