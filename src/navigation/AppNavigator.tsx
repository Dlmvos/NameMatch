import React from 'react';
import { colors } from '../theme';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme';

import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import RegionScreen from '../screens/RegionScreen';
import CountryScreen from '../screens/CountryScreen';
import PartnerConnectScreen from '../screens/PartnerConnectScreen';
import SwipeScreen from '../screens/SwipeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ShopScreen from '../screens/ShopScreen';
import PaywallScreen from '../screens/PaywallScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ──────────────────────────────────────────────────────────
// Main Tab Navigator
// ──────────────────────────────────────────────────────────
function MainTabs() {
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
      <Tab.Screen name="Swipe" component={SwipeScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ title: 'Matches' }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: 'Shop' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

// ──────────────────────────────────────────────────────────
// Root Navigator
// ──────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Determine initial screen
  const isAuthenticated = !!session;
  const hasPreferences = !!(profile?.gender_preference && profile?.region_preference);
  const hasRoom = !!profile?.room_id;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          // Auth flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : !hasPreferences ? (
          // Onboarding flow
          <>
            <Stack.Screen name="Preferences" component={PreferencesScreen} />
            <Stack.Screen name="Country" component={CountryScreen} />
            <Stack.Screen name="Region" component={RegionScreen} />
            <Stack.Screen name="PartnerConnect" component={PartnerConnectScreen} />
          </>
        ) : !hasRoom ? (
          // Partner connect
          <Stack.Screen name="PartnerConnect" component={PartnerConnectScreen} />
        ) : (
          // Main app
          <>
            <Stack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Preferences" component={PreferencesScreen} />
            <Stack.Screen name="Country" component={CountryScreen} />
            <Stack.Screen name="Region" component={RegionScreen} />
            <Stack.Screen name="PartnerConnect" component={PartnerConnectScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
  },
});
