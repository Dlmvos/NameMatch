-- ============================================================
-- 20260628_profiles_entitlement_column_lockdown.sql
--
-- Closes the C1 finding from the 2026-06-21 and 2026-06-24 audits:
--
--   A signed-in (authenticated) user could call
--
--     supabase.from('profiles')
--       .update({
--         purchased_packs: ['PREMIUM_COUPLE'],
--         free_swipes_remaining: 999999
--       })
--       .eq('id', myUid)
--
--   and grant themselves premium + unlimited swipes via a single direct
--   PostgREST UPDATE. The "Users can update own profile" RLS policy
--   (using/with_check = `auth.uid() = id`) does NOT pin entitlement
--   columns, and `authenticated` held column-level UPDATE privilege on
--   them. Worse, `grant_room_premium` reads `profiles.purchased_packs`
--   when intersecting requested packs with the caller's owned packs,
--   so forged packs also unlock premium for the whole room.
--
-- Fix: revoke column-level UPDATE on the four entitlement / economy
-- columns from the `authenticated` and `anon` API roles. The legitimate
-- writers — `consume_free_swipe`, `maybe_refill_daily_free_swipes`,
-- `dismiss_carry_forward_notice`, `grant_room_premium`, the
-- `grant-premium` and `sync-revenuecat-entitlement` edge functions —
-- all run as SECURITY DEFINER (function owner) or via the service-role
-- key, neither of which respects per-role column grants. So this REVOKE
-- closes the API-layer hole without breaking any real write path.
--
-- Verified pre-flight (2026-06-24): zero client code in `src/` performs
-- `.update()` on these columns; every read of them is SELECT-only.
--
-- Defense-in-depth: also drop the broken "Carry-forward notice is
-- server-owned" UPDATE policy (L2 from the same audit). It's a
-- PERMISSIVE policy on `profiles` with a self-referential, always-true
-- subquery (`WHERE p.id = p.id`), so it OR-combined with the main
-- update policy and restricted nothing. With the column REVOKE landing,
-- the policy is structurally redundant and misleading.
-- ============================================================

begin;

revoke update (
  purchased_packs,
  free_swipes_remaining,
  free_swipes_last_refill_utc_date,
  pending_carry_forward_count
) on public.profiles from authenticated, anon;

-- Best-effort drop — the policy may have been renamed or already gone
-- depending on history.
do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Carry-forward notice is server-owned'
  ) then
    drop policy "Carry-forward notice is server-owned" on public.profiles;
  end if;
end $$;

commit;
