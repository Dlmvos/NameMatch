-- baby_names origin hygiene helper + one-shot migration.
--
-- Predicate matches import pipeline provenance strings:
--   - exact `US SSA` (adaptSsaUsCsvToJsonl.ts)
--   - contains `(national statistics)` (adaptEuNationalCsvToJsonl.ts)
--   - contains `(census)` or `(registry)` (future adapters)
--
-- Safe: only NULLs `origin`; never touches country/region.
-- Idempotent: re-running the UPDATE affects 0 rows once clean.

create or replace function public.baby_names_origin_is_source_like(p_origin text)
returns boolean
language sql
immutable
parallel safe
as $$
  select
    p_origin is not null
    and (
      btrim(p_origin) = 'US SSA'
      or p_origin ilike '%(national statistics)%'
      or p_origin ilike '%(census)%'
      or p_origin ilike '%(registry)%'
    );
$$;

comment on function public.baby_names_origin_is_source_like(text) is
  'True when baby_names.origin holds bulk-import provenance, not etymological origin.';

-- One-shot cleanup (safe to run multiple times).
update public.baby_names
set origin = null
where public.baby_names_origin_is_source_like(origin);
