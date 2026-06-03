import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../i18n/I18nProvider';
import { RootStackParamList, PREMIUM_COUPLE_PACK_KEY } from '../types';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useSwipeDeckActions } from '../context/SwipeDeckContext';
import { logPurchaseFailureDiagnostics, PurchaseService } from '../services/purchaseService';
import { AnalyticsService } from '../services/AnalyticsService';

/** Same key as ShopScreen — dev-only mock premium unlocks. */
const DEV_UNLOCKED_PACKS_KEY = 'NAMEMATCH_DEV_UNLOCKED_PACKS';

const PAYWALL_PRIVACY_URL = 'https://babinom.com/privacy/';
const PAYWALL_TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

function isSamePackage(a: PurchasesPackage | null, b: PurchasesPackage | null): boolean {
  if (!a || !b) return false;
  return a.identifier === b.identifier && a.product.identifier === b.product.identifier;
}

type PaywallT = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

/** Prefer StoreKit/RevenueCat `priceString`; never show fabricated currency when hydrating or after failure. */
function paywallPriceLabel(
  t: PaywallT,
  priceString: string | null | undefined,
  offersHydrated: boolean,
  kind: 'lifetime' | 'monthly',
): string {
  const trimmed = typeof priceString === 'string' ? priceString.trim() : '';
  if (trimmed.length > 0) return trimmed;
  if (!offersHydrated) return '…';
  return t(
    kind === 'monthly'
      ? 'paywall.couple.priceUnavailableMonthly'
      : 'paywall.couple.priceUnavailableOneTime',
  );
}

function singleSkuPaywallPriceLabel(opts: {
  t: PaywallT;
  pkg: PurchasesPackage | null;
  monthlyPkg: PurchasesPackage | null;
  offersHydrated: boolean;
}): string {
  const { t, pkg, monthlyPkg, offersHydrated } = opts;
  const trimmed = pkg?.product.priceString?.trim() ?? '';
  if (trimmed.length > 0) return trimmed;
  if (!offersHydrated) return '…';
  if (!pkg) return t('paywall.couple.pricingUnavailable');
  return monthlyPkg && isSamePackage(pkg, monthlyPkg)
    ? t('paywall.couple.priceUnavailableMonthly')
    : t('paywall.couple.priceUnavailableOneTime');
}

// TODO: If react-native-purchases-ui is added later, this screen can present RevenueCat's paywall UI.

