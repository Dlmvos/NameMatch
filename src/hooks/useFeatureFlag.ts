import type { FeatureFlagValue } from '@posthog/core';
import { useCallback, useEffect, useState } from 'react';

import { posthog } from '../analytics/posthog';
import {
  FEATURE_FLAGS,
  tryEmitFeatureFlagChangedOnce,
  type BooleanFeatureFlagKey,
  type VariantFeatureFlagKey,
} from '../services/featureFlags';

function normalizeBoolean(raw: FeatureFlagValue | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

function captureFlagChangedIfNeeded(
  flagKey: string,
  raw: FeatureFlagValue | undefined,
  defaultValue: string | boolean,
  resolvedForUi: string | boolean,
): void {
  if (!posthog) return;
  if (raw === undefined) return;
  if (resolvedForUi === defaultValue) return;
  if (!tryEmitFeatureFlagChangedOnce(flagKey)) return;
  posthog.capture('feature_flag_changed', {
    flag_key: flagKey,
    resolved_value: resolvedForUi,
    default_value: defaultValue,
  });
}

/**
 * Boolean remote flag. First paint always uses `defaultValue`; updates when PostHog resolves flags.
 */
export function useBooleanFlag<K extends BooleanFeatureFlagKey>(
  key: K,
  defaultValue: (typeof FEATURE_FLAGS)[K]['defaultValue'],
): boolean {
  const [value, setValue] = useState<boolean>(() => defaultValue);

  const recompute = useCallback(() => {
    const raw = posthog?.getFeatureFlag(key);
    const next = normalizeBoolean(raw, defaultValue);
    setValue(next);
    captureFlagChangedIfNeeded(key, raw, defaultValue, next);
  }, [key, defaultValue]);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, key]);

  useEffect(() => {
    recompute();
    if (!posthog) return undefined;
    return posthog.onFeatureFlags(() => {
      recompute();
    });
  }, [recompute]);

  return value;
}

/**
 * Multivariate / string flag. Unknown payload values fall back to `defaultValue` (never blocks UI).
 */
export function useVariantFlag<V extends string>(
  key: VariantFeatureFlagKey,
  variants: readonly V[],
  defaultValue: V,
): V {
  const [value, setValue] = useState<V>(() => defaultValue);

  const recompute = useCallback(() => {
    const raw = posthog?.getFeatureFlag(key);
    let next: V = defaultValue;
    if (raw !== undefined) {
      const s = typeof raw === 'string' ? raw : String(raw);
      if ((variants as readonly string[]).includes(s)) next = s as V;
    }
    setValue(next);
    captureFlagChangedIfNeeded(key, raw, defaultValue, next);
  }, [defaultValue, key, variants]);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, key]);

  useEffect(() => {
    recompute();
    if (!posthog) return undefined;
    return posthog.onFeatureFlags(() => {
      recompute();
    });
  }, [recompute]);

  return value;
}
