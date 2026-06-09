-- ============================================================
-- 20260620_country_counts_with_filters_fn.sql
--
-- RPC that returns per-country baby_names counts intersected with the
-- user's active draft filters. Backs the FilterSheet country-chip counts
-- so toggling length/trend/starts-with/gender on the deck makes the chip
-- numbers react.
--
-- Replaces the static `baby_names_country_counts` view (which only knew
-- total per-country counts) with a parameterised function. The view still
-- exists as a fallback the client uses when the RPC isn't installed yet.
--
-- Filter inputs accepted
-- ──────────────────────
-- p_starting_letter text     — single uppercase A-Z, or null/'' for no filter
-- p_lengths        text[]    — subset of {'short','medium','long'}, or null
-- p_trends         text[]    — subset of {'rising','stable','classic'}, or null
-- p_gender         text      — 'boy' | 'girl' | 'both' | null
-- p_include_worldwide_chip boolean — when true, also emits the synthetic
--                              '__origin_worldwide__' row keyed off is_worldwide
--
-- What's intentionally NOT a parameter
-- ─────────────────────────────────────
-- * `origins` (country picker) — circular: chip counts answer "what if I
--   selected this country?". Don't apply the country filter to the counts.
-- * `vibes` — heuristic regexes over name string; not in DB columns. Counts
--   ignore the vibe filter for now. Documented limitation; safe because the
--   deck itself still applies the vibe filter when names are surfaced.
--
-- Security
-- ────────
-- SECURITY INVOKER — caller's RLS applies. Authenticated users count over
-- their accessible slice (public + entitled premium). Anon counts return
-- empty.
--
-- Idempotency
-- ───────────
-- CREATE OR REPLACE FUNCTION — safe to re-run; signature is stable so
-- existing PostgREST cache survives.
-- ============================================================

create or replace function public.country_counts_with_filters(
  p_starting_letter text default null,
  p_lengths text[] default null,
  p_trends text[] default null,
  p_gender text default null,
  p_include_worldwide_chip boolean default true
)
returns table (country text, count integer)
language sql
stable
security invoker
set search_path = public
as $$
  with normalized_gender as (
    select
      case
        when p_gender = 'boy'  then array['boy', 'neutral']
        when p_gender = 'girl' then array['girl', 'neutral']
        else null
      end as allowed
  ),
  per_country as (
    select bn.country, count(*)::integer as cnt
    from public.baby_names bn
    cross join normalized_gender ng
    where bn.country is not null
      and btrim(bn.country) <> ''
      -- starts-with: single character, case-insensitive
      and (
        p_starting_letter is null
        or btrim(p_starting_letter) = ''
        or upper(left(bn.name, 1)) = upper(left(p_starting_letter, 1))
      )
      -- length bucket: skip when array is null/empty
      and (
        p_lengths is null
        or cardinality(p_lengths) = 0
        or bn.name_length_bucket = any(p_lengths)
      )
      -- trend: skip when array is null/empty. Null trend never matches a
      -- non-empty filter array — same semantics as the JS-side filter.
      and (
        p_trends is null
        or cardinality(p_trends) = 0
        or bn.trend = any(p_trends)
      )
      -- gender: only when caller specified boy/girl
      and (
        ng.allowed is null
        or bn.gender = any(ng.allowed)
      )
    group by bn.country
  ),
  worldwide_row as (
    -- Synthetic chip count keyed off is_worldwide=true. Applies the same
    -- filter predicates so the "Worldwide" chip also reacts to length/trend.
    -- Skipped when p_include_worldwide_chip=false or no rows match.
    select
      '__origin_worldwide__'::text as country,
      count(*)::integer as cnt
    from public.baby_names bn
    cross join normalized_gender ng
    where p_include_worldwide_chip = true
      and bn.is_worldwide = true
      and (
        p_starting_letter is null
        or btrim(p_starting_letter) = ''
        or upper(left(bn.name, 1)) = upper(left(p_starting_letter, 1))
      )
      and (
        p_lengths is null
        or cardinality(p_lengths) = 0
        or bn.name_length_bucket = any(p_lengths)
      )
      and (
        p_trends is null
        or cardinality(p_trends) = 0
        or bn.trend = any(p_trends)
      )
      and (
        ng.allowed is null
        or bn.gender = any(ng.allowed)
      )
    having count(*) > 0
  )
  select country, cnt as count from per_country
  union all
  select country, cnt as count from worldwide_row;
$$;

comment on function public.country_counts_with_filters(
  text, text[], text[], text, boolean
) is
  'Per-country baby_names counts intersected with starting_letter/lengths/trends/gender. SECURITY INVOKER — counts reflect the caller''s RLS slice. Vibes/origins not parameterised on purpose; see migration header.';

revoke all on function public.country_counts_with_filters(
  text, text[], text[], text, boolean
) from public;

grant execute on function public.country_counts_with_filters(
  text, text[], text[], text, boolean
) to authenticated;

grant execute on function public.country_counts_with_filters(
  text, text[], text[], text, boolean
) to anon;

notify pgrst, 'reload schema';
