-- ============================================================
-- Migration: Security Advisor fixes
-- Date: 2026-05-06
--
-- Resolves 8 RLS errors + 9 SECURITY DEFINER warnings flagged
-- by Supabase Security Advisor.
--
-- WHAT THIS DOES:
--   1. Enables + forces RLS on every public table that is missing it
--   2. Adds read policy for `names` table (app queries it)
--   3. Locks legacy/unused tables (no policies = no client access)
--   4. Sets search_path = '' on all SECURITY DEFINER functions
--   5. Restricts EXECUTE grants to only the roles that need them
--
-- SAFE TO RE-RUN: all statements are idempotent.
-- ============================================================

begin;

-- ────────────────────────────────────────────────────────────
-- 1. ENABLE + FORCE RLS ON ALL FLAGGED TABLES
--    Idempotent — no-op if already enabled/forced.
-- ────────────────────────────────────────────────────────────

-- Active tables (app uses these)
alter table public.baby_names enable row level security;
alter table public.baby_names force row level security;
alter table public.matches    enable row level security;
alter table public.matches    force row level security;
alter table public.purchases  enable row level security;
alter table public.purchases  force row level security;
alter table public.names      enable row level security;
alter table public.names      force row level security;

-- Legacy tables (app no longer references these)
alter table public.users          enable row level security;
alter table public.users          force row level security;
alter table public.pack_purchases enable row level security;
alter table public.pack_purchases force row level security;
alter table public.name_packs     enable row level security;
alter table public.name_packs     force row level security;


-- ────────────────────────────────────────────────────────────
-- 2. POLICY FOR `names` TABLE
--    The app queries this table via supabase.from('names').select()
--    so authenticated users need SELECT access.
-- ────────────────────────────────────────────────────────────

drop policy if exists "Authenticated users can read names" on public.names;
create policy "Authenticated users can read names"
  on public.names for select
  using (auth.uid() is not null);


-- ────────────────────────────────────────────────────────────
-- 3. LEGACY TABLES — NO POLICIES
--    RLS is enabled above with zero policies, which means
--    all client access is blocked. This is intentional:
--    these tables are unused by the app and should not be
--    readable or writable from the client.
--    Service-role connections bypass RLS and are unaffected.
-- ────────────────────────────────────────────────────────────
-- (users, pack_purchases, name_packs — nothing to add)


-- ────────────────────────────────────────────────────────────
-- 4. SECURITY DEFINER FUNCTIONS — set search_path = ''
--    Production currently has search_path=public on three of
--    four functions. Setting to '' prevents search-path hijack.
--    All table references are fully qualified (public.X).
-- ────────────────────────────────────────────────────────────

-- handle_new_user: trigger-only, never called as RPC
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- check_and_create_match: called via supabase.rpc() by authenticated users
create or replace function public.check_and_create_match(
  p_room_id uuid,
  p_name_id uuid,
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

-- consume_free_swipe: called via supabase.rpc() by authenticated users.
-- Confirmed SECURITY DEFINER in production — preserved here.
-- DROP first: production return type may differ; CREATE OR REPLACE cannot change it.
drop function if exists public.consume_free_swipe(integer);
create or replace function public.consume_free_swipe(
  p_amount integer default 1
)
returns integer as $$
declare
  v_remaining integer;
  v_amount integer := greatest(1, coalesce(p_amount, 1));
begin
  if auth.uid() is null then
    return null;
  end if;

  update public.profiles
  set free_swipes_remaining = greatest(0, free_swipes_remaining - v_amount),
      updated_at = now()
  where id = auth.uid()
    and free_swipes_remaining > 0
  returning free_swipes_remaining into v_remaining;

  return v_remaining;
end;
$$ language plpgsql security definer set search_path = '';

-- delete_own_account: re-created for consistency so search_path = ''
-- is guaranteed. Body unchanged from schema.sql.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.matches m
  using public.rooms r
  where m.room_id = r.id
    and r.user2_id = v_uid;

  delete from auth.users where id = v_uid;
end;
$$;


-- ────────────────────────────────────────────────────────────
-- 5. RESTRICT EXECUTE GRANTS
--    Revoke from public (catches anonymous) and grant only to
--    the roles that actually need each function.
-- ────────────────────────────────────────────────────────────

-- handle_new_user — trigger-only, NEVER called as an RPC.
-- No role should be able to call it directly.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- check_and_create_match — called by signed-in users after swiping.
revoke execute on function public.check_and_create_match(uuid, uuid, uuid) from public;
revoke execute on function public.check_and_create_match(uuid, uuid, uuid) from anon;
grant  execute on function public.check_and_create_match(uuid, uuid, uuid) to authenticated;

-- consume_free_swipe — called by signed-in users during swiping.
revoke execute on function public.consume_free_swipe(integer) from public;
revoke execute on function public.consume_free_swipe(integer) from anon;
grant  execute on function public.consume_free_swipe(integer) to authenticated;

-- delete_own_account — called by signed-in users from settings.
revoke execute on function public.delete_own_account() from public;
revoke execute on function public.delete_own_account() from anon;
grant  execute on function public.delete_own_account() to authenticated;

commit;
