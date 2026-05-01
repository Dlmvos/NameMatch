type AnalyticsEvent =
  | 'paywall_impression'
  | 'paywall_cta_tap'
  | 'purchase_started'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'premium_filter_tap'
  | 'low_swipes_banner_tap'
  | 'match_shared'
  | 'match_created';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export const AnalyticsService = {
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (!__DEV__) return;
    console.log('[Analytics]', event, properties ?? {});
  },
};
