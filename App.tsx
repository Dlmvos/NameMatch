import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PostHogProvider } from 'posthog-react-native';

import { posthog } from './src/analytics/posthog';
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
