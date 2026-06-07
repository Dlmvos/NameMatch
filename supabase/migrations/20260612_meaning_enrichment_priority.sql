-- ============================================================
-- 20260612_meaning_enrichment_priority.sql
--
-- Schema substrate for the meaning-enrichment pipeline (see proposal:
-- "Design a meaning-enrichment pipeline for BabySwipe national imports").
--
-- Adds three columns to `public.canonical_name_meanings`:
--   * source_priority smallint   — 1 (best) .. 9 (worst). Lets the lateral
--                                  join in baby_names_with_meaning break ties
--                                  across sources without app-side ordering.
--                                  Existing rows default to 5 (mid bucket).
--   * review_status   text       — 'auto' | 'flagged' | 'approved' | 'rejected'.
--                                  Human-moderation slot. The view ignores
--                                  'rejected' rows; 'approved' is permanent
--                                  (the enrichment pipeline must not overwrite
--                                  it back to 'auto').
--   * context         jsonb      — free-form per-row metadata (model name,
--                                  prompt version, source url, dedupe trail).
--                                  Defaults to empty object so concat ops are
--                                  safe.
--
-- Adds an index that mirrors the new view's ORDER BY so the lateral lookup
-- is one B-tree seek per row.
--
-- Rewrites `baby_names_with_meaning` to:
--   * Filter out review_status = 'rejected'.
--   * Order by source_priority asc, then meaning_verified desc, then
--     meaning_confidence desc (gender-scope and language preferences still
--     take precedence so we don't regress existing behavior).
--   * Fall back to English when the requested language has no eligible row
--     for that canonical name — single-lateral-join pattern: filter
--     `meaning_language IN (requested, 'en')` and rank requested first.
--
-- The view is `CREATE OR REPLACE` only — column set, types, and ordering
-- of the SELECT list are preserved exactly so no app types or
-- PostgREST responses break. New view-level columns are NOT introduced.
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

-- Tighten NOT NULL after backfill so the view + enrichment pipeline can
-- treat them as required.
alter table public.canonical_name_meanings
  alter column source_priority set not null,
  alter column source_priority set default 5,
  alter column review_status   set not null,
  alter column review_status   set default 'auto',
  alter column context         set not null,
  alter column context         set default '{}'::jsonb;

-- Bounded range for source_priority and the allowed values for review_status.
-- IF NOT EXISTS isn't available for CHECK constraints, so guard with a DO block
-- so re-running this migration is safe.
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
-- Mirrors the lateral-join ORDER BY in baby_names_with_meaning so lookup is
-- a single seek. Keeps the older idx_canonical_name_meanings_lookup in place
-- (covers explicit confidence/verified scans elsewhere) — they don't conflict.
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
  where review_status <> 'rejected';

-- ── 3. View rewrite ──────────────────────────────────────────────────────────
-- Drop-in replacement: same SELECT-list columns and types as the version
-- defined in 20260429_canonical_name_identity.sql. The behavioral changes
-- live entirely inside the lateral subquery:
--
--   * `where cnm.review_status <> 'rejected'` — soft-deleted rows are gone
--     from the view but preserved in the table for audit/admin recovery.
--
--   * `where cnm.meaning_language IN (requested, 'en')` — English fallback.
--     The ORDER BY tags `requested-language` rows ahead of English rows so a
--     row in the user's locale always wins when one exists. When none exists,
--     the best English row is returned; if there's no English either,
--     `best_meaning.*` is NULL and the existing COALESCE chain on bn.* still
--     yields whatever the per-row baby_names column holds (often NULL).
--
--   * `order by source_priority asc, meaning_verified desc,
--      meaning_confidence desc nulls last, created_at asc` — the
--      cross-source ranking the proposal asked for. The two preserved
--      preference levels in front of source_priority (language match,
--      gender-scope match) keep the locale-aware and gender-specific
--      semantics the existing view documented.
--
-- Column list is byte-identical to the prior view. PostgREST schema cache will
-- refresh on next NOTIFY pgrst; no app type regen is needed.
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
    /* The user's requested language. Trimmed/normalized once so the lateral
       isn't recomputing the coalesce on every CNM row. */
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
    /* Pull both the requested-language rows AND the English fallback in one
       lateral pass; ORDER BY below ranks requested-language first so it wins
       when available, English-only fills the gap otherwise. */
    and cnm.meaning_language in (requested.lang, 'en')
  order by
    /* 1. Same-language wins. (Equal when requested.lang = 'en'.) */
    case when cnm.meaning_language = requested.lang then 0 else 1 end,
    /* 2. Gender-specific meaning beats gender-neutral 'any'. */
    case when cnm.gender_scope = bn.gender then 0 else 1 end,
    /* 3. Cross-source ranking per the meaning-enrichment proposal:
          better source → verified → higher confidence → earliest row. */
    cnm.source_priority asc,
    cnm.meaning_verified desc,
    cnm.meaning_confidence desc nulls last,
    cnm.created_at asc
  limit 1
) best_meaning on true;

comment on column public.canonical_name_meanings.source_priority is
  '1 (best) .. 9 (worst). Cross-source ranking for the lateral join in baby_names_with_meaning. Curated bundles = 1, authoritative dictionaries = 2, LLM = 5..7.';

comment on column public.canonical_name_meanings.review_status is
  '''auto'' (default) | ''flagged'' (queued for review) | ''approved'' (human-confirmed, immutable from pipeline) | ''rejected'' (hidden by view, kept for audit).';

comment on column public.canonical_name_meanings.context is
  'Free-form metadata (model, prompt_version, source_url, audit trail). Default {} so jsonb concat from the enrichment UPSERT is always safe.';
