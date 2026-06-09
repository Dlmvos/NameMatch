-- ============================================================
-- 20260621_apply_enrichment_conflict_target_fix.sql
--
-- Fixes apply_canonical_meaning_enrichment so it matches the table's
-- real unique key.
--
-- Background
-- ----------
-- canonical_name_meanings enforces ONE meaning per
--   (canonical_name_id, meaning_language, gender_scope)
-- via the (misleadingly named) unique index
--   canonical_name_meanings_canonical_name_id_meaning_language__key
--   = UNIQUE (canonical_name_id, meaning_language, gender_scope).
--
-- But apply_canonical_meaning_enrichment (20260615) used
--   ON CONFLICT (canonical_name_id, meaning_language, gender_scope,
--                meaning, meaning_source)
-- i.e. a 5-column target backed by idx_canonical_name_meanings_source_unique.
-- When a (name, language, gender) slot already held a row, applying a row
-- with a different meaning/source did NOT match the 5-col conflict target,
-- so the INSERT hit the stricter 3-col unique and raised 23505 instead of
-- upgrading. This broke the intended curated > wikidata > LLM upgrade path
-- for every already-populated name.
--
-- Fix
-- ---
--   1. Drop the redundant 5-col unique index (the 3-col key is stricter and
--      is the model we actually want: one meaning per name+language+gender).
--   2. Replace the RPC to conflict on (canonical_name_id, meaning_language,
--      gender_scope) with a monotonic "best wins" merge:
--        * a strictly better (lower) source_priority replaces the displayed
--          meaning + meaning_source;
--        * meaning_confidence = GREATEST, meaning_verified = OR,
--          source_priority = LEAST;
--        * human review_status ('approved'/'rejected') is immutable and its
--          meaning/source are never overwritten by the pipeline;
--        * context is concatenated.
--
-- There is no `origin` column on canonical_name_meanings, so p_origin is
-- accepted (signature preserved for callers) but not stored.
--
-- Idempotent: re-runs are no-ops. Existing data already has <=1 row per
-- (name,language,gender) so no dedup is required.
-- ============================================================

begin;

-- 1. Remove the abandoned 5-col candidate-uniqueness index.
drop index if exists public.idx_canonical_name_meanings_source_unique;

-- 2. Replace the apply RPC with a 3-col conflict target + best-wins merge.
create or replace function public.apply_canonical_meaning_enrichment(
  p_canonical_name_id  uuid,
  p_meaning            text,
  p_origin             text,                 -- accepted, not stored (no origin column)
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
  if p_canonical_name_id is null
     or not exists (select 1 from public.canonical_names where id = p_canonical_name_id) then
    return jsonb_build_object(
      'outcome',           'error',
      'detail',            'canonical_name_not_found',
      'canonical_name_id', p_canonical_name_id
    );
  end if;

  insert into public.canonical_name_meanings (
    canonical_name_id,
    meaning,
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
    p_gender_scope,
    p_meaning_language,
    p_meaning_source,
    p_meaning_confidence,
    coalesce(p_meaning_verified, false),
    coalesce(p_source_priority, 5),
    coalesce(p_review_status, 'auto'),
    coalesce(p_context, '{}'::jsonb)
  )
  on conflict (canonical_name_id, meaning_language, gender_scope)
  do update set
    -- Displayed meaning/source change only when a strictly better (lower)
    -- source_priority arrives AND the row isn't human-locked.
    meaning = case
                when public.canonical_name_meanings.review_status in ('approved','rejected')
                  then public.canonical_name_meanings.meaning
                when coalesce(excluded.source_priority, 9)
                     < coalesce(public.canonical_name_meanings.source_priority, 9)
                  then excluded.meaning
                else public.canonical_name_meanings.meaning
              end,
    meaning_source = case
                when public.canonical_name_meanings.review_status in ('approved','rejected')
                  then public.canonical_name_meanings.meaning_source
                when coalesce(excluded.source_priority, 9)
                     < coalesce(public.canonical_name_meanings.source_priority, 9)
                  then excluded.meaning_source
                else public.canonical_name_meanings.meaning_source
              end,
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
                           || coalesce(excluded.context, '{}'::jsonb),
    updated_at         = now()
  returning id, (xmax = 0) into v_cnm_id, v_was_inserted;

  v_detail := case when v_was_inserted then 'inserted' else 'updated' end;

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
    'outcome',           'success',
    'detail',            v_detail,
    'cnm_id',            v_cnm_id,
    'canonical_name_id', p_canonical_name_id
  );
end;
$body$;

revoke all on function public.apply_canonical_meaning_enrichment(
  uuid, text, text, text, text, text, numeric, boolean, smallint, text, jsonb, jsonb, timestamptz
) from public;

grant execute on function public.apply_canonical_meaning_enrichment(
  uuid, text, text, text, text, text, numeric, boolean, smallint, text, jsonb, jsonb, timestamptz
) to service_role;

comment on function public.apply_canonical_meaning_enrichment(
  uuid, text, text, text, text, text, numeric, boolean, smallint, text, jsonb, jsonb, timestamptz
) is
  'Atomic monotonic UPSERT into canonical_name_meanings keyed on (canonical_name_id, meaning_language, gender_scope). Best-wins: lower source_priority replaces displayed meaning/source; confidence GREATEST, verified OR, priority LEAST; approved/rejected are immutable. Writes audit row to canonical_name_meaning_attempts. SECURITY DEFINER; service_role only.';

commit;

notify pgrst, 'reload schema';
