type AnalyticsPayload = Record<string, unknown>;

export function track(event: string, payload: AnalyticsPayload = {}): void {
  if (__DEV__) {
    console.log('[analytics]', event, payload);
  }
}

export function trackSwipe(payload: AnalyticsPayload): void {
  track('swipe', payload);
}

export function trackMatch(payload: AnalyticsPayload): void {
  track('match', payload);
}

export function trackDeckLoaded(payload: AnalyticsPayload): void {
  track('deck_loaded', payload);
}

export function trackPartnerActivity(payload: AnalyticsPayload): void {
  track('partner_activity', payload);
}
