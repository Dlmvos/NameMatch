import React, { useEffect } from 'react';
import { colors } from '../theme';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { AppProvider, useApp } from '../context/AppContext';
import { RoomProvider, useRoomState } from '../context/RoomContext';
import { SwipeDeckProvider } from '../context/SwipeDeckContext';
import { useVariantFlag } from '../hooks/useFeatureFlag';
import { I18nProvider } from '../i18n/I18nProvider';
import { useTranslation } from '../i18n/I18nProvider';
import { trStatic } from '../i18n/staticTranslate';
import { COLORS } from '../theme';

import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import RegionScreen from '../screens/RegionScreen';
import CountryScreen from '../screens/CountryScreen';
import PartnerConnectScreen from '../screens/PartnerConnectScreen';
import RoomManagementScreen from '../screens/RoomManagementScreen';
import SwipeScreen from '../screens/SwipeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ShopScreen from '../screens/ShopScreen';
import PaywallScreen from '../screens/PaywallScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DevAnalyticsScreen from '../screens/DevAnalyticsScreen';

import { RootStackParamList, MainTabParamList } from '../types';
import { FEATURE_FLAGS, PAYWALL_PLACEMENT_VARIANTS } from '../services/featureFlags';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const DEBUG_STARTUP_GATE = false;

function AppI18nBridge({ children }: { children: React.ReactNode }) {
  const { effectiveLanguage } = useApp();
  return <I18nProvider language={effectiveLanguage}>{children}</I18nProvider>;
}

/** When auth bootstrap fails before navigation is wired (standalone; no locale context). */
function StartupErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.loading}>
      <Text style={styles.startupErrorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.85}>
        <Text style={styles.retryButtonText}>{trStatic('error.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ──────────────────────────────────────────────────────────
// Main Tab Navigator
// ──────────────────────────────────────────────────────────
function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.shortlist.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: colors.neutral.white,
          borderTopColor: colors.neutral.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';
          if (route.name === 'Swipe') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Shop') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{ title: t('tab.swipe'), tabBarLabel: t('tab.swipe') }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ title: t('tab.matches'), tabBarLabel: t('tab.matches') }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{ title: t('tab.shop'), tabBarLabel: t('tab.shop') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('tab.settings'), tabBarLabel: t('tab.settings') }}
      />
    </Tab.Navigator>
  );
}

