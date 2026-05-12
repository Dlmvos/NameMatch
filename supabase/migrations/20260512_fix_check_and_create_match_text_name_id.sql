drop function if exists public.check_and_create_match(uuid, uuid, uuid);

create or replace function public.check_and_create_match(
  p_room_id uuid,
  p_name_id text,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner_swiped boolean;
  v_match_exists boolean;
begin
  select exists (
    select 1
    from public.swipes s
    where s.room_id = p_room_id
      and s.name_id = p_name_id
      and s.user_id <> p_user_id
      and s.direction = 'right'
  )
  into v_partner_swiped;

  if not v_partner_swiped then
    return false;
  end if;

  select exists (
    select 1
    from public.matches m
    where m.room_id = p_room_id
      and m.name_id = p_name_id
  )
  into v_match_exists;

  if v_match_exists then
    return true;
  end if;

  insert into public.matches (room_id, name_id)
  values (p_room_id, p_name_id)
  on conflict (room_id, name_id) do nothing;

  return true;
end;
$$;

revoke all on function public.check_and_create_match(uuid, text, uuid) from public;
revoke all on function public.check_and_create_match(uuid, text, uuid) from anon;
grant execute on function public.check_and_create_match(uuid, text, uuid) to authenticated;
