import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from '../i18n/I18nProvider';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { PurchaseService } from '../services/purchaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

// TODO: If react-native-purchases-ui is added later, this screen can present RevenueCat's paywall UI.

export default function PaywallScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { refreshProfile } = useAuth();
  const [premiumPrice, setPremiumPrice] = useState('...');
  const premiumFeatures = [
    t('paywall.couple.feature.unlimitedSwipes'),
    t('paywall.couple.feature.curatedNames'),
    t('paywall.couple.feature.advancedFilters'),
    t('paywall.couple.feature.meaningInsights'),
  ];

  useEffect(() => {
    let mounted = true;
    PurchaseService.getLocalizedPrice()
      .then((price) => {
        if (mounted) setPremiumPrice(price);
      })
      .catch(() => {
        if (mounted) setPremiumPrice(t('paywall.couple.price'));
      });
    return () => {
      mounted = false;
    };
  }, [t]);

  const navigateAfterPremiumVerified = () => {
    navigation.replace('MainTabs');
  };

  const handleContinueFree = () => {
    navigation.replace('MainTabs');
  };

  const handlePurchase = async () => {
    try {
      const result = await PurchaseService.purchasePremium();
      if (!result.success) return;
      if (!PurchaseService.hasPremiumEntitlement(result.customerInfo)) {
        Alert.alert(t('common.error'), t('shop.purchaseError'));
        return;
      }
      await PurchaseService.syncRevenueCatEntitlement();
      await refreshProfile();
      navigateAfterPremiumVerified();
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message ?? t('shop.purchaseError'));
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await PurchaseService.restorePurchases();
      if (!PurchaseService.hasPremiumEntitlement(customerInfo)) {
        Alert.alert(t('common.error'), t('shop.restoreError'));
        return;
      }
      await PurchaseService.syncRevenueCatEntitlement();
      await refreshProfile();
      Alert.alert(t('shop.restoreSuccessTitle'), t('shop.restoreSuccessBody'));
      navigateAfterPremiumVerified();
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message ?? t('shop.restoreError'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.badge}>{t('paywall.couple.badge')}</Text>

        <Text style={styles.title}>{t('paywall.couple.title')}</Text>

        <Text style={styles.subtitle}>
          {t('paywall.couple.subtitle')}
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
          <Text style={styles.heroTitle}>{t('paywall.couple.heroTitle')}</Text>
          <Text style={styles.heroText}>
            {t('paywall.couple.heroText')}
          </Text>
          <Text style={styles.priceText}>{premiumPrice}</Text>
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
          onPress={handlePurchase}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>{t('paywall.couple.primaryCta')}</Text>
        </TouchableOpacity>

        <Text style={styles.trustText}>{t('paywall.couple.trustCopy')}</Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleContinueFree}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>{t('paywall.secondaryCta')}</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          {t('paywall.couple.footer')}
        </Text>
        <TouchableOpacity style={styles.restoreLink} onPress={handleRestore} activeOpacity={0.85}>
          <Text style={styles.restoreLinkText}>{t('shop.restorePurchases')}</Text>
        </TouchableOpacity>
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
  priceText: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: '900',
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
  trustText: {
    fontSize: 13,
    textAlign: 'center',
    color: colors.neutral.textBody,
    fontWeight: '700',
    marginBottom: 12,
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
  restoreLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  restoreLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.match?.primary || colors.swipe.primary,
  },
});
