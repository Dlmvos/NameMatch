import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/**
 * Dev-only "screenshot mode" for the paywall. When enabled, the paywall
 * renders with the localized "price unavailable" copy instead of the live
 * RC `priceString` — useful when capturing the App Store Connect "Review
 * Information Screenshot" for IAP products without tripping Apple's
 * Guideline 2.3.7 (no specific prices baked into metadata images).
 *
 * Hard-gated on `__DEV__`. In release bundles every accessor short-circuits
 * to `false`; the AsyncStorage key is never read and the listener Set is
 * never touched, so production behaviour is identical to before.
 *
 * Usage:
 *   1. SettingsScreen has a __DEV__-only toggle that calls
 *      `setPaywallScreenshotMode(true)`.
 *   2. Navigate to the paywall; price rows render the unavailable fallback
 *      copy ("Price unavailable", localized) instead of real currency.
 *   3. Screenshot.
 *   4. Toggle off (or just reinstall the dev build).
 */

const STORAGE_KEY = '__paywall_screenshot_mode__';

let cachedValue = false;
const listeners = new Set<(value: boolean) => void>();

/**
 * Hydrate the in-memory cache from AsyncStorage. Call once at app bootstrap
 * so the flag is correct on the first render after a cold start.
 */
export async function hydratePaywallScreenshotMode(): Promise<boolean> {
  if (!__DEV__) {
    cachedValue = false;
    return false;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cachedValue = raw === '1';
  } catch {
    cachedValue = false;
  }
  return cachedValue;
}

/**
 * Sync accessor for non-React contexts (helpers, render-time pure functions).
 * Returns the last hydrated value. Always `false` in production.
 */
export function isPaywallScreenshotModeEnabled(): boolean {
  if (!__DEV__) return false;
  return cachedValue;
}

/**
 * Set the flag, persist to AsyncStorage, notify subscribers. No-op in prod.
 */
export async function setPaywallScreenshotMode(on: boolean): Promise<void> {
  if (!__DEV__) return;
  cachedValue = on;
  try {
    if (on) await AsyncStorage.setItem(STORAGE_KEY, '1');
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* best-effort; cache update is what matters for current session */
  }
  for (const fn of listeners) fn(on);
}

/**
 * React hook: returns the current flag and re-renders subscribers whenever
 * `setPaywallScreenshotMode` is called. Hydrates from AsyncStorage on first
 * mount so the value is correct after a cold start.
 */
export function usePaywallScreenshotMode(): boolean {
  const [value, setValue] = useState<boolean>(isPaywallScreenshotModeEnabled());
  useEffect(() => {
    if (!__DEV__) return;
    let cancelled = false;
    void hydratePaywallScreenshotMode().then((v) => {
      if (!cancelled) setValue(v);
    });
    const unsub = (fn: (v: boolean) => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    };
    const cleanup = unsub((v) => setValue(v));
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
  return value;
}
