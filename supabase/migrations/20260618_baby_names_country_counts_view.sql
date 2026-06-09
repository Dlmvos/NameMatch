-- ============================================================
-- 20260618_baby_names_country_counts_view.sql
--
-- DB-truth per-country counts for the FilterSheet "Origin / culture" picker.
--
-- Symptom that pushed this view:
--   FilterSheet chips showed France=16, Spain=15, Belgium=10, etc.
--   Those numbers came from `getOriginCountryChips` in SwipeDeckContext,
--   which counted countries inside the 250-row in-memory weighted-deck
--   pool — not the actual catalog. The user saw "16 France" when the DB
--   actually has 9 593 French rows.
--
-- Fix: a small read-only view that groups baby_names by country and
-- returns the real row count per country. Marked `security_invoker = true`
-- so RLS on baby_names applies as the caller's role — authenticated users
-- get counts over their accessible slice (public + entitled premium),
-- service-role gets everything. Anon gets nothing (no SELECT policy).
--
-- Used by the client to populate FilterSheet chip counts in one round trip
-- instead of inferring from the in-memory deck sample.
--
-- Idempotent: CREATE OR REPLACE.
-- ============================================================

create or replace view public.baby_names_country_counts
with (security_invoker = true)
as
select
  country,
  count(*) :: integer as count
from public.baby_names
where country is not null
  and btrim(country) <> ''
group by country
union all
-- Synthetic "Worldwide / International" row keyed by the sentinel the
-- client already uses (types/index.ts → ORIGIN_FILTER_WORLDWIDE). Lets
-- FilterSheet show a "Worldwide" chip with a real DB-truth count next to
-- the per-country chips. Sentinel value must stay in sync with the
-- exported constant in src/types/index.ts.
select
  '__origin_worldwide__' as country,
  count(*) :: integer as count
from public.baby_names
where is_worldwide = true;

comment on view public.baby_names_country_counts is
  'Per-country row counts over baby_names. security_invoker=true so the caller''s RLS applies — counts reflect what the user is allowed to read.';

-- The view inherits permissions from baby_names; an explicit GRANT to
-- authenticated keeps PostgREST happy in case a future migration tightens
-- the default grants on views.
grant select on public.baby_names_country_counts to authenticated;
grant select on public.baby_names_country_counts to anon;

notify pgrst, 'reload schema';
