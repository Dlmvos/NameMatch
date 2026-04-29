import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import { I18nProvider } from './src/i18n/I18nProvider';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  const deviceLanguage =
    Intl.DateTimeFormat().resolvedOptions().locale?.split(/[-_]/)[0] ?? 'en';

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <I18nProvider language={deviceLanguage}>
            <AuthProvider>
              <StatusBar style="dark" />
              <AppNavigator />
            </AuthProvider>
          </I18nProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
