import PostHog from 'posthog-react-native';

/**
 * TODO(GDPR): Implement PostHog person/deletion requests via a secure server or edge
 * function (project API key stays server-side). Do not call personal-data deletion
 * APIs directly from this app.
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
