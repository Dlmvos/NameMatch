import type { PostHogEventProperties } from '@posthog/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { posthog } from '../analytics/posthog';
import { devWarn } from '../lib/devWarn';

type AnalyticsEvent =
  | 'app_opened'
  | 'signout_due_to_deleted_account'
  | 'onboarding_step_completed'
  | 'signup_started'
  | 'signup_completed'
  | 'signin_completed'
  | 'first_swipe'
  | 'paywall_impression'
  | 'paywall_cta_tap'
  | 'purchase_started'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'premium_filter_tap'
  | 'low_swipes_banner_tap'
  | 'match_shared'
  | 'match_created'
  | 'milestone_reached'
  | 'anticipation_inhale_started'
  | 'anticipation_inhale_completed'
  | 'match_celebration_dismissed'
  | 'anticipation_swipe_blocked'
  | 'anticipation_cooldown_entered'
  | 'swipe_partner_room_session_started'
  | 'swipe_partner_room_session_ended'
  | 'invite_create'
  | 'invite_share_tap'
  | 'invite_qr_view'
  | 'invite_join_success'
  | 'invite_join_failed'
  | 'preview_match_shown'
  | 'preview_match_invite_tapped'
  | 'preview_match_dismissed'
  | 'filter_relax_banner_tap'
  | 'carry_forward_modal_shown'
  | 'carry_forward_modal_dismissed'
  | 'carry_forward_completed'
  | 'carry_forward_failed'
  | 'solo_room_auto_provisioned'
  | 'solo_room_auto_provision_failed';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
export type StoredAnalyticsEvent = {
  event: AnalyticsEvent;
  timestamp: string;
  metadata: AnalyticsProperties;
};

const ANALYTICS_STORAGE_KEY = 'namenest:analytics_events';

let writeQueue = Promise.resolve();

function appVersion(): string {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    'unknown'
  );
}

function envelopeProps(): Record<string, string> {
  const base: Record<string, string> = {
    app_version: appVersion(),
    platform: Platform.OS,
  };
  const sid = posthog?.getSessionId()?.trim();
  if (sid) base.session_id = sid;
  return base;
}

function captureProps(
  meta: AnalyticsProperties,
  env: Record<string, string>,
): PostHogEventProperties {
  const out: PostHogEventProperties = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v !== undefined) out[k] = v;
  }
  for (const [k, v] of Object.entries(env)) {
    out[k] = v;
  }
  return out;
}

async function readStoredEvents(): Promise<StoredAnalyticsEvent[]> {
  const raw = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const AnalyticsService = {
  track(name: AnalyticsEvent, properties?: AnalyticsProperties): void {
    const meta = properties ?? {};
    const env = envelopeProps();
    posthog?.capture(name, captureProps(meta, env));

    const entry: StoredAnalyticsEvent = {
      event: name,
      timestamp: new Date().toISOString(),
      metadata: meta,
    };

    writeQueue = writeQueue
      .then(async () => {
        const events = await readStoredEvents();
        await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify([...events, entry]));
      })
      .catch(devWarn('AnalyticsService: persist event queue'));
  },

  /**
   * Link the current PostHog session to a stable user_id so all subsequent
   * events (and the historic anonymous events) are attributed to one person
   * in PostHog. Call this immediately after sign-up and sign-in succeed.
   *
   * Properties are user-level (NOT event-level) — they overwrite each other
   * on every identify. Use sparingly for things like region, locale,
   * has_partner, has_premium. Do NOT include PII like email.
   */
  identify(userId: string, properties?: AnalyticsProperties): void {
    if (!userId) return;
    const safeProps: PostHogEventProperties = {};
    if (properties) {
      for (const [k, v] of Object.entries(properties)) {
        if (v !== undefined) safeProps[k] = v;
      }
    }
    posthog?.identify(userId, safeProps);
  },

  async getEvents(): Promise<StoredAnalyticsEvent[]> {
    await writeQueue;
    return readStoredEvents();
  },

  async clearEvents(): Promise<void> {
    await writeQueue;
    await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
    posthog?.reset();
  },
};
