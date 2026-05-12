-- Lock down rooms.premium_packs: no direct client writes.
-- Only grant_room_premium (SECURITY DEFINER) and service_role may change it.

begin;

-- ── Trigger: block authenticated users from changing premium_packs directly ──
create or replace function public.rooms_guard_premium_packs()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if v_role = 'service_role' then
    return new;
  end if;
  if coalesce(current_setting('app.internal_grant_room_premium', true), '') = '1' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.premium_packs is distinct from '{}'::text[] then
      raise exception 'rooms.premium_packs: direct insert is not allowed (use default empty array)';
    end if;
    return new;
  end if;

  -- UPDATE OF premium_packs
  if new.premium_packs is not distinct from old.premium_packs then
    return new;
  end if;

  raise exception 'rooms.premium_packs: direct update is not allowed (use grant_room_premium RPC)';
end;
$$;

revoke all on function public.rooms_guard_premium_packs() from public;
revoke all on function public.rooms_guard_premium_packs() from anon, authenticated;

drop trigger if exists rooms_guard_premium_packs on public.rooms;
create trigger rooms_guard_premium_packs
  before insert or update of premium_packs on public.rooms
  for each row
  execute function public.rooms_guard_premium_packs();

-- ── RPC: room members merge premium packs (bypasses trigger via session flag) ──
create or replace function public.grant_room_premium(
  p_room_id uuid,
  p_premium_packs text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing text[];
  v_merged text[];
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.rooms r
    where r.id = p_room_id
      and (r.user1_id = v_uid or r.user2_id = v_uid)
  ) then
    raise exception 'room not found or caller is not a member';
  end if;

  select r.premium_packs
    into v_existing
  from public.rooms r
  where r.id = p_room_id
  for update;

  v_merged := coalesce(
    array(
      select distinct unnest(coalesce(v_existing, '{}'::text[]) || coalesce(p_premium_packs, '{}'::text[]))
    ),
    '{}'::text[]
  );

  if v_merged is not distinct from v_existing then
    return;
  end if;

  perform set_config('app.internal_grant_room_premium', '1', true);

  update public.rooms
  set premium_packs = v_merged
  where id = p_room_id;
end;
$$;

revoke execute on function public.grant_room_premium(uuid, text[]) from public;
revoke execute on function public.grant_room_premium(uuid, text[]) from anon;
grant execute on function public.grant_room_premium(uuid, text[]) to authenticated;

commit;
