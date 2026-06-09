-- ============================================================
-- ROLLBACK for 20260507_daily_free_swipe_refill.sql
-- ------------------------------------------------------------
-- Reverts the daily free-swipe refill to the prior lifetime
-- (bank) model. Apply MANUALLY (psql / Supabase SQL editor) —
-- this file lives in migrations_applied_manually/ so it is NOT
-- picked up by `supabase db push` in forward sequence.
--
-- What this does:
--   1. Restores consume_free_swipe to a plain atomic decrement
--      (no daily refill call).
--   2. Drops maybe_refill_daily_free_swipes().
--   3. Leaves free_swipes_last_refill_utc_date in place, inert.
--      Dropping a column is irreversible and the column is
--      harmless when unused.
--
-- Signature note (Option A — see daily-swipe-refill-review.md):
--   The restored function uses the TWO-parameter signature
--   (p_amount, p_local_date). p_local_date is accepted but
--   ignored. PostgREST resolves RPCs by argument name, so this
--   tolerates BOTH a client that sends { p_amount } (the shipped
--   binary) and any client that also sends { p_local_date }.
--   A single-param restore would break the latter. Always keep
--   the rollback at least as permissive as the forward client.
-- ============================================================

begin;

-- 1. Restore the pre-refill decrement behaviour, two-param tolerant.
create or replace function public.consume_free_swipe(
  p_amount integer default 1,
  p_local_date date default current_date  -- accepted but ignored
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

-- Drop the old single-param overload so PostgREST has exactly one
-- consume_free_swipe and cannot raise PGRST203 (ambiguous overload).
drop function if exists public.consume_free_swipe(integer);

revoke all on function public.consume_free_swipe(integer, date) from public;
revoke all on function public.consume_free_swipe(integer, date) from anon;
grant execute on function public.consume_free_swipe(integer, date) to authenticated;

-- 2. Remove the daily-refill helper.
drop function if exists public.maybe_refill_daily_free_swipes();

-- 3. Intentionally NOT dropping free_swipes_last_refill_utc_date.
--    It is inert once maybe_refill is gone. Leave it for safe re-apply.

commit;
