import { posthog } from '../analytics/posthog';

/** Paywall experiment surface (configure variants in PostHog). */
export const PAYWALL_PLACEMENT_VARIANTS = [
  'post_onboarding',
  'post_first_match',
  'shop_only',
] as const;

export type PaywallPlacementVariant = (typeof PAYWALL_PLACEMENT_VARIANTS)[number];

/**
 * Canonical flag keys and defaults. Create matching flags in the PostHog UI; keys must match exactly.
 * When offline or flags unavailable, hooks return these defaults and never block rendering.
 */
export const FEATURE_FLAGS = {
  /**
   * Enables the anticipation inhale interaction before revealing the partner’s swipe on paired sessions.
   * Default on so existing behavior is unchanged if PostHog is unreachable.
   */
  anticipation_inhale_enabled: { defaultValue: true as const },

  /**
   * Enables subtle convergence / “whisper” affordances when partners are aligning on names (UX polish).
   * Default off until the experiment is ready in production.
   */
  convergence_whisper_enabled: { defaultValue: false as const },

  /**
   * Enables periodic presence signaling for co-present swipe sessions (rooms).
   * Default on; disabling can reduce background chatter during incidents.
   */
  presence_heartbeat_enabled: { defaultValue: true as const },

  /**
   * Controls where the paywall is introduced in the funnel (multivariate flag in PostHog).
   * Variants: post_onboarding | post_first_match | shop_only.
   */
  paywall_placement: {
    defaultValue: 'post_first_match' as const,
    variants: PAYWALL_PLACEMENT_VARIANTS,
  },

  /**
   * Shortens onboarding when enabled (copy/step count experiments).
   * Default off so the full flow remains the baseline.
   */
  onboarding_short: { defaultValue: false as const },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export type BooleanFeatureFlagKey = Exclude<FeatureFlagKey, 'paywall_placement'>;

export type VariantFeatureFlagKey = 'paywall_placement';

const emittedFeatureFlagChanged = new Set<string>();

/** Clears “feature_flag_changed already emitted” markers (call after a new identified user). */
export function resetFeatureFlagChangedSession(): void {
  emittedFeatureFlagChanged.clear();
}

/** Once per flag per session after login: used so duplicate hook instances do not duplicate analytics. */
export function tryEmitFeatureFlagChangedOnce(flagKey: string): boolean {
  if (emittedFeatureFlagChanged.has(flagKey)) return false;
  emittedFeatureFlagChanged.add(flagKey);
  return true;
}

/**
 * Refreshes feature flags from PostHog. Safe when analytics is disabled or the network is down.
 */
export async function reloadFeatureFlags(): Promise<void> {
  if (!posthog) return;
  try {
    await posthog.reloadFeatureFlagsAsync();
  } catch {
    /* defaults remain; UI must never depend on this succeeding */
  }
}
