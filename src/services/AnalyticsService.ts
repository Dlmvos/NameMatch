import AsyncStorage from '@react-native-async-storage/async-storage';

type AnalyticsEvent =
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
  | 'swipe_partner_room_session_ended';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
export type StoredAnalyticsEvent = {
  event: AnalyticsEvent;
  timestamp: string;
  metadata: AnalyticsProperties;
};

const ANALYTICS_STORAGE_KEY = 'namenest:analytics_events';

let writeQueue = Promise.resolve();

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
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    const entry: StoredAnalyticsEvent = {
      event,
      timestamp: new Date().toISOString(),
      metadata: properties ?? {},
    };

    writeQueue = writeQueue
      .then(async () => {
        const events = await readStoredEvents();
        await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify([...events, entry]));
      })
      .catch(() => {});
  },

  async getEvents(): Promise<StoredAnalyticsEvent[]> {
    await writeQueue;
    return readStoredEvents();
  },

  async clearEvents(): Promise<void> {
    await writeQueue;
    await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
  },
};
