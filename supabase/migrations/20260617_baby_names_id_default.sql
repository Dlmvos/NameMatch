-- ============================================================
-- 20260617_baby_names_id_default.sql
--
-- Restore an auto-generated UUID default on public.baby_names.id.
--
-- Symptom: custom-name inserts from the app fail with
--   23502 — null value in column "id" of relation "baby_names"
--           violates not-null constraint
-- because the client-side payload doesn't include an `id` and the column
-- lost its default at some point along the migration chain (or never had
-- one — the bulk importer always supplied a derived UUID, so the default
-- gap was invisible to anything except the in-app custom-name path).
--
-- Fix: set the default to `extensions.gen_random_uuid()` (pgcrypto). Same
-- function the rest of our identity tables use (canonical_names already
-- defaults to gen_random_uuid in 20260614 / 20260615). Bulk imports still
-- supply their own UUID explicitly — the default is only invoked when the
-- caller omits the column entirely, which is exactly the custom-name path.
--
-- Idempotent: re-runs are a no-op once the default is set.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

alter table public.baby_names
  alter column id set default extensions.gen_random_uuid();

notify pgrst, 'reload schema';
