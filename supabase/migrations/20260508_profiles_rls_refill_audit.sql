-- ============================================================
-- Audit follow-up: profiles.update RLS must pin server-owned
-- free_swipes_last_refill_utc_date (same pattern as purchased_packs).
-- SECURITY DEFINER refill/consume RPCs are unchanged and still apply.
-- SAFE TO RE-RUN: idempotent policy replacement.
-- ============================================================

begin;

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Entitlement fields must not be arbitrarily rewritten by clients.
    and purchased_packs = (
      select p.purchased_packs from public.profiles p where p.id = id
    )
    -- Daily refill stamp is server-owned (RPC sets it); block client tampering.
    and free_swipes_last_refill_utc_date is not distinct from (
      select p.free_swipes_last_refill_utc_date from public.profiles p where p.id = id
    )
    -- Only allow free_swipes_remaining to decrease (never increase).
    and free_swipes_remaining >= 0
    and free_swipes_remaining <= (
      select p.free_swipes_remaining from public.profiles p where p.id = id
    )
  );

commit;
