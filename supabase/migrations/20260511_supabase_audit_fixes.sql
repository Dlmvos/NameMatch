-- Audited drift fixes: single canonical check_and_create_match(uuid, text, uuid) matching baby_names.name_id text;
-- new-user profile stamp avoids same-day refill double-grant semantics.

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
  select * into v_room from public.rooms where id = p_room_id;

  if v_room.id is null then
    return false;
  end if;

  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  if v_room.user1_id = v_user_id then
    v_other_user_id := v_room.user2_id;
  elsif v_room.user2_id = v_user_id then
    v_other_user_id := v_room.user1_id;
  else
    return false;
  end if;

  if v_other_user_id is null then
    return false;
  end if;

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

  select exists(
    select 1 from public.swipes
    where user_id = v_other_user_id
      and room_id = p_room_id
      and name_id = p_name_id
      and direction = 'right'
  ) into v_other_swiped_right;

  if v_other_swiped_right then
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

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    display_name,
    free_swipes_last_refill_utc_date
  )
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    (timezone('utc', now()))::date
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

commit;
