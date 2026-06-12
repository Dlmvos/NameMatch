-- ============================================================
-- 20260623_name_meaning_suggestions.sql
--
-- Community "Suggest a meaning" path. User-submitted meanings land in a
-- SEPARATE table and NEVER feed the app's meaning display. A moderator
-- reviews each one; approving promotes it into canonical_name_meanings via
-- the existing apply_canonical_meaning_enrichment RPC at source_priority 2 /
-- review_status 'approved' (so it wins over Wikidata=3 and AI=6 and is locked
-- from future automated overwrites).
--
-- Keeping suggestions out of canonical_name_meanings is deliberate: the app's
-- meaning resolution shows any CNM row where review_status <> 'rejected', so a
-- pending suggestion parked there would go live unvetted. A dedicated table
-- avoids that entirely.
--
-- Idempotent: guarded with IF NOT EXISTS / DO blocks / CREATE OR REPLACE.
-- ============================================================

begin;

-- 1. Table ---------------------------------------------------------------
create table if not exists public.name_meaning_suggestions (
  id                 uuid primary key default extensions.gen_random_uuid(),
  canonical_name_id  uuid not null references public.canonical_names(id) on delete cascade,
  suggested_meaning  text not null,
  suggested_origin   text,
  meaning_language   text not null default 'en',
  submitted_by       uuid references auth.users(id) on delete set null,
  status             text not null default 'pending'
                       check (status in ('pending', 'approved', 'rejected')),
  moderator_note     text,
  reviewed_by        uuid references auth.users(id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint name_meaning_suggestions_meaning_len
    check (char_length(btrim(suggested_meaning)) between 3 and 280),
  constraint name_meaning_suggestions_origin_len
    check (suggested_origin is null or char_length(suggested_origin) <= 60)
);

-- Moderation queue lookups + per-name browsing.
create index if not exists idx_nms_status_created
  on public.name_meaning_suggestions (status, created_at);
create index if not exists idx_nms_canonical
  on public.name_meaning_suggestions (canonical_name_id);

-- At most ONE pending suggestion per (name, user) — kills accidental/spam dupes.
create unique index if not exists uq_nms_one_pending_per_user_name
  on public.name_meaning_suggestions (canonical_name_id, submitted_by)
  where status = 'pending';

-- 2. RLS -----------------------------------------------------------------
alter table public.name_meaning_suggestions enable row level security;

-- Users may read ONLY their own submissions (privacy; no browsing others').
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'name_meaning_suggestions'
      and policyname = 'nms_select_own'
  ) then
    create policy nms_select_own
      on public.name_meaning_suggestions
      for select
      to authenticated
      using (submitted_by = auth.uid());
  end if;
end$$;

-- No direct INSERT/UPDATE/DELETE policies: writes go through the SECURITY
-- DEFINER RPCs below. service_role (moderation tooling) bypasses RLS.

-- 3. Submit RPC ----------------------------------------------------------
create or replace function public.suggest_name_meaning(
  p_canonical_name_id uuid,
  p_meaning           text,
  p_origin            text default null,
  p_language          text default 'en'
)
returns public.name_meaning_suggestions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_meaning text := btrim(coalesce(p_meaning, ''));
  v_origin  text := nullif(btrim(coalesce(p_origin, '')), '');
  v_lang    text := lower(nullif(btrim(coalesce(p_language, 'en')), ''));
  v_pending int;
  v_row     public.name_meaning_suggestions;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from public.canonical_names where id = p_canonical_name_id) then
    raise exception 'Unknown name';
  end if;

  if char_length(v_meaning) < 3 or char_length(v_meaning) > 280 then
    raise exception 'Meaning must be 3-280 characters';
  end if;

  -- Global anti-spam: cap the number of open (pending) suggestions per user.
  select count(*) into v_pending
  from public.name_meaning_suggestions
  where submitted_by = v_uid and status = 'pending';
  if v_pending >= 25 then
    raise exception 'Too many pending suggestions; please wait for review';
  end if;

  begin
    insert into public.name_meaning_suggestions (
      canonical_name_id, suggested_meaning, suggested_origin,
      meaning_language, submitted_by, status
    )
    values (
      p_canonical_name_id, v_meaning, v_origin,
      coalesce(v_lang, 'en'), v_uid, 'pending'
    )
    returning * into v_row;
  exception when unique_violation then
    raise exception 'You already have a pending suggestion for this name';
  end;

  return v_row;
