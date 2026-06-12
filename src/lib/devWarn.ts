/**
 * Drop-in replacement for `.catch(() => {})` on fire-and-forget promise
 * chains where we don't want to crash the app but DO want to know about the
 * failure during development.
 *
 * Reason: a blanket `.catch(() => {})` on a data-load or storage write hides
 * real failures behind confusing empty states with no diagnostic trail (audit
 * B2, 2026-06-12). Switching to `.catch(devWarn('tag'))` keeps production
 * behaviour identical (babel strips the console.warn in prod, see
 * babel.config.js) but surfaces the failure on the Metro console in dev.
 *
 * Usage:
 *   await thing().catch(devWarn('AppContext: persist country pref'));
 *
 * For paths that genuinely don't care about the failure even in development
 * (e.g. `await rcSdk.logOut().catch(() => {})` cleanup after a Supabase row
 * delete that already succeeded), keep the empty `() => {}` — that's not a
 * "swallowed bug", it's intentional decoupling.
 */
export function devWarn(tag: string): (err: unknown) => void {
  return (err) => {
    if (__DEV__) {
      console.warn(tag, err);
    }
  };
}
