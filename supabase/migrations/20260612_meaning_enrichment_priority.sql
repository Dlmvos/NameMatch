-- ============================================================
-- 20260612_meaning_enrichment_priority.sql
--
-- Schema substrate for the meaning-enrichment pipeline (see proposal:
-- "Design a meaning-enrichment pipeline for BabySwipe national imports").
--
-- ALWAYS applies (idempotent, safe to re-run after partial failure):
--   * Adds / backfills on `public.canonical_name_meanings`:
--       source_priority, review_status, context
--   * CHECK constraints for source_priority (1..9) and review_status enum
--   * Partial index idx_canonical_name_meanings_best
--
-- CONDITIONALLY applies:
--   * Rewrites `public.baby_names_with_meaning` ONLY when
--     `public.baby_names.canonical_name_id` exists. The view joins
--     baby_names → canonical_name_meanings via that FK column; without it
--     the rewrite must be skipped or the migration fails.
--
-- Remote schema drift (observed on production):
--   * `canonical_name_meanings` exists with `canonical_name_id` but often
--     WITHOUT an `origin` column (etymology stays on `baby_names.origin`).
--   * `baby_names.canonical_name_id` may be absent when the identity layer
--     from 20260429_canonical_name_identity.sql has not landed yet.
--   * When the view rewrite is skipped, apply 20260429 (or equivalent) first,
--     then re-run this migration to pick up the view section.
--
-- View rewrite behavior (when baby_names.canonical_name_id exists):
--   * Filter out review_status = 'rejected'.
--   * Order by source_priority, meaning_verified, meaning_confidence.
--   * English fallback via meaning_language IN (requested, 'en').
--   * Never references cnm.origin unless that column exists on CNM.
--   * Same public view columns/types as 20260429 — no new view columns.
-- ============================================================

-- ── 1. Add columns to canonical_name_meanings (idempotent) ───────────────────
alter table public.canonical_name_meanings
  add column if not exists source_priority smallint default 5,
  add column if not exists review_status text default 'auto',
  add column if not exists context jsonb default '{}'::jsonb;

-- Backfill any rows where the prior NOT-NULL coercion failed (e.g. rows
-- inserted in a transaction that ran ALTER + INSERT before commit).
update public.canonical_name_meanings
set source_priority = 5
where source_priority is null;

update public.canonical_name_meanings
set review_status = 'auto'
where review_status is null;

update public.canonical_name_meanings
set context = '{}'::jsonb
where context is null;

-- Tighten NOT NULL after backfill. Guard with is_nullable checks so a re-run
-- after partial success is safe.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meanings'
      and column_name = 'source_priority'
      and is_nullable = 'YES'
  ) then
    alter table public.canonical_name_meanings
      alter column source_priority set not null,
      alter column source_priority set default 5;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meanings'
      and column_name = 'review_status'
      and is_nullable = 'YES'
  ) then
    alter table public.canonical_name_meanings
      alter column review_status set not null,
      alter column review_status set default 'auto';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meanings'
      and column_name = 'context'
      and is_nullable = 'YES'
  ) then
    alter table public.canonical_name_meanings
      alter column context set not null,
      alter column context set default '{}'::jsonb;
  end if;
end
$$;

-- Bounded range for source_priority and allowed review_status values.
-- IF NOT EXISTS isn't available for CHECK constraints — guard with DO block.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'canonical_name_meanings_source_priority_range_check'
  ) then
    alter table public.canonical_name_meanings
      add constraint canonical_name_meanings_source_priority_range_check
      check (source_priority between 1 and 9);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'canonical_name_meanings_review_status_check'
  ) then
    alter table public.canonical_name_meanings
      add constraint canonical_name_meanings_review_status_check
      check (review_status in ('auto', 'flagged', 'approved', 'rejected'));
  end if;
end
$$;

-- ── 2. Best-meaning index ────────────────────────────────────────────────────
-- Mirrors the lateral-join ORDER BY in baby_names_with_meaning when that view
-- exists. Safe to create even when the view rewrite is skipped below.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meanings'
      and column_name = 'source_priority'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meanings'
      and column_name = 'review_status'
  ) then
    execute $idx$
      create index if not exists idx_canonical_name_meanings_best
        on public.canonical_name_meanings (
          canonical_name_id,
          meaning_language,
          gender_scope,
          source_priority asc,
          meaning_verified desc,
          meaning_confidence desc nulls last,
          created_at asc
        )
        where review_status <> 'rejected'
    $idx$;
  end if;
end
$$;

-- ── 3. View rewrite (conditional) ───────────────────────────────────────────
-- Requires baby_names.canonical_name_id — the join key from
-- 20260429_canonical_name_identity.sql. Skip entirely on drifted remotes that
-- only have the CNM table enriched so far.
do $migration$
declare
  has_bn_canonical_name_id boolean;
  has_cnm_origin boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'baby_names'
      and column_name = 'canonical_name_id'
  ) into has_bn_canonical_name_id;

  if not has_bn_canonical_name_id then
    raise notice
      '20260612: skipping baby_names_with_meaning rewrite — baby_names.canonical_name_id absent (remote schema drift). CNM columns/constraints/index applied; re-run after identity migration lands.';
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meanings'
      and column_name = 'origin'
  ) into has_cnm_origin;

  if has_cnm_origin then
    execute $view$