end;
$$;

revoke all on function public.suggest_name_meaning(uuid, text, text, text) from public;
revoke all on function public.suggest_name_meaning(uuid, text, text, text) from anon;
grant execute on function public.suggest_name_meaning(uuid, text, text, text) to authenticated;

-- 4. Moderation queue view ----------------------------------------------
-- security_invoker so the underlying RLS applies to the caller; without it a
-- classic view runs as owner and would leak all pending rows to any
-- authenticated user. Moderators read it via service_role (bypasses RLS).
create or replace view public.name_meaning_suggestion_queue
with (security_invoker = true) as
select
  s.id,
  s.canonical_name_id,
  cn.display_name,
  cn.gender,
  s.suggested_meaning,
  s.suggested_origin,
  s.meaning_language,
  s.submitted_by,
  s.created_at
from public.name_meaning_suggestions s
join public.canonical_names cn on cn.id = s.canonical_name_id
where s.status = 'pending'
order by s.created_at asc;

revoke all on public.name_meaning_suggestion_queue from anon, authenticated;

-- 5. Review/promote RPC (moderators only; run via service_role) -----------
--   p_decision = 'approve' | 'reject'
--   On approve, p_final_meaning/p_final_origin let the moderator edit the
--   user's text before publishing; if null, the user's text is used as-is.
create or replace function public.review_name_meaning_suggestion(
  p_id            uuid,
  p_decision      text,
  p_final_meaning text default null,
  p_final_origin  text default null,
  p_note          text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s       public.name_meaning_suggestions;
  v_meaning text;
  v_origin  text;
  v_apply   jsonb;
begin
  select * into v_s from public.name_meaning_suggestions where id = p_id;
  if v_s.id is null then
    return jsonb_build_object('outcome', 'error', 'detail', 'suggestion_not_found');
  end if;
  if v_s.status <> 'pending' then
    return jsonb_build_object('outcome', 'error', 'detail', 'already_reviewed',
                              'status', v_s.status);
  end if;

  if p_decision = 'reject' then
    update public.name_meaning_suggestions
      set status = 'rejected', moderator_note = p_note,
          reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
      where id = p_id;
    return jsonb_build_object('outcome', 'rejected', 'id', p_id);
  end if;

  if p_decision <> 'approve' then
    return jsonb_build_object('outcome', 'error', 'detail', 'bad_decision');
  end if;

  v_meaning := btrim(coalesce(p_final_meaning, v_s.suggested_meaning));
  v_origin  := nullif(btrim(coalesce(p_final_origin, v_s.suggested_origin, '')), '');

  -- Promote into canonical_name_meanings at the human-reviewed tier.
  v_apply := public.apply_canonical_meaning_enrichment(
    v_s.canonical_name_id,
    v_meaning,
    v_origin,
    'any',
    v_s.meaning_language,
    'user:suggestion',
    0.9,
    true,
    2::smallint,
    'approved',
    jsonb_build_object(
      'enrichment_stage', 'user_suggestion',
      'suggestion_id', v_s.id,
      'submitted_by', v_s.submitted_by
    )
  );

  update public.name_meaning_suggestions
    set status = 'approved', moderator_note = p_note,
        reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    where id = p_id;

  return jsonb_build_object('outcome', 'approved', 'id', p_id, 'apply', v_apply);
end;
$$;

revoke all on function public.review_name_meaning_suggestion(uuid, text, text, text, text) from public;
revoke all on function public.review_name_meaning_suggestion(uuid, text, text, text, text) from anon;
revoke all on function public.review_name_meaning_suggestion(uuid, text, text, text, text) from authenticated;
grant execute on function public.review_name_meaning_suggestion(uuid, text, text, text, text) to service_role;

comment on table public.name_meaning_suggestions is
  'User-submitted name meanings awaiting moderation. Never displayed directly; approved rows are promoted into canonical_name_meanings (priority 2, approved) by review_name_meaning_suggestion().';

commit;

notify pgrst, 'reload schema';
