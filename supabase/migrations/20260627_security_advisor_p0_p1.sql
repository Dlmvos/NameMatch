-- ============================================================
-- 20260627_security_advisor_p0_p1.sql
--
-- Resolves Supabase security advisor warnings flagged 2026-06-19.
--
-- P0 — Lock down SECURITY DEFINER RPCs from anon:
--   - apply_canonical_meaning_enrichment: internal enrichment pipeline;
--     service_role only. (The original 20260621 migration revoked from
--     PUBLIC and granted to service_role, but the advisor still flags it
--     so we re-revoke explicitly to ensure the ACL state matches intent.)
--   - dismiss_carry_forward_notice: signed-in users only.
--   - merge_solo_into_room_after_join: signed-in users only.
--
-- P1 — Pin search_path on four functions to defend against
--   schema-injection by an attacker with CREATE privilege on a schema
--   earlier in the search path. Using 'pg_catalog, public' (not '')
--   so existing unqualified references in the function bodies keep
--   working without rewriting them.
--
-- P1 — Tighten the `social` storage bucket: drop the anon SELECT policy
--   that allows listing every file. The bucket stays public for direct
--   object-URL access (that path doesn't consult the SELECT policy when
--   the bucket is public).
--
-- Not addressed by this migration (deferred to v1.0.1 or post-launch):
--   - pg_net in public schema (cosmetic; non-trivial to relocate safely)
--   - 10 authenticated-callable SECURITY DEFINER fns — expected behavior;
--     each function already does its own auth.uid() check internally.
--   - Leaked password protection — toggle in Studio, not a migration.
--   - 13 RLS-enabled-no-policy INFO findings — competitor.* tables are
--     intentionally service-role-only; the four dead public tables
--     (name_packs/pack_purchases/purchases/users) are already locked
--     down. Drop them in v1.0.1 after confirming nothing references.
-- ============================================================

begin;

-- ── P0: Revoke anon EXECUTE on three SECURITY DEFINER RPCs ───────────

revoke all on function public.apply_canonical_meaning_enrichment(
  uuid, text, text, text, text, text, numeric, boolean, smallint, text, jsonb, jsonb, timestamptz
) from public, anon, authenticated;

grant execute on function public.apply_canonical_meaning_enrichment(
  uuid, text, text, text, text, text, numeric, boolean, smallint, text, jsonb, jsonb, timestamptz
) to service_role;

revoke all on function public.dismiss_carry_forward_notice() from public, anon;
grant execute on function public.dismiss_carry_forward_notice() to authenticated;

revoke all on function public.merge_solo_into_room_after_join(uuid, uuid) from public, anon;
grant execute on function public.merge_solo_into_room_after_join(uuid, uuid) to authenticated;

-- ── P1: Pin search_path on four functions ────────────────────────────
-- All four are referenced from triggers or as helpers; setting search_path
-- to 'pg_catalog, public' is safe because their bodies use only built-in
-- functions and public-schema tables, with no cross-schema lookups.

alter function public.baby_names_origin_is_source_like(text)
  set search_path = pg_catalog, public;

alter function public.normalize_name_key(text)
  set search_path = pg_catalog, public;

alter function public.canonical_names_ensure_id(text, text, text)
  set search_path = pg_catalog, public;

alter function public.babynames_assign_canonical_id()
  set search_path = pg_catalog, public;

-- ── P1: Drop overly-broad anon SELECT on `social` storage bucket ─────
-- Public buckets serve objects by direct URL without consulting the
-- SELECT policy, so dropping this policy DOES NOT break image hotlinks
-- in social posts. What it does block is anon LIST operations
-- (storage.from('social').list()) which currently expose every filename
-- in the bucket to the public internet. Authenticated/service-role
-- listings continue to work because those code paths bypass this policy
-- via separate ACLs.

drop policy if exists "social_anon_read" on storage.objects;

commit;
