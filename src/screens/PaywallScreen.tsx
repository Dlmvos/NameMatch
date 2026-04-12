import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const premiumFeatures = [
  'Unlimited swipes',
  'Advanced filters',
  'AI name suggestions',
  'Meaning insights',
  'Popularity trends',
  'More premium name packs',
];

export default function PaywallScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.badge}>FOUNDING PARENTS OFFER</Text>

        <Text style={styles.title}>Unlock Premium</Text>

        <Text style={styles.subtitle}>
          Make naming your baby feel faster, easier, and more exciting together.
        </Text>

        <LinearGradient
          colors={[
            colors.match?.gradientStart || colors.swipe.primary,
            colors.match?.gradientEnd || colors.onboarding.secondary,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>Find the perfect name with less friction</Text>
          <Text style={styles.heroText}>
            Unlock smarter discovery, better filtering, and more ways to match on names you both love.
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          {premiumFeatures.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.match?.primary || colors.swipe.primary}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Shop' })}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>See Premium Plans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.replace('MainTabs')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Continue Free</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          You can upgrade now or continue with the free version and unlock more later in the Shop.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.bgLight,
  },
  container: {
    padding: 24,
    paddingBottom: 32,
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.match?.primary || colors.swipe.primary,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.neutral.textDark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.neutral.textBody,
    marginBottom: 22,
  },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral.textDark,
  },
  primaryButton: {
    backgroundColor: colors.match?.primary || colors.swipe.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  secondaryButtonText: {
    color: colors.neutral.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.neutral.textBody,
  },
});
