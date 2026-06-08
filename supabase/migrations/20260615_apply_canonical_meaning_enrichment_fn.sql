-- ============================================================
-- 20260615_apply_canonical_meaning_enrichment_fn.sql
--
-- Server-side primitive for the meaning-enrichment pipeline.
--
-- Exposes ONE function: `public.apply_canonical_meaning_enrichment(...)`
-- The applier script (scripts/applyEnrichmentBatch.ts) calls it once per
-- JSONL row inside a transaction. The function performs an atomic, monotonic
-- UPSERT into canonical_name_meanings and writes a matching audit row to
-- canonical_name_meaning_attempts. Returns a jsonb summary the applier can
-- log and (optionally) feed back into the negative cache.
--
-- Why a SQL function instead of UPSERTing from JS
-- ───────────────────────────────────────────────
-- The PostgREST / supabase-js client cannot express the conflict clause we
-- need — GREATEST(confidence), OR(verified), LEAST(source_priority), and
-- a CASE that preserves human review_status decisions. Doing that
-- correctly client-side would require a SELECT-then-UPDATE pattern with a
-- race window. A SECURITY DEFINER plpgsql function keeps the logic atomic
-- and centralised.
--
-- Monotonic write rules
-- ─────────────────────
-- On conflict, the existing CNM row only ever improves:
--   * meaning_confidence → GREATEST(old, new)
--   * meaning_verified   → old OR new                 (human truth sticks)
--   * source_priority    → LEAST(old, new)            (lower = better)
--   * review_status      → 'approved'/'rejected' immutable; else new
--   * origin (if column present) → COALESCE(new, old) (richer source can
--                                                      add origin; no
--                                                      source can blank one)
--   * context            → old || new                 (audit trail merges)
--
-- Idempotency
-- ───────────
-- Re-running the same call is a no-op for CNM (the conflict clause re-
-- applies the same values to themselves). The audit row UPSERT accumulates
-- context and refreshes attempted_at — re-runs are observable in the audit
-- table without polluting CNM.
--
-- Schema drift handling
-- ─────────────────────
-- The function body is generated at migration time based on which optional
-- column is present:
--   * canonical_name_meanings.origin           — included only if present
-- Required (the function won't generate without them):
--   * canonical_name_meanings.source_priority   (added by 20260612)
--   * canonical_name_meanings.review_status     (added by 20260612)
--   * canonical_name_meanings.context           (added by 20260612)
--   * canonical_name_meaning_attempts table     (added by 20260614)
-- If any required table/column is missing the migration logs a NOTICE and
-- skips function creation — re-run after 20260612 + 20260614 land.
--
-- Security
-- ────────
-- SECURITY DEFINER. EXECUTE revoked from PUBLIC and granted only to
-- service_role; anon and authenticated users cannot bypass moderation by
-- calling this directly.
--
-- UPSERT conflict target
-- ──────────────────────
-- apply_canonical_meaning_enrichment ON CONFLICT requires a unique constraint
-- on (canonical_name_id, meaning_language, gender_scope, meaning,
-- meaning_source). Defined in 20260429 but may be missing on remote if that
-- migration partially failed or duplicates blocked index creation. Section 0
-- below reports duplicate groups, dedupes deterministically, then creates the
-- index idempotently before the function is installed.
-- ============================================================

-- ── 0. Ensure UPSERT conflict target (dedupe + unique index) ────────────────
do $cnm_unique_index$
declare
  has_cnm           boolean;
  has_cnm_priority  boolean;
  has_cnm_review    boolean;
  has_cnm_context   boolean;
  dup_group_count   bigint;
  dup_excess_rows   bigint;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
  ) into has_cnm;

  if not has_cnm then
    raise notice '20260615: skipping CNM unique index — canonical_name_meanings missing';
    return;
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'source_priority'
  ) into has_cnm_priority;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'review_status'
  ) into has_cnm_review;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'context'
  ) into has_cnm_context;

  select count(*) into dup_group_count
  from (
    select 1
    from public.canonical_name_meanings
    group by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
    having count(*) > 1
  ) dup_groups;

  select coalesce(sum(cnt - 1), 0) into dup_excess_rows
  from (
    select count(*) as cnt
    from public.canonical_name_meanings
    group by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
    having count(*) > 1
  ) dup_counts;

  if dup_group_count > 0 then
    raise notice
      '20260615: canonical_name_meanings duplicate groups=% excess_rows=% — deduping deterministically before unique index',
      dup_group_count, dup_excess_rows;

    if has_cnm_priority and has_cnm_review and has_cnm_context then
      execute $dedupe$
        with ranked as (
          select
            id,
            row_number() over (
              partition by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
              order by
                meaning_verified desc,
                coalesce(meaning_confidence, 0) desc,
                coalesce(source_priority, 9) asc,
                case review_status
                  when 'approved' then 0
                  when 'auto' then 1
                  when 'flagged' then 2
                  else 3
                end,
                created_at asc,
                id asc
            ) as rn
          from public.canonical_name_meanings
        ),
        keepers as (
          select id as keeper_id
          from ranked
          where rn = 1
        ),
        agg as (
          select
            k.keeper_id,
            max(coalesce(c.meaning_confidence, 0)) as max_confidence,
            bool_or(c.meaning_verified) as any_verified,
            min(coalesce(c.source_priority, 9)) as min_priority
          from keepers k
          join public.canonical_name_meanings keeper on keeper.id = k.keeper_id
          join public.canonical_name_meanings c
            on c.canonical_name_id = keeper.canonical_name_id
           and c.meaning_language = keeper.meaning_language
           and c.gender_scope = keeper.gender_scope
           and c.meaning = keeper.meaning
           and c.meaning_source = keeper.meaning_source
          group by k.keeper_id
        )
        update public.canonical_name_meanings c
        set
          meaning_confidence = greatest(coalesce(c.meaning_confidence, 0), a.max_confidence),
          meaning_verified = c.meaning_verified or a.any_verified,
          source_priority = least(coalesce(c.source_priority, 9), a.min_priority),
          context = coalesce(c.context, '{}'::jsonb) || coalesce((
            select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
            from public.canonical_name_meanings keeper
            join public.canonical_name_meanings dup
              on dup.canonical_name_id = keeper.canonical_name_id
             and dup.meaning_language = keeper.meaning_language
             and dup.gender_scope = keeper.gender_scope
             and dup.meaning = keeper.meaning
             and dup.meaning_source = keeper.meaning_source
            cross join lateral jsonb_each(coalesce(dup.context, '{}'::jsonb)) as e(key, value)
            where keeper.id = c.id
              and dup.id <> c.id
          ), '{}'::jsonb)
        from agg a
        where c.id = a.keeper_id;

        with ranked as (
          select
            id,
            row_number() over (
              partition by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
              order by
                meaning_verified desc,
                coalesce(meaning_confidence, 0) desc,
                coalesce(source_priority, 9) asc,
                case review_status
                  when 'approved' then 0
                  when 'auto' then 1
                  when 'flagged' then 2
                  else 3
                end,
                created_at asc,
                id asc
            ) as rn
          from public.canonical_name_meanings
        )
        delete from public.canonical_name_meanings c
        using ranked r
        where c.id = r.id
          and r.rn > 1;
      $dedupe$;
    else
      execute $dedupe$
        with ranked as (
          select
            id,
            row_number() over (
              partition by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
              order by
                meaning_verified desc,
                coalesce(meaning_confidence, 0) desc,
                created_at asc,
                id asc
            ) as rn
          from public.canonical_name_meanings
        ),
        keepers as (
          select id as keeper_id
          from ranked
          where rn = 1
        ),
        agg as (
          select
            k.keeper_id,
            max(coalesce(c.meaning_confidence, 0)) as max_confidence,
            bool_or(c.meaning_verified) as any_verified
          from keepers k
          join public.canonical_name_meanings keeper on keeper.id = k.keeper_id
          join public.canonical_name_meanings c
            on c.canonical_name_id = keeper.canonical_name_id
           and c.meaning_language = keeper.meaning_language
           and c.gender_scope = keeper.gender_scope
           and c.meaning = keeper.meaning
           and c.meaning_source = keeper.meaning_source
          group by k.keeper_id
        )
        update public.canonical_name_meanings c
        set
          meaning_confidence = greatest(coalesce(c.meaning_confidence, 0), a.max_confidence),
          meaning_verified = c.meaning_verified or a.any_verified
        from agg a
        where c.id = a.keeper_id;

        with ranked as (
          select
            id,
            row_number() over (
              partition by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
              order by
                meaning_verified desc,
                coalesce(meaning_confidence, 0) desc,
                created_at asc,
                id asc
            ) as rn
          from public.canonical_name_meanings
        )
        delete from public.canonical_name_meanings c
        using ranked r
        where c.id = r.id
          and r.rn > 1;
      $dedupe$;
    end if;
  end if;

  create unique index if not exists idx_canonical_name_meanings_source_unique
    on public.canonical_name_meanings (
      canonical_name_id,
      meaning_language,
      gender_scope,
      meaning,
      meaning_source
    );