function AuthenticatedRootNavigator() {
  const { session, profile } = useAuth();
  const {
    effectiveUnlockedPacks,
    isCountryPrefHydrated,
    isUnlockedPacksHydrated,
  } = useApp();
  const { room, isLoadingRoom, isRoomHydrated } = useRoomState();

  /** Feature-flagged for placement experiments. */
  const paywallPlacement = useVariantFlag(
    'paywall_placement',
    PAYWALL_PLACEMENT_VARIANTS,
    FEATURE_FLAGS.paywall_placement.defaultValue,
  );

  const hasCompletedOnboarding = !!(
    profile?.gender_preference &&
    profile?.region_preference &&
    profile?.country_preference
  );
  const hasRoom = !!profile?.room_id;
  const isPaid = effectiveUnlockedPacks.length > 0;
  const suppressAutoInitialPaywall = paywallPlacement === 'shop_only';
  const partnerInitialRoute = isPaid ? 'MainTabs' : suppressAutoInitialPaywall ? 'PartnerConnect' : 'Paywall';
  const mainInitialRoute = isPaid ? 'MainTabs' : suppressAutoInitialPaywall ? 'MainTabs' : 'Paywall';

  const partnerPaywallInitialParams: RootStackParamList['Paywall'] =
    partnerInitialRoute === 'Paywall' ? { source: 'onboarding' } : undefined;
  const mainPaywallInitialParams: RootStackParamList['Paywall'] =
    mainInitialRoute === 'Paywall' ? { source: 'onboarding' } : undefined;

  const isStartupReady =
    isCountryPrefHydrated &&
    isUnlockedPacksHydrated &&
    (!hasRoom || isRoomHydrated);
  const stackKind: 'onboarding' | 'partner' | 'main' = !hasCompletedOnboarding
    ? 'onboarding'
    : !hasRoom
      ? 'partner'
      : 'main';

  useEffect(() => {
    if (!__DEV__ || !DEBUG_STARTUP_GATE) return;
    console.log('[StartupGate] ready state', {
      isStartupReady,
      hasCompletedOnboarding,
      hasRoom,
      isPaid,
      isCountryPrefHydrated,
      isUnlockedPacksHydrated,
      isLoadingRoom,
      isRoomHydrated,
      roomPremiumPacks: room?.premium_packs ?? [],
      hasSession: !!session,
      hasProfile: !!profile,
    });
  }, [
    isStartupReady,
    hasCompletedOnboarding,
    hasRoom,
    isPaid,
    isCountryPrefHydrated,
    isUnlockedPacksHydrated,
    isLoadingRoom,
    isRoomHydrated,
    room?.premium_packs,
    session,
    profile,
  ]);

  if (!isStartupReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const rootInitialRoute: keyof RootStackParamList = !hasCompletedOnboarding
    ? 'Preferences'
    : !hasRoom
      ? partnerInitialRoute
      : mainInitialRoute;

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={`${stackKind}:${isPaid ? 'paid' : 'free'}`}
        initialRouteName={rootInitialRoute}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {!hasCompletedOnboarding ? (
          <>
            <Stack.Screen name="Preferences" component={PreferencesScreen} />
            <Stack.Screen name="Country" component={CountryScreen} />
            <Stack.Screen name="Region" component={RegionScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PartnerConnect" component={PartnerConnectScreen} />
            <Stack.Screen name="RoomManagement" component={RoomManagementScreen} />
            {__DEV__ ? (
              <Stack.Screen name="DevAnalytics" component={DevAnalyticsScreen} options={{ headerShown: false }} />
            ) : null}
          </>
        ) : !hasRoom ? (
          <>
            <Stack.Screen name="PartnerConnect" component={PartnerConnectScreen} />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ headerShown: false }}
              initialParams={partnerPaywallInitialParams}
            />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Country" component={CountryScreen} />
            <Stack.Screen name="Region" component={RegionScreen} />
            {__DEV__ ? (
              <Stack.Screen name="DevAnalytics" component={DevAnalyticsScreen} options={{ headerShown: false }} />
            ) : null}
          </>
        ) : (
          <>
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ headerShown: false }}
              initialParams={mainPaywallInitialParams}
            />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Preferences" component={PreferencesScreen} />
            <Stack.Screen name="Country" component={CountryScreen} />
            <Stack.Screen name="Region" component={RegionScreen} />
            <Stack.Screen name="PartnerConnect" component={PartnerConnectScreen} />
            <Stack.Screen name="RoomManagement" component={RoomManagementScreen} />
            {__DEV__ ? (
              <Stack.Screen name="DevAnalytics" component={DevAnalyticsScreen} options={{ headerShown: false }} />
            ) : null}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ──────────────────────────────────────────────────────────
// Root Navigator
// ──────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { session, profile, isLoading, startupError, retryStartup } = useAuth();

  const isAuthenticated = !!session;

  useEffect(() => {
    if (!__DEV__ || !DEBUG_STARTUP_GATE) return;
    console.log('[AppNavigator] auth snapshot', {
      isLoading,
      isAuthenticated,
      hasSession: !!session,
      hasProfile: !!profile,
    });
  }, [isLoading, isAuthenticated, session, profile]);

  if (isLoading) {
    if (__DEV__ && DEBUG_STARTUP_GATE) {
      console.log('[AppNavigator] branch: loading spinner (isLoading=true)');
    }
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (startupError) {
    return <StartupErrorView message={startupError} onRetry={retryStartup} />;
  }

  if (isAuthenticated) {
    return (
      <RoomProvider>
        <AppProvider>
          <SwipeDeckProvider>
            <AppI18nBridge>
              <AuthenticatedRootNavigator />
            </AppI18nBridge>
          </SwipeDeckProvider>
        </AppProvider>
      </RoomProvider>
    );
  }

  const deviceLanguage =
    Intl.DateTimeFormat().resolvedOptions().locale?.split(/[-_]/)[0] ?? 'en';
  return (
    <I18nProvider language={deviceLanguage}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 24,
  },
  startupErrorText: {
    fontSize: 16,
    color: colors.shortlist.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.onboarding.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.neutral.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
