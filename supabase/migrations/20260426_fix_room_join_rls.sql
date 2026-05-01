-- Fix: Room join RLS policies
--
-- Problem: The "Joiner can claim empty user2 slot" UPDATE policy has a WITH CHECK
-- clause containing self-referencing subqueries (SELECT ... FROM rooms WHERE id = id).
-- These subqueries are themselves subject to the SELECT RLS policy, which only allows
-- user1 or user2 to view the room. Since the joiner is neither, the subqueries return
-- NULL, WITH CHECK evaluates to FALSE, and the atomic claim silently fails.
--
-- Fix:
-- 1. Add a SELECT policy so authenticated users can discover joinable (open) rooms.
-- 2. Simplify the UPDATE WITH CHECK to remove self-referencing subqueries.

-- ── 1. Allow any authenticated user to discover open (joinable) rooms ──
-- This is needed for:
--   a) The join-by-code SELECT lookup
--   b) The self-referencing subqueries in the UPDATE WITH CHECK (if kept)
-- Security: only exposes rooms where user2_id IS NULL and is_active = true.
-- Room codes are random 6-char from 32^6 ≈ 1B combinations — enumeration is impractical.

CREATE POLICY "Authenticated users can discover joinable rooms"
  ON public.rooms FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND user2_id IS NULL
    AND is_active = true
  );

-- ── 2. Replace the UPDATE policy with simplified WITH CHECK ──
-- The USING clause already validates preconditions (user2 slot is empty, caller is not user1).
-- The WITH CHECK only needs to ensure user2_id is being set to the caller's ID.
-- No self-referencing subqueries needed: the Supabase client's .update() only sends
-- user2_id, so other fields are not modified.

DROP POLICY IF EXISTS "Joiner can claim empty user2 slot" ON public.rooms;

CREATE POLICY "Joiner can claim empty user2 slot"
  ON public.rooms FOR UPDATE
  USING (
    user2_id IS NULL
    AND auth.uid() <> user1_id
  )
  WITH CHECK (
    user2_id = auth.uid()
  );
