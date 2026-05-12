begin;

drop function if exists public.check_and_create_match(uuid, uuid, uuid);
drop function if exists public.check_and_create_match(uuid, text, uuid);

create or replace function public.check_and_create_match(
  p_room_id uuid,
  p_name_id text,
  p_user_id uuid
)
returns boolean as $$
declare
  v_room public.rooms;
  v_user_id uuid;
  v_other_user_id uuid;
  v_user_swiped_right boolean;
  v_other_swiped_right boolean;
begin
  -- Get the room
  select * into v_room from public.rooms where id = p_room_id;

  if v_room.id is null then
    return false;
  end if;

  -- Never trust the client-supplied p_user_id; derive identity from auth.uid().
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  -- Find the other user
  if v_room.user1_id = v_user_id then
    v_other_user_id := v_room.user2_id;
  elsif v_room.user2_id = v_user_id then
    v_other_user_id := v_room.user1_id;
  else
    return false; -- Invoker isn't a member of this room
  end if;

  if v_other_user_id is null then
    return false; -- Partner hasn't joined yet
  end if;

  -- Hardening: only allow match creation if the caller already swiped right
  -- for this room/name. This reduces reliance on client orchestration/timing.
  select exists(
    select 1 from public.swipes
    where user_id = v_user_id
      and room_id = p_room_id
      and name_id = p_name_id
      and direction = 'right'
  ) into v_user_swiped_right;

  if not v_user_swiped_right then
    return false;
  end if;

  -- Check if the other user also swiped right on this name
  select exists(
    select 1 from public.swipes
    where user_id = v_other_user_id
      and room_id = p_room_id
      and name_id = p_name_id
      and direction = 'right'
  ) into v_other_swiped_right;

  if v_other_swiped_right then
    -- Create match (ignore if already exists)
    insert into public.matches (room_id, name_id)
    values (p_room_id, p_name_id)
    on conflict (room_id, name_id) do nothing;
    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer set search_path = '';

revoke execute on function public.check_and_create_match(uuid, text, uuid) from public;
revoke execute on function public.check_and_create_match(uuid, text, uuid) from anon;
grant execute on function public.check_and_create_match(uuid, text, uuid) to authenticated;

commit;
