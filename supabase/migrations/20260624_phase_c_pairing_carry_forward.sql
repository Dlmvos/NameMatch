-- ============================================================
-- Phase C: Pairing carry-forward + persistent notes
-- ============================================================
-- When two users pair, the joiner's pre-pairing solo-room swipes are
-- moved into the shared room, the matches table is recomputed against
-- BOTH users' likes, and a `pending_carry_forward_count` is stamped on
-- both profiles so the client can show a "X new matches from your past
-- likes!" modal on next app open.
--
-- Also adds the `note` column to `swipes` so notes typed on the Liked
-- Names tab persist to the backend (previously AsyncStorage-only,
-- non-syncing).
--
-- Design choices:
--   - Solo rooms are soft-archived via the existing `rooms.is_active`
--     column (no new archived_at needed). Daan picked Option B
--     (soft-archive over hard delete) for audit + future "unpair".
--   - Notes attach to the swipe row (one ALTER, one RLS policy already
--     covers it via "Users can update their own swipes").
--   - Carry-forward modal trigger: profiles.pending_carry_forward_count
--     int NULL. NULL = no pending notice. Non-NULL = show modal (0 is
--     valid — "no matches yet from past likes" friendly message).
--     Server-owned write via merge RPC; client dismiss zeros it via
--     a dedicated dismiss RPC.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Swipes: note column for persistent per-swipe notes
-- ─────────────────────────────────────────────────────────────
alter table public.swipes
  add column if not exists note text;

comment on column public.swipes.note is
  'Optional free-text note attached to a like. Edited from the Liked Names tab. NULL when the user has not added a note. RLS allows the row owner to update.';

-- ─────────────────────────────────────────────────────────────
-- 2. Profiles: pending carry-forward count (server-set, client-cleared)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists pending_carry_forward_count integer;

comment on column public.profiles.pending_carry_forward_count is
  'Non-NULL when the user should see the post-pair carry-forward celebration modal. Value is the number of NEW matches created by recomputing against the partner''s likes. 0 is valid (no new matches yet). NULL = nothing pending. Server-written by merge_solo_into_room_after_join(); client-cleared by dismiss_carry_forward_notice().';

-- Tighten the profile update policy so clients can only RESET this to
-- NULL (dismiss), never set a non-null value. Server-owned via RPC.
--
-- Implementation note: rather than DROP + RECREATE the existing
-- "Users can update own profile" policy (which would require us to
-- replicate the FULL set of column-level constraints already in force
-- on the remote DB — and risk leaving the table policy-less if the
-- recreate fails), we add a SEPARATE RESTRICTIVE policy. Postgres ANDs
-- restrictive policies with the existing permissive policy, so this
-- adds an additional WITH CHECK on top of whatever else is enforced.
-- Safe across schema drift between schema.sql and remote.
drop policy if exists "Carry-forward notice is server-owned" on public.profiles;
create policy "Carry-forward notice is server-owned"
  on public.profiles as restrictive for update
  using (auth.uid() = id)
  with check (
    -- Clients may NULL the column (dismiss the modal) or leave it
    -- unchanged. Any other value (forging a non-null number to trigger
    -- a spurious modal) is rejected. SECURITY DEFINER RPCs bypass RLS,
    -- so merge_solo_into_room_after_join can still stamp the column.
    pending_carry_forward_count IS NULL
    OR pending_carry_forward_count IS NOT DISTINCT FROM (
      select p.pending_carry_forward_count from public.profiles p where p.id = id
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. RPC: merge_solo_into_room_after_join
--
-- Called by the client immediately after RoomService.joinRoom has
-- already (a) set target_room.user2_id and (b) updated profile.room_id.
-- Idempotent: safe to call again if the client retries.
--
-- Inputs:
--   p_target_room_id: the now-shared room (caller is user2 here)
--   p_source_room_id: caller's previous solo room (will be archived)
--
-- Steps:
--   1. Verify caller is user2 of target room AND user1 of source room
--      AND source room is solo (user2 is null). Reject otherwise.
--   2. Migrate caller's swipes from source → target. ON CONFLICT DO
--      NOTHING (caller can't have swiped same name in two rooms because
--      target was their partner's solo room before join, and their own
--      swipes were in source; no overlap on (user_id, room_id, name_id)).
--   3. Recompute matches: any name where BOTH room members swiped
--      liked=true. ON CONFLICT DO NOTHING.
--   4. Soft-archive source room (is_active = false).
--   5. Stamp pending_carry_forward_count on BOTH user1 and user2
--      profiles (symmetric notice — both see "X new matches" because
--      the carry-forward is symmetric: partner's likes were already in
--      target room, the joiner just contributed theirs).
--
-- Returns: number of NEW matches created.
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

  -- Resolve room ownerships (bypassing RLS via security definer)
  select user1_id, user2_id into v_target_user1, v_target_user2
    from public.rooms where id = p_target_room_id;
  if v_target_user1 is null then
    raise exception 'merge_solo_into_room_after_join: target room not found';
  end if;
  if v_target_user2 is distinct from v_caller_id then
    raise exception 'merge_solo_into_room_after_join: caller is not user2 of target room';
  end if;

  -- Source room may legitimately not exist (caller never created a solo
  -- room — e.g., they signed up via a deep-link and went straight to a
  -- partner's room). Treat as a no-op carry-forward in that case.
  if p_source_room_id is null then
    -- Still recompute matches against target (caller may have swiped
    -- after join but before this RPC fires, though unlikely).
    insert into public.matches (room_id, name_id)
      select p_target_room_id, s1.name_id
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

  -- Migrate caller's solo-room swipes into the shared room. Use
  -- ON CONFLICT to be idempotent even though collision shouldn't be
  -- possible (target room had no caller swipes pre-join).
  insert into public.swipes (user_id, room_id, name_id, direction, liked, note, created_at)
    select user_id, p_target_room_id, name_id, direction, liked, note, created_at
    from public.swipes
    where user_id = v_caller_id
      and room_id = p_source_room_id
    on conflict (user_id, room_id, name_id) do nothing;

  -- Remove originals from solo room (no longer needed; solo room
  -- archives next).
  delete from public.swipes
    where user_id = v_caller_id
      and room_id = p_source_room_id;

  -- Recompute matches: name_ids where BOTH room members swiped liked.
  insert into public.matches (room_id, name_id)
    select p_target_room_id, s1.name_id
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

  -- Soft-archive the source (solo) room.
  update public.rooms set is_active = false where id = p_source_room_id;

  -- Symmetric notice: BOTH partners see "X new matches" on next app
  -- open. Symmetric because the carry-forward is symmetric — by the
  -- time the joiner enters their partner's room, the host's likes are
  -- already there; the joiner's likes complete the picture.
  update public.profiles
    set pending_carry_forward_count = v_new_match_count
    where id in (v_target_user1, v_target_user2);

  return v_new_match_count;
end;
$$;

revoke all on function public.merge_solo_into_room_after_join(uuid, uuid) from public;
grant execute on function public.merge_solo_into_room_after_join(uuid, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. RPC: dismiss_carry_forward_notice
--
-- Client calls this when the user taps "OK" / closes the modal.
-- Idempotent (multiple calls just keep the column NULL).
-- ─────────────────────────────────────────────────────────────
create or replace function public.dismiss_carry_forward_notice()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'dismiss_carry_forward_notice: not authenticated';
  end if;
  update public.profiles
    set pending_carry_forward_count = null
    where id = auth.uid();
end;
$$;

revoke all on function public.dismiss_carry_forward_notice() from public;
grant execute on function public.dismiss_carry_forward_notice() to authenticated;