export default function PaywallScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { hydratePremiumFromRevenueCat, restorePurchases } = useAuth();
  const { refreshUnlockedPacks } = useApp();
  const { loadMoreNames } = useSwipeDeckActions();
  const [lifetimePkg, setLifetimePkg] = useState<PurchasesPackage | null>(null);
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [legacyPkg, setLegacyPkg] = useState<PurchasesPackage | null>(null);
  const [selectedPremium, setSelectedPremium] = useState<PurchasesPackage | null>(null);
  const [offersHydrated, setOffersHydrated] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const premiumFeatures = [
    t('paywall.couple.feature.unlimitedSwipes'),
    t('paywall.couple.feature.curatedNames'),
    t('paywall.couple.feature.advancedFilters'),
    t('paywall.couple.feature.meaningInsights'),
  ];

  const showDualOffers = Boolean(lifetimePkg && monthlyPkg);

  /** Primary Unlock: wait for RevenueCat + a concrete package — never purchasePremium(undefined). */
  const unlockEnabled =
    offersHydrated && selectedPremium !== null && !isPurchasing && !isBusy;

  useFocusEffect(
    useCallback(() => {
      const src = route.params?.source;
      AnalyticsService.track('paywall_impression', src ? { source: src } : {});
    }, [route.params?.source]),
  );

  useEffect(() => {
    let mounted = true;
    PurchaseService.getPremiumOfferingPackages()
      .then(({ lifetime, monthly, legacy }) => {
        if (!mounted) return;
        setLifetimePkg(lifetime);
        setMonthlyPkg(monthly);
        setLegacyPkg(legacy);
      })
      .catch(() => {
        /** Offerings unavailable — UI avoids fake localized currency amounts */
      })
      .finally(() => {
        if (mounted) setOffersHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const def =
      legacyPkg && !lifetimePkg && !monthlyPkg
        ? legacyPkg
        : lifetimePkg && monthlyPkg
          ? lifetimePkg
          : lifetimePkg ?? monthlyPkg ?? legacyPkg;
    setSelectedPremium(def ?? null);
  }, [lifetimePkg, monthlyPkg, legacyPkg]);

  const singleSkuPkg = showDualOffers
    ? null
    : legacyPkg && !lifetimePkg && !monthlyPkg
      ? legacyPkg
      : lifetimePkg ?? monthlyPkg ?? legacyPkg;

  const singleSkuPrice = showDualOffers
    ? ''
    : singleSkuPaywallPriceLabel({
        t,
        pkg: singleSkuPkg,
        monthlyPkg,
        offersHydrated,
      });

  const navigateAfterPremiumVerified = () => {
    navigation.replace('MainTabs');
  };

  const addDevUnlockedPack = async (packKey: string): Promise<void> => {
    const raw = await AsyncStorage.getItem(DEV_UNLOCKED_PACKS_KEY).catch(() => null);
    let existing: string[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        existing = Array.isArray(parsed) ? parsed : [];
      } catch {
        existing = [];
      }
    }
    if (existing.includes(packKey)) return;
    await AsyncStorage.setItem(DEV_UNLOCKED_PACKS_KEY, JSON.stringify([...existing, packKey])).catch(() => {});
  };

  const handleDevUnlockPremium = async () => {
    if (!__DEV__) return;
    if (isBusy) return;
    setIsBusy(true);
    try {
      await addDevUnlockedPack(PREMIUM_COUPLE_PACK_KEY);
      await refreshUnlockedPacks();
      loadMoreNames();
      Alert.alert('Dev unlock', 'Premium unlocked for this dev build.');
      navigateAfterPremiumVerified();
    } catch (err: any) {
      Alert.alert('Dev unlock failed', err?.message ?? 'Unknown error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleContinueFree = () => {
    if (isBusy) return;
    navigation.replace('MainTabs');
  };

  const paywallOfferingsLoadedCount = (): number =>
    [lifetimePkg, monthlyPkg, legacyPkg].filter(Boolean).length;

  const logPaywallPurchaseFailure = async (
    err: unknown,
    phase: string,
    customerInfo?: CustomerInfo | null,
  ) => {
    let info = customerInfo ?? null;
    if (!info) {
      try {
        info = await PurchaseService.getCustomerInfo();
      } catch {
        // Diagnostics only — purchase outcome unchanged.
      }
    }
    logPurchaseFailureDiagnostics(err, {
      selectedPackage: selectedPremium,
      offeringsLoadedCount: paywallOfferingsLoadedCount(),
      customerInfo: info,
      phase,
    });
  };

  const handlePurchase = async () => {
    if (!offersHydrated || selectedPremium === null || isBusy || isPurchasing) return;

    AnalyticsService.track('paywall_cta_tap');
    AnalyticsService.track('purchase_started');
    setIsPurchasing(true);
    setIsBusy(true);
    try {
      const result = await PurchaseService.purchasePremium(selectedPremium);
      if (!result.success) {
        if ('unavailable' in result && result.unavailable) {
          AnalyticsService.track('purchase_failed', { reason: 'purchases_unavailable' });
          Alert.alert(
            'Purchases unavailable (dev)',
            `${result.reason}\n\nRebuild the dev client if you recently changed EXPO_PUBLIC_REVENUECAT_* keys.`,
          );
          return;
        }
        return;
      }
      if (!PurchaseService.hasPremiumEntitlement(result.customerInfo)) {
        AnalyticsService.track('purchase_failed', { reason: 'missing_entitlement' });
        await logPaywallPurchaseFailure(
          new Error('premium_entitlement_missing_after_purchase'),
          'paywall_missing_entitlement',
          result.customerInfo,
        );
        Alert.alert(t('common.error'), t('shop.purchaseError'));
        return;
      }
      await hydratePremiumFromRevenueCat(result.customerInfo);
      AnalyticsService.track('purchase_completed');
      Alert.alert(t('shop.purchaseSuccessTitle'), t('shop.purchaseSuccessBody'));
      navigateAfterPremiumVerified();
    } catch (err: unknown) {
      const reason =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown';
      AnalyticsService.track('purchase_failed', { reason });
      await logPaywallPurchaseFailure(err, 'paywall_purchase_catch');
      Alert.alert(t('common.error'), t('shop.purchaseError'));
    } finally {
      setIsPurchasing(false);
      setIsBusy(false);
    }
  };

  const handleRestore = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const restored = await restorePurchases();
      if (!restored) {
        Alert.alert(t('shop.restoreNoneTitle'), t('shop.restoreNoneBody'));
        return;
      }
      Alert.alert(t('shop.restoreReadyTitle'), t('shop.restoreReadyBody'));
      navigateAfterPremiumVerified();
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message ?? t('shop.restoreError'));
    } finally {
      setIsBusy(false);
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

          {showDualOffers ? (
            <View style={styles.planBlock}>
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => setSelectedPremium(lifetimePkg)}
                style={[
                  styles.planRowPrimary,
                  lifetimePkg &&
                    selectedPremium &&
                    isSamePackage(selectedPremium, lifetimePkg) &&
                    styles.planRowSelected,
                ]}
              >
                <View style={styles.planRowLeft}>
                  <Text style={styles.planRowTitle}>{t('paywall.couple.bestValue')}</Text>
                  <Text style={styles.planRowCaption}>{t('paywall.couple.planLifetimeCaption')}</Text>
                </View>
                <Text style={styles.planRowPricePrimary}>
                  {paywallPriceLabel(
                    t,
                    lifetimePkg?.product.priceString,
                    offersHydrated,
                    'lifetime',
                  )}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => setSelectedPremium(monthlyPkg)}
                style={[
                  styles.planRowSecondary,
                  monthlyPkg &&
                    selectedPremium &&
                    isSamePackage(selectedPremium, monthlyPkg) &&
                    styles.planRowSecondarySelected,
                ]}
              >
                <View style={styles.planRowLeft}>
                  <Text style={styles.planRowTitleSecondary}>{t('paywall.couple.planMonthlyLabel')}</Text>
                  <Text style={styles.planRowCaptionSecondary}>{t('paywall.couple.planMonthlyCaption')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.planRowPriceSecondary}>
                    {paywallPriceLabel(
                      t,
                      monthlyPkg?.product.priceString,
                      offersHydrated,
                      'monthly',
                    )}
                  </Text>
                  {monthlyPkg?.product.pricePerYearString ? (
                    <Text style={styles.yearlyHint}>
                      {t('paywall.couple.yearlyCompare', {
                        yearly: monthlyPkg.product.pricePerYearString,
                      })}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.priceText}>{singleSkuPrice}</Text>
          )}
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
          style={[styles.primaryButton, !unlockEnabled && styles.disabledButton]}
          onPress={handlePurchase}
          disabled={!unlockEnabled}
          accessibilityState={{ disabled: !unlockEnabled }}
          activeOpacity={0.9}
        >
          {!offersHydrated ? (
            <ActivityIndicator color={colors.neutral.textDark} />
          ) : (
            <Text style={styles.primaryButtonText}>{t('paywall.couple.primaryCta')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.urgencyText}>{t('paywall.couple.urgencyCopy')}</Text>

        <Text style={styles.trustText}>{t('paywall.couple.trustCopy')}</Text>

        <TouchableOpacity
          style={[styles.secondaryButton, isBusy && styles.disabledButton]}
          onPress={handleContinueFree}
          disabled={isBusy}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>{t('paywall.secondaryCta')}</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          {t('paywall.couple.footer')}
        </Text>

        <View style={styles.legalSection} accessibilityRole="text">
          <Text style={styles.legalDisclosureText}>{t('paywall.legal.subscriptionDisclosure')}</Text>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              accessibilityRole="link"
              accessibilityLabel={t('paywall.legal.privacyPolicy')}
              onPress={() => {
                void Linking.openURL(PAYWALL_PRIVACY_URL).catch(() => {});
              }}
            >
              <Text style={styles.legalLinkText}>{t('paywall.legal.privacyPolicy')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalLinkSeparator}>·</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              accessibilityRole="link"
              accessibilityLabel={t('paywall.legal.termsOfUse')}
              onPress={() => {
                void Linking.openURL(PAYWALL_TERMS_URL).catch(() => {});
              }}
            >
              <Text style={styles.legalLinkText}>{t('paywall.legal.termsOfUse')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.restoreLink, isBusy && styles.disabledButton]}
          onPress={handleRestore}
          disabled={isBusy}
          activeOpacity={0.85}
        >
          <Text style={styles.restoreLinkText}>{t('shop.restorePurchases')}</Text>
        </TouchableOpacity>

        {__DEV__ ? (
          <View style={styles.devUnlockSection}>
            <TouchableOpacity
              style={[styles.devUnlockButton, isBusy && styles.disabledButton]}
              onPress={handleDevUnlockPremium}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              <Text style={styles.devUnlockBadge}>DEV ONLY</Text>
              <Text style={styles.devUnlockButtonText}>Dev Unlock Premium</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
    color: colors.match?.text || colors.neutral.textDark,
    backgroundColor: colors.match?.background || '#FFF7E8',
    borderColor: colors.match?.primary || colors.swipe.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    marginBottom: 14,
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
    padding: 24,
    marginBottom: 22,
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
    marginTop: 18,
    fontSize: 40,
    fontWeight: '900',
    color: colors.neutral.textDark,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  planBlock: {
    marginTop: 18,
    gap: 12,
  },
  planRowPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planRowSelected: {
    borderColor: colors.match?.primary || colors.swipe.primary,
  },
  planRowSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    opacity: 0.95,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  planRowSecondarySelected: {
    borderColor: colors.match?.primary || colors.swipe.primary,
    borderWidth: 2,
  },
  planRowLeft: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  planRowTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: colors.neutral.textDark,
  },
  planRowTitleSecondary: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.neutral.textDark,
    opacity: 0.85,
  },
  planRowCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral.textBody,
    maxWidth: 180,
    lineHeight: 15,
  },
  planRowCaptionSecondary: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral.textBody,
    opacity: 0.88,
    maxWidth: 180,
    lineHeight: 14,
  },
  planRowPricePrimary: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.neutral.textDark,
    flexShrink: 0,
  },
  planRowPriceSecondary: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.neutral.textDark,
    opacity: 0.88,
    flexShrink: 0,
  },
  yearlyHint: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral.textBody,
    marginTop: 4,
    textAlign: 'right',
    maxWidth: 180,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral.textDark,
  },
  primaryButton: {
    backgroundColor: colors.match?.primary || colors.swipe.primary,
    borderRadius: 20,
    paddingVertical: 19,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.match?.primary || colors.swipe.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryButtonText: {
    color: colors.neutral.textDark,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  urgencyText: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.neutral.darkGray,
    fontWeight: '700',
    marginBottom: 6,
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
  disabledButton: {
    opacity: 0.6,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.neutral.textBody,
  },
  legalSection: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  legalDisclosureText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.neutral.textBody,
    marginBottom: 10,
    opacity: 0.92,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  legalLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.match?.primary || colors.swipe.primary,
    textDecorationLine: 'underline',
  },
  legalLinkSeparator: {
    fontSize: 13,
    color: colors.neutral.darkGray,
    fontWeight: '600',
    paddingHorizontal: 2,
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
  devUnlockSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral.border,
  },
  devUnlockButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F1F5F9',
  },
  devUnlockBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#94A3B8',
    marginBottom: 6,
  },
  devUnlockButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
});
