import PostHog from 'posthog-react-native';

/**
 * GDPR person-deletion is handled by `supabase/functions/delete-posthog-person/`
 * (Supabase edge function). The personal API key stays server-side. The client
 * triggers it from `AuthContext.deleteAccount`, then also calls
 * `AnalyticsService.clearEvents()` to wipe the local PostHog identity +
 * queued events.
 *
 * Required env (`supabase secrets set ...`):
 *   POSTHOG_HOST, POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY.
 *
 * Do NOT call PostHog's personal-data deletion APIs directly from this app —
 * the personal API key must not ship in the client bundle.
 */
const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim() ?? '';

export const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || 'https://eu.i.posthog.com';

export const posthog: PostHog | null =
  apiKey.length > 0
    ? new PostHog(apiKey, {
        host: POSTHOG_HOST,
        captureAppLifecycleEvents: false,
      })
    : null;