end
$cnm_unique_index$;

do $migration$
declare
  has_cnm           boolean;
  has_cnma          boolean;
  has_cnm_origin    boolean;
  has_cnm_priority  boolean;
  has_cnm_review    boolean;
  has_cnm_context   boolean;

  -- Substitution fragments built from the schema probe; spliced into the
  -- function body via format() below. Keeping them as plpgsql text values
  -- means the format() template uses a flat %s/%s/%s and arg positions
  -- match without any nested CASE expressions inside the format call.
  v_origin_col_clause      text;
  v_origin_val_clause      text;
  v_origin_conflict_clause text;
begin
  -- ── Probe required schema state ───────────────────────────────────────────
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
  ) into has_cnm;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'canonical_name_meaning_attempts'
  ) into has_cnma;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'origin'
  ) into has_cnm_origin;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'source_priority'
  ) into has_cnm_priority;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'review_status'
  ) into has_cnm_review;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'context'
  ) into has_cnm_context;

  if not has_cnm or not has_cnma or not has_cnm_priority or not has_cnm_review or not has_cnm_context then
    raise notice
      '20260615: skipping apply_canonical_meaning_enrichment — required tables/columns missing (cnm=%, cnma=%, source_priority=%, review_status=%, context=%). Apply 20260612 + 20260614 first.',
      has_cnm, has_cnma, has_cnm_priority, has_cnm_review, has_cnm_context;
    return;
  end if;

  -- ── Build the optional-origin fragments ──────────────────────────────────
  -- Trailing comma is part of the fragment because the column / value /
  -- conflict-set lists keep enumerating after it. An empty fragment means
  -- the surrounding list collapses cleanly.
  if has_cnm_origin then
    v_origin_col_clause      := 'origin,';
    v_origin_val_clause      := 'p_origin,';
    v_origin_conflict_clause := 'origin = coalesce(excluded.origin, public.canonical_name_meanings.origin),';
  else
    v_origin_col_clause      := '';
    v_origin_val_clause      := '';
    v_origin_conflict_clause := '';
  end if;

  -- ── Function body ─────────────────────────────────────────────────────────
  -- Three %s placeholders in the template, three plpgsql vars splice in
  -- the optional origin column/value/conflict-set fragments. The function
  -- body is single-statement-safe under concurrent enrichment of the same
  -- canonical name: the row-level lock acquired by the INSERT ... ON
  -- CONFLICT serialises competing writers on the unique tuple.
  execute format($fn$
create or replace function public.apply_canonical_meaning_enrichment(
  p_canonical_name_id  uuid,
  p_meaning            text,
  p_origin             text,
  p_gender_scope       text,
  p_meaning_language   text,
  p_meaning_source     text,
  p_meaning_confidence numeric,
  p_meaning_verified   boolean,
  p_source_priority    smallint,
  p_review_status      text,
  p_context            jsonb,
  p_attempt_context    jsonb default '{}'::jsonb,
  p_retry_after        timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $body$
declare
  v_cnm_id       uuid;
  v_was_inserted boolean;
  v_detail       text;
begin
  -- Sanity-check the canonical row up front so we return a structured error
  -- instead of letting the FK violation propagate as a generic 23503.
  if p_canonical_name_id is null
     or not exists (select 1 from public.canonical_names where id = p_canonical_name_id) then
    return jsonb_build_object(
      'outcome',            'error',
      'detail',             'canonical_name_not_found',
      'canonical_name_id',  p_canonical_name_id
    );
  end if;

  insert into public.canonical_name_meanings (
    canonical_name_id,
    meaning,
    %s
    gender_scope,
    meaning_language,
    meaning_source,
    meaning_confidence,
    meaning_verified,
    source_priority,
    review_status,
    context
  )
  values (
    p_canonical_name_id,
    p_meaning,
    %s
    p_gender_scope,
    p_meaning_language,
    p_meaning_source,
    p_meaning_confidence,
    coalesce(p_meaning_verified, false),
    coalesce(p_source_priority, 5),
    coalesce(p_review_status, 'auto'),
    coalesce(p_context, '{}'::jsonb)
  )
  on conflict (canonical_name_id, meaning_language, gender_scope, meaning, meaning_source)
  do update set
    %s
    meaning_confidence = greatest(
                           coalesce(public.canonical_name_meanings.meaning_confidence, 0),
                           coalesce(excluded.meaning_confidence, 0)
                         ),
    meaning_verified   = public.canonical_name_meanings.meaning_verified
                           or excluded.meaning_verified,
    source_priority    = least(
                           coalesce(public.canonical_name_meanings.source_priority, 9),
                           coalesce(excluded.source_priority, 9)
                         ),
    review_status      = case
                           when public.canonical_name_meanings.review_status in ('approved','rejected')
                             then public.canonical_name_meanings.review_status
                           else coalesce(excluded.review_status, public.canonical_name_meanings.review_status)
                         end,
    context            = public.canonical_name_meanings.context
                           || coalesce(excluded.context, '{}'::jsonb)
  returning id, (xmax = 0) into v_cnm_id, v_was_inserted;

  v_detail := case when v_was_inserted then 'inserted' else 'updated' end;

  -- Audit row keyed on (canonical, language, scope, source). Concatenated
  -- context preserves earlier metadata across re-runs / source upgrades.
  insert into public.canonical_name_meaning_attempts (
    canonical_name_id,
    meaning_language,
    gender_scope,
    source,
    outcome,
    attempted_at,
    retry_after,
    context
  )
  values (
    p_canonical_name_id,
    p_meaning_language,
    p_gender_scope,
    p_meaning_source,
    'success',
    now(),
    p_retry_after,
    jsonb_build_object('detail', v_detail, 'cnm_id', v_cnm_id)
      || coalesce(p_attempt_context, '{}'::jsonb)
  )
  on conflict (canonical_name_id, meaning_language, gender_scope, source)
  do update set
    outcome      = 'success',
    attempted_at = now(),
    retry_after  = excluded.retry_after,
    context      = public.canonical_name_meaning_attempts.context
                     || excluded.context;

  return jsonb_build_object(
    'outcome',            'success',
    'detail',             v_detail,
    'cnm_id',             v_cnm_id,
    'canonical_name_id',  p_canonical_name_id
  );
end;
$body$;
$fn$,
    v_origin_col_clause,
    v_origin_val_clause,
    v_origin_conflict_clause);

  -- ── Permissions ──────────────────────────────────────────────────────────
  -- Default-revoke from PUBLIC; grant EXECUTE only to service_role. The
  -- applier runs under service_role; anon + authenticated never invoke this
  -- (it would otherwise be a moderation bypass surface).
  revoke all on function public.apply_canonical_meaning_enrichment(
    uuid, text, text, text, text, text, numeric, boolean, smallint, text, jsonb, jsonb, timestamptz
  ) from public;

  grant execute on function public.apply_canonical_meaning_enrichment(
    uuid, text, text, text, text, text, numeric, boolean, smallint, text, jsonb, jsonb, timestamptz
  ) to service_role;

  comment on function public.apply_canonical_meaning_enrichment(
    uuid, text, text, text, text, text, numeric, boolean, smallint, text, jsonb, jsonb, timestamptz
  ) is
    'Atomic monotonic UPSERT into canonical_name_meanings + audit row in canonical_name_meaning_attempts. Returns jsonb {outcome, detail, cnm_id}. SECURITY DEFINER; grant to service_role only.';
end
$migration$;

notify pgrst, 'reload schema';
