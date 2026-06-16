import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PostHogProvider } from 'posthog-react-native';

import { posthog } from './src/analytics/posthog';
import { AnalyticsService } from './src/services/AnalyticsService';
import { hydratePaywallScreenshotMode } from './src/lib/paywallScreenshotMode';
import { AuthProvider } from './src/context/AuthContext';
import { I18nProvider } from './src/i18n/I18nProvider';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { reloadFeatureFlags } from './src/services/featureFlags';

const BACKGROUND_RELOAD_MS = 5 * 60 * 1000;

function FeatureFlagsForegroundReload() {
  const backgroundAtRef = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'inactive' || nextState === 'background') {
        backgroundAtRef.current = Date.now();
        return;
      }
      if (nextState !== 'active') return;
      const t = backgroundAtRef.current;
      backgroundAtRef.current = null;
      if (t != null && Date.now() - t >= BACKGROUND_RELOAD_MS) {
        void reloadFeatureFlags();
      }
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function App() {
  const deviceLanguage =
    Intl.DateTimeFormat().resolvedOptions().locale?.split(/[-_]/)[0] ?? 'en';

  // Fire once per cold start. Used as the launch-funnel root — every other
  // event chains down from here (signup, first_swipe, paywall, purchase).
  // Foregrounding does NOT re-fire this; see FeatureFlagsForegroundReload
  // and AuthContext's AppState listener for foreground-specific events.
  useEffect(() => {
    AnalyticsService.track('app_opened', {
      device_language: deviceLanguage,
    });
    // __DEV__ only — hydrate the paywall screenshot-mode flag so a cold start
    // into Settings/Paywall reflects the persisted value (production no-ops).
    if (__DEV__) {
      void hydratePaywallScreenshotMode();
    }
  }, [deviceLanguage]);

  const tree = (
    <ErrorBoundary>
      <I18nProvider language={deviceLanguage}>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <FeatureFlagsForegroundReload />
        {posthog ? (
          <PostHogProvider client={posthog} autocapture={false}>
            {tree}
          </PostHogProvider>
        ) : (
          tree
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
