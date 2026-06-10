-- ============================================================
-- 20260622_remove_match_for_name_rpc.sql
--
-- Server-side match removal for the un-like flow.
--
-- Problem
-- -------
-- SwipeService.unlikeName() flipped the caller's swipe to left/unliked and
-- then ran a client-side `delete from matches` for the (room, name). But
-- 20260516 revoked INSERT/UPDATE/DELETE on public.matches from the
-- `authenticated` role (matches are written only by the SECURITY DEFINER
-- check_and_create_match RPC). So the client delete was denied/no-op and the
-- match with the partner survived the un-like.
--
-- Fix
-- ---
-- A SECURITY DEFINER mirror of check_and_create_match: validates the caller
-- is a member of the room, confirms the caller no longer likes the name
-- (their swipe is not 'right' — i.e. the un-like already landed), then
-- removes the (room, name) match. Runs as owner, so it bypasses the
-- authenticated-role DELETE revoke without granting clients direct DELETE.
--
-- Idempotent: deleting an absent match is a no-op; safe to call repeatedly.
-- ============================================================

begin;

create or replace function public.remove_match_for_name(
  p_room_id uuid,
  p_name_id text
)
returns boolean as $$
declare
  v_room    public.rooms;
  v_user_id uuid;
begin
  -- Identity from the session, never the client.
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  select * into v_room from public.rooms where id = p_room_id;
  if v_room.id is null then
    return false;
  end if;

  -- Caller must be a member of the room.
  if v_room.user1_id <> v_user_id and v_room.user2_id <> v_user_id then
    return false;
  end if;

  -- Hardening: only remove the match once the caller has actually withdrawn
  -- their like. If their swipe for this name is still 'right', do nothing —
  -- this prevents tearing down a still-mutual match.
  if exists (
    select 1
    from public.swipes
    where room_id = p_room_id
      and user_id = v_user_id
      and name_id = p_name_id
      and direction = 'right'
  ) then
    return false;
  end if;

  delete from public.matches
  where room_id = p_room_id
    and name_id = p_name_id;

  return true;
end;
$$ language plpgsql security definer set search_path = '';

revoke execute on function public.remove_match_for_name(uuid, text) from public;
revoke execute on function public.remove_match_for_name(uuid, text) from anon;
grant execute on function public.remove_match_for_name(uuid, text) to authenticated;

commit;

notify pgrst, 'reload schema';