create or replace view public.baby_names_with_meaning
with (security_invoker = true)
as
select
  bn.id,
  bn.name,
  coalesce(nullif(btrim(bn.meaning), ''), best_meaning.meaning) as meaning,
  coalesce(nullif(btrim(bn.origin), ''), best_meaning.origin) as origin,
  bn.gender,
  bn.country,
  bn.region,
  bn.is_worldwide,
  bn.created_at,
  bn.is_premium,
  bn.popularity_rank,
  bn.canonical_name_id,
  coalesce(nullif(btrim(bn.meaning_source), ''), best_meaning.meaning_source) as meaning_source,
  coalesce(bn.meaning_confidence, best_meaning.meaning_confidence) as meaning_confidence,
  coalesce(bn.meaning_verified, best_meaning.meaning_verified, false) as meaning_verified,
  coalesce(nullif(btrim(bn.meaning_language), ''), best_meaning.meaning_language) as meaning_language
from public.baby_names bn
left join lateral (
  with
    requested as (
      select coalesce(nullif(btrim(bn.meaning_language), ''), 'en') as lang
    )
  select
    cnm.meaning,
    cnm.origin,
    cnm.meaning_source,
    cnm.meaning_confidence,
    cnm.meaning_verified,
    cnm.meaning_language
  from public.canonical_name_meanings cnm
  cross join requested
  where cnm.canonical_name_id = bn.canonical_name_id
    and cnm.review_status <> 'rejected'
    and cnm.gender_scope in (bn.gender, 'any')
    and cnm.meaning_language in (requested.lang, 'en')
  order by
    case when cnm.meaning_language = requested.lang then 0 else 1 end,
    case when cnm.gender_scope = bn.gender then 0 else 1 end,
    cnm.source_priority asc,
    cnm.meaning_verified desc,
    cnm.meaning_confidence desc nulls last,
    cnm.created_at asc
  limit 1
) best_meaning on true
    $view$;
  else
    execute $view$
create or replace view public.baby_names_with_meaning
with (security_invoker = true)
as
select
  bn.id,
  bn.name,
  coalesce(nullif(btrim(bn.meaning), ''), best_meaning.meaning) as meaning,
  nullif(btrim(bn.origin), '') as origin,
  bn.gender,
  bn.country,
  bn.region,
  bn.is_worldwide,
  bn.created_at,
  bn.is_premium,
  bn.popularity_rank,
  bn.canonical_name_id,
  coalesce(nullif(btrim(bn.meaning_source), ''), best_meaning.meaning_source) as meaning_source,
  coalesce(bn.meaning_confidence, best_meaning.meaning_confidence) as meaning_confidence,
  coalesce(bn.meaning_verified, best_meaning.meaning_verified, false) as meaning_verified,
  coalesce(nullif(btrim(bn.meaning_language), ''), best_meaning.meaning_language) as meaning_language
from public.baby_names bn
left join lateral (
  with
    requested as (
      select coalesce(nullif(btrim(bn.meaning_language), ''), 'en') as lang
    )
  select
    cnm.meaning,
    cnm.meaning_source,
    cnm.meaning_confidence,
    cnm.meaning_verified,
    cnm.meaning_language
  from public.canonical_name_meanings cnm
  cross join requested
  where cnm.canonical_name_id = bn.canonical_name_id
    and cnm.review_status <> 'rejected'
    and cnm.gender_scope in (bn.gender, 'any')
    and cnm.meaning_language in (requested.lang, 'en')
  order by
    case when cnm.meaning_language = requested.lang then 0 else 1 end,
    case when cnm.gender_scope = bn.gender then 0 else 1 end,
    cnm.source_priority asc,
    cnm.meaning_verified desc,
    cnm.meaning_confidence desc nulls last,
    cnm.created_at asc
  limit 1
) best_meaning on true
    $view$;
  end if;
end
$migration$;

comment on column public.canonical_name_meanings.source_priority is
  '1 (best) .. 9 (worst). Cross-source ranking for the lateral join in baby_names_with_meaning. Curated bundles = 1, authoritative dictionaries = 2, LLM = 5..7.';

comment on column public.canonical_name_meanings.review_status is
  '''auto'' (default) | ''flagged'' (queued for review) | ''approved'' (human-confirmed, immutable from pipeline) | ''rejected'' (hidden by view, kept for audit).';

comment on column public.canonical_name_meanings.context is
  'Free-form metadata (model, prompt_version, source_url, audit trail). Default {} so jsonb concat from the enrichment UPSERT is always safe.';
