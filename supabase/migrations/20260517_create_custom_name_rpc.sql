-- SECURITY DEFINER RPC for user-authored custom baby_names rows.
-- Direct INSERT can fail with RLS 42501 when the PostgREST JWT/session does not
-- match policy expectations; server-side insert validates membership and writes a fixed shape.

begin;

create or replace function public.create_custom_name(
  p_name text,
  p_gender text,
  p_room_id uuid,
  p_region text,
  p_country text
)
returns public.baby_names
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms;
  v_trim text := btrim(coalesce(p_name, ''));
  v_country text := nullif(btrim(coalesce(p_country, '')), '');
  v_row public.baby_names;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if length(v_trim) = 0 or length(v_trim) > 120 then
    raise exception 'Invalid name';
  end if;

  if p_gender not in ('boy', 'girl', 'neutral') then
    raise exception 'Invalid gender';
  end if;

  if p_region not in ('EU', 'US', 'ARABIA', 'MENA', 'ASIA', 'LATIN_AMERICA', 'WORLDWIDE') then
    raise exception 'Invalid region';
  end if;

  select * into v_room from public.rooms where id = p_room_id;

  if v_room.id is null then
    raise exception 'Room not found';
  end if;

  if v_room.user1_id is distinct from v_uid and v_room.user2_id is distinct from v_uid then
    raise exception 'Not a room member';
  end if;

  insert into public.baby_names (
    name,
    meaning,
    origin,
    gender,
    country,
    region,
    is_worldwide,
    is_premium,
    meaning_verified
  )
  values (
    v_trim,
    '',
    'Custom',
    p_gender,
    v_country,
    p_region,
    false,
    false,
    false
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_custom_name(text, text, uuid, text, text) from public;
revoke all on function public.create_custom_name(text, text, uuid, text, text) from anon;
grant execute on function public.create_custom_name(text, text, uuid, text, text) to authenticated;

commit;
