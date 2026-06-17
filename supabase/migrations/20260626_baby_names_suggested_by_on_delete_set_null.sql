-- ============================================================
-- Make user deletion not blocked by suggested baby_names rows.
--
-- Background: when partner-suggested custom names were added (migration
-- 20260520), baby_names.suggested_by_user_id was created without an
-- explicit ON DELETE rule, so it defaulted to NO ACTION. That makes
-- auth.users (and profiles via cascade) impossible to delete while
-- any baby_names row points at the user — Daan hit this trying to
-- clean up a test user (UID 72677cb8-...) on 2026-06-16.
--
-- The right product behavior: a custom name, once suggested into the
-- shared catalog, outlives the user who suggested it. The partner
-- and any future users should still see the name. Disconnect the row
-- from the deleted user (SET NULL) rather than deleting the name.
--
-- This also unblocks the Apple-required user-delete-account flow.
-- ============================================================

alter table public.baby_names
  drop constraint if exists baby_names_suggested_by_user_id_fkey;

alter table public.baby_names
  add constraint baby_names_suggested_by_user_id_fkey
  foreign key (suggested_by_user_id)
  references public.profiles(id)
  on delete set null;
