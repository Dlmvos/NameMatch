/**
 * Single-slot module-level handoff for deep-link navigations that fire
 * BEFORE NavigationContainer has settled on its final stack.
 *
 * Problem this solves:
 *   When a signed-out user taps a recovery-email link, `useDeepLinkAuth`
 *   parses the URL → calls `supabase.auth.setSession(...)` → AuthContext
 *   re-renders with `isLoading=true` → the unauth `<NavigationContainer>`
 *   unmounts → the loading spinner shows → the authenticated tree mounts
 *   a fresh `<NavigationContainer>`. Any `navigationRef.dispatch(navigate(
 *   'ResetPassword'))` issued during this window lands on the dead
 *   container or is dropped during the gap. A polling retry was added
 *   first but can't span the unmount→remount gap.
 *
 * Solution:
 *   useDeepLinkAuth sets a pending nav name here BEFORE the unmount can
 *   happen. Every <NavigationContainer> in AppNavigator wires its
 *   `onReady` to call `consumePendingDeepLinkNav()` and dispatch the
 *   navigate against itself. Single-shot — the consumer empties the slot.
 *
 * Module-level (not React state) on purpose: NavigationContainer remount
 * = new React tree, so React state wouldn't survive. A plain module
 * variable does.
 */

let pending: string | null = null;

/** Set the pending navigation target. Called by deep-link handlers. */
export function setPendingDeepLinkNav(routeName: string): void {
  pending = routeName;
}

/**
 * Consume and clear. Called by NavigationContainer onReady. Returns
 * the route name to dispatch, or null if nothing pending.
 */
export function consumePendingDeepLinkNav(): string | null {
  const value = pending;
  pending = null;
  return value;
}

/** Read without clearing — for debugging only. */
export function peekPendingDeepLinkNav(): string | null {
  return pending;
}
