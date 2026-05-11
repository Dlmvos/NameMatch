import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { PostHogProvider } from 'posthog-react-native';

import { posthog } from './src/analytics/posthog';
import { AuthProvider } from './src/context/AuthContext';
import { I18nProvider } from './src/i18n/I18nProvider';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

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
