-- ============================================================
-- Phase C follow-up: distinguish carry-forward matches from
-- live swipe matches so the client can suppress the per-match
-- celebration overlay when the CarryForwardModal is already
-- handling the bulk announcement.
--
-- Without this, the host (User A) experiences N realtime payloads
-- in rapid succession when the merge RPC fires, and each one
-- overwrites setLatestMatch — only the last name (or none) shows
-- as a MatchCelebration, producing the "Noah only" symptom Daan
-- reported on 2026-06-16 smoke testing build 26.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Add created_via column with a CHECK constraint covering
--    the three legitimate sources: live swipe (default), the
--    pairing carry-forward RPC, or a custom-name-creation path.
-- ─────────────────────────────────────────────────────────────
alter table public.matches
  add column if not exists created_via text not null default 'swipe';

-- The CHECK is added in a separate ALTER so we can drop & recreate
-- it idempotently across migration replays without colliding on
-- the constraint name when running --include-all.
alter table public.matches
  drop constraint if exists matches_created_via_check;
alter table public.matches
  add constraint matches_created_via_check
  check (created_via in ('swipe', 'carry_forward', 'custom_name'));

comment on column public.matches.created_via is
  'How this match row was created. ''swipe'' (default) = both partners independently swiped right in the room. ''carry_forward'' = inserted by merge_solo_into_room_after_join after partner pairing. ''custom_name'' = inserted alongside a custom name suggestion. Client realtime callback checks this field to decide whether to fire the per-match MatchCelebration overlay; ''carry_forward'' matches suppress the overlay since the CarryForwardModal is the announcement for that batch.';

-- ─────────────────────────────────────────────────────────────
-- 2. Replace merge_solo_into_room_after_join so the inserts
--    are tagged as 'carry_forward'. Body is identical to the
--    Phase C version except for the INSERT column list.
-- ─────────────────────────────────────────────────────────────
create or replace function public.merge_solo_into_room_after_join(
  p_target_room_id uuid,
  p_source_room_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_target_user1 uuid;
  v_target_user2 uuid;
  v_source_user1 uuid;
  v_source_user2 uuid;
  v_new_match_count integer := 0;
begin
  if v_caller_id is null then
    raise exception 'merge_solo_into_room_after_join: not authenticated';
  end if;

  select user1_id, user2_id into v_target_user1, v_target_user2
    from public.rooms where id = p_target_room_id;
  if v_target_user1 is null then
    raise exception 'merge_solo_into_room_after_join: target room not found';
  end if;
  if v_target_user2 is distinct from v_caller_id then
    raise exception 'merge_solo_into_room_after_join: caller is not user2 of target room';
  end if;

  if p_source_room_id is null then
    insert into public.matches (room_id, name_id, created_via)
      select p_target_room_id, s1.name_id, 'carry_forward'
      from public.swipes s1
      join public.swipes s2
        on s2.room_id = s1.room_id
       and s2.name_id = s1.name_id
       and s2.user_id <> s1.user_id
      where s1.room_id = p_target_room_id
        and coalesce(s1.liked, false) = true
        and coalesce(s2.liked, false) = true
      group by s1.name_id
      on conflict (room_id, name_id) do nothing;
    get diagnostics v_new_match_count = row_count;

    update public.profiles
      set pending_carry_forward_count = v_new_match_count
      where id in (v_target_user1, v_target_user2);
    return v_new_match_count;
  end if;

  select user1_id, user2_id into v_source_user1, v_source_user2
    from public.rooms where id = p_source_room_id;
  if v_source_user1 is distinct from v_caller_id then
    raise exception 'merge_solo_into_room_after_join: caller is not user1 of source room';
  end if;
  if v_source_user2 is not null then
    raise exception 'merge_solo_into_room_after_join: source room is not solo (user2 already set)';
  end if;
  if p_source_room_id = p_target_room_id then
    raise exception 'merge_solo_into_room_after_join: source equals target';
  end if;

  insert into public.swipes (user_id, room_id, name_id, direction, liked, note, created_at)
    select user_id, p_target_room_id, name_id, direction, liked, note, created_at
    from public.swipes
    where user_id = v_caller_id
      and room_id = p_source_room_id
    on conflict (user_id, room_id, name_id) do nothing;

  delete from public.swipes
    where user_id = v_caller_id
      and room_id = p_source_room_id;

  insert into public.matches (room_id, name_id, created_via)
    select p_target_room_id, s1.name_id, 'carry_forward'
    from public.swipes s1
    join public.swipes s2
      on s2.room_id = s1.room_id
     and s2.name_id = s1.name_id
     and s2.user_id <> s1.user_id
    where s1.room_id = p_target_room_id
      and coalesce(s1.liked, false) = true
      and coalesce(s2.liked, false) = true
    group by s1.name_id
    on conflict (room_id, name_id) do nothing;
  get diagnostics v_new_match_count = row_count;

  update public.rooms set is_active = false where id = p_source_room_id;

  update public.profiles
    set pending_carry_forward_count = v_new_match_count
    where id in (v_target_user1, v_target_user2);

  return v_new_match_count;
end;
$$;
