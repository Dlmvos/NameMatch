-- ============================================================
-- Migration: Lock down rooms.premium_packs writes; add grant_room_premium RPC
-- Date: 2026-05-08
--
-- WHY:
--   Premium entitlement is granted to a room (rooms.premium_packs) when an
--   authorised buyer of PREMIUM_COUPLE elects to share Premium with their
--   partner. Today, any room member can write any value to premium_packs
--   directly via PostgREST, which is an entitlement-bypass risk.
--
-- WHAT THIS DOES:
--   1. Adds a BEFORE UPDATE OF premium_packs trigger that rejects writes
--      coming from the authenticated / anon roles. All existing room UPDATE
--      policies are intentionally left untouched — updates that do not
--      change premium_packs continue to behave exactly as before (including
--      the "Joiner can claim empty user2 slot" flow).
--   2. Adds SECURITY DEFINER RPC grant_room_premium(p_room_id, p_premium_packs)
--      that performs the privileged write after verifying:
--        a. caller owns 'PREMIUM_COUPLE' in profiles.purchased_packs
--        b. caller is a member of the target room
--      The function runs as its owner (postgres), so the trigger's
--      current_user check lets it through. Provided packs are merged with
--      the existing set so the call is idempotent.
--   3. Restricts EXECUTE on the RPC to the authenticated role only.
--
-- COMPATIBILITY:
--   - No existing RLS policy is dropped, recreated, or modified.
--   - Other columns on rooms are unaffected (code, user1_id, user2_id,
--     is_active, ...). Existing client UPDATE statements keep working as
--     long as they do not include premium_packs in the SET list.
--   - Service-role connections (current_user = service_role) and direct
--     admin connections (postgres) bypass the guard, preserving migration
--     and back-office tooling behaviour.
--
-- SAFE TO RE-RUN: idempotent.
-- ============================================================

begin;

-- ────────────────────────────────────────────────────────────
-- 1. Trigger: block direct client writes to rooms.premium_packs
-- ────────────────────────────────────────────────────────────
create or replace function public.rooms_guard_premium_packs()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.premium_packs is distinct from OLD.premium_packs
     and current_user in ('authenticated', 'anon')
  then
    raise exception
      'rooms.premium_packs is read-only for clients; use grant_room_premium()'
      using errcode = '42501';  -- insufficient_privilege
  end if;
  return NEW;
end;
$$;

drop trigger if exists rooms_guard_premium_packs on public.rooms;
create trigger rooms_guard_premium_packs
  before update of premium_packs on public.rooms
  for each row
  execute function public.rooms_guard_premium_packs();


-- ────────────────────────────────────────────────────────────
-- 2. RPC: grant_room_premium(p_room_id, p_premium_packs)
--    SECURITY DEFINER so it can bypass the guard trigger.
--    Verifies entitlement + membership before mutating state.
-- ────────────────────────────────────────────────────────────
create or replace function public.grant_room_premium(
  p_room_id        uuid,
  p_premium_packs  text[]
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid           uuid := auth.uid();
  v_owns_premium  boolean;
  v_is_member     boolean;
  v_next_packs    text[];
  v_room          public.rooms;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_room_id is null then
    raise exception 'p_room_id is required' using errcode = '22023';
  end if;

  -- (1) Caller must own PREMIUM_COUPLE in their profile.
  select exists(
    select 1
    from public.profiles p
    where p.id = v_uid
      and 'PREMIUM_COUPLE' = any(coalesce(p.purchased_packs, '{}'::text[]))
  ) into v_owns_premium;

  if not v_owns_premium then
    raise exception 'Caller does not own PREMIUM_COUPLE'
      using errcode = '42501';
  end if;

  -- (2) Caller must belong to the target room.
  select exists(
    select 1
    from public.rooms r
    where r.id = p_room_id
      and (r.user1_id = v_uid or r.user2_id = v_uid)
  ) into v_is_member;

  if not v_is_member then
    raise exception 'Caller is not a member of this room'
      using errcode = '42501';
  end if;

  -- (3) Server-side merge of provided packs with the existing set
  --     so the RPC is idempotent and cannot be used to remove packs.
  select array(
    select distinct x
    from unnest(
      coalesce(r.premium_packs,   '{}'::text[])
      || coalesce(p_premium_packs, '{}'::text[])
    ) as t(x)
    where x is not null and x <> ''
  )
  into v_next_packs
  from public.rooms r
  where r.id = p_room_id;

  -- (4) Privileged update — runs as the function owner, so the
  --     guard trigger lets this through (current_user != authenticated).
  update public.rooms
     set premium_packs = v_next_packs
   where id = p_room_id
   returning * into v_room;

  return v_room;
end;
$$;

revoke execute on function public.grant_room_premium(uuid, text[]) from public;
revoke execute on function public.grant_room_premium(uuid, text[]) from anon;
grant  execute on function public.grant_room_premium(uuid, text[]) to authenticated;

commit;
