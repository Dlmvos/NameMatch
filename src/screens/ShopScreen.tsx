import React, { useEffect, useMemo, useState } from 'react';
import { colors } from '../theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useSwipeDeckActions } from '../context/SwipeDeckContext';
import { useTranslation } from '../i18n/I18nProvider';
import { translateCountryName } from '../i18n/display';
import { formatLocalizedPrice, resolveCurrencyCode } from '../lib/currency';
import { NamePack, PREMIUM_COUPLE_PACK_KEY } from '../types';
import { FREE_SWIPE_BANK_CAP } from '../constants/freeSwipes';
import { COUNTRY_OPTIONS } from '../data/countries';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import { PurchaseService } from '../services/purchaseService';
import { DEV_PREVIEW } from '../config/devPreview';

/** Legacy bucket name; stores curated swipe-to-shop recommendations keyed by pack id. */
const CURATED_RECOMMENDATION_UNLOCKS_STORAGE_KEY = 'AI_PACK_UNLOCKS';
const DEV_UNLOCKED_PACKS_KEY = 'NAMEMATCH_DEV_UNLOCKED_PACKS';
const CURATED_RECOMMENDATION_ACCESS_MS = 24 * 60 * 60 * 1000;
const PREMIUM_COUPLE_PRICE_FALLBACK = '€29.99';

type CuratedUnlockPack = {
  packType: string;
  title: string;
  titleKey?: string;
  price: number;
  packNames: string[];
  unlockedAt: number;
};

function curatedPackLabelSuffix(packType: string): string {
  if (packType.startsWith('CURATED_')) return packType.slice('CURATED_'.length);
  if (packType.startsWith('AI_')) return packType.slice('AI_'.length);
  return packType;
}

export default function ShopScreen() {
  const { t, language } = useTranslation();
  const { profile, refreshProfile, restorePurchases } = useAuth();
  const {
    effectiveUnlockedPacks,
    refreshUnlockedPacks,
    clearDevUnlockedPacks,
    residenceCountry,
  } = useApp();
  const { loadMoreNames } = useSwipeDeckActions();
  const isFocused = useIsFocused();
  const [showCountryBrowser, setShowCountryBrowser] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [curatedUnlocks, setCuratedUnlocks] = useState<Record<string, CuratedUnlockPack>>({});
  const [nowMs, setNowMs] = useState(Date.now());
  const [premiumPrice, setPremiumPrice] = useState('...');
  const realPremiumState = effectiveUnlockedPacks.length > 0;
  const isPremium =
    __DEV__ && DEV_PREVIEW.forcePaywallState === 'owned'
      ? true
      : __DEV__ && DEV_PREVIEW.forcePaywallState === 'locked'
        ? false
        : realPremiumState;

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

  const isPurchased = (_key: string) => isPremium;

  const getLocalizedCountryLabel = (countryName: string): string =>
    translateCountryName(t, countryName, countryName);

  const formatPrice = (amount: number): string => {
    const currency = resolveCurrencyCode(residenceCountry, profile?.region_preference);
    return formatLocalizedPrice(amount, currency, language);
  };

  const localizePackTitle = (packType: string, fallbackTitle: string, titleKey?: string): string => {
    const translatedFromKey = titleKey ? t(titleKey) : '';
    if (titleKey && translatedFromKey !== titleKey) return translatedFromKey;
    const slug = curatedPackLabelSuffix(packType);
    if (slug === 'CLASSIC_EU') return t('pack.euPack.title');
    if (slug === 'STRONG_BOY' || slug === 'ELEGANT_GIRL') return t('pack.usPack.title');
    if (slug.startsWith('COUNTRY_NETHERLANDS')) return t('pack.nlFavorites.title');
    if (slug === 'MODERN_SHORT' || slug === 'RARE_GLOBAL' || slug.startsWith('COUNTRY_')) {
      return t('pack.worldwide.title');
    }
    return fallbackTitle;
  };

  const getPackLabel = (pack: NamePack): string => {
    const titleKey = pack.titleKey ?? pack.labelKey;
    if (titleKey) {
      const translated = t(titleKey);
      if (translated !== titleKey) return translated;
    }
    return pack.label;
  };

  const getPackDescription = (pack: NamePack): string => {
    if (pack.descriptionKey) {
      const translated = t(pack.descriptionKey);
      if (translated !== pack.descriptionKey) return translated;
    }
    return pack.description;
  };

  const premiumCouplePack = useMemo<NamePack>(
    () => ({
      key: PREMIUM_COUPLE_PACK_KEY,
      label: t('shop.premiumCouple.title'),
      description: t('shop.premiumCouple.subtitle'),
      type: 'worldwide',
      price: 29.99,
      priceCents: 2999,
      nameCount: 0,
      emoji: '💞',
      gradient: [colors.onboarding.primary, colors.onboarding.secondary],
    }),
    [t],
  );

  const countryResults = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((c) => {
      const localized = getLocalizedCountryLabel(c.name).toLowerCase();
      return c.name.toLowerCase().includes(q) || localized.includes(q);
    });
  }, [countryQuery, t]);

  useEffect(() => {
    let mounted = true;
    PurchaseService.getLocalizedPrice()
      .then((price) => {
        if (mounted) setPremiumPrice(price);
      })
      .catch(() => {
        if (mounted) setPremiumPrice(PREMIUM_COUPLE_PRICE_FALLBACK);
      });
    const loadUnlocks = async () => {
      const raw = await AsyncStorage.getItem(CURATED_RECOMMENDATION_UNLOCKS_STORAGE_KEY).catch(() => null);
      let parsed: Record<string, CuratedUnlockPack> = {};
      if (raw) {
        try {
          parsed = JSON.parse(raw) as Record<string, CuratedUnlockPack>;
        } catch {
          parsed = {};
        }
      }

      const timestamp = Date.now();
      const active = Object.fromEntries(
        Object.entries(parsed).filter(
          ([, pack]) => timestamp - pack.unlockedAt < CURATED_RECOMMENDATION_ACCESS_MS,
        ),
      );

      if (Object.keys(active).length !== Object.keys(parsed).length) {
        await AsyncStorage.setItem(CURATED_RECOMMENDATION_UNLOCKS_STORAGE_KEY, JSON.stringify(active)).catch(
          () => {},
        );
      }

      if (mounted) {
        setCuratedUnlocks(active);
      }
    };

    loadUnlocks();
    const timer = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    AsyncStorage.getItem(CURATED_RECOMMENDATION_UNLOCKS_STORAGE_KEY)
      .then((raw) => {
        if (!raw) {
          setCuratedUnlocks({});
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Record<string, CuratedUnlockPack>;
          setCuratedUnlocks(parsed);
        } catch {
          setCuratedUnlocks({});
        }
      })
      .catch(() => {});
    void refreshUnlockedPacks();
  }, [isFocused, refreshUnlockedPacks]);

  useEffect(() => {
    const active = Object.fromEntries(
      Object.entries(curatedUnlocks).filter(
        ([, pack]) => nowMs - pack.unlockedAt < CURATED_RECOMMENDATION_ACCESS_MS,
      ),
    );
    if (Object.keys(active).length !== Object.keys(curatedUnlocks).length) {
      setCuratedUnlocks(active);
      AsyncStorage.setItem(CURATED_RECOMMENDATION_UNLOCKS_STORAGE_KEY, JSON.stringify(active)).catch(() => {});
    }
  }, [curatedUnlocks, nowMs]);

  const createCountryPack = (countryName: string, flag: string, countryLabel: string): NamePack => ({
    key: `COUNTRY_${countryName.replace(/\s+/g, '_').toUpperCase()}`,
    label: t('shop.countryPackLabel', { country: countryLabel }),
    description: t('shop.countryPackDescription', { country: countryLabel }),
    type: 'country',
    price: 2.99,
    priceCents: 299,
    nameCount: 120,
    emoji: flag,
    gradient: [colors.match.secondary, colors.onboarding.secondary],
  });

  const handlePurchase = async (pack: NamePack) => {
    if (isPurchased(pack.key)) {
      Alert.alert(t('shop.alert.alreadyUnlockedTitle'), t('shop.alert.alreadyUnlockedBody', { label: pack.label }));
      return;
    }
    if (__DEV__) {
      try {
        await addDevUnlockedPack(pack.key);
        await refreshUnlockedPacks();
        loadMoreNames();
        Alert.alert(
          t('shop.devUnlockTitle'),
          t('shop.devUnlockBody', { label: pack.label }),
        );
      } catch (err: any) {
        Alert.alert(t('common.error'), err?.message ?? t('shop.devUnlockError'));
      }
      return;
    }
    try {
      const result = await PurchaseService.purchasePremium();
      if (!result.success) return;
      if (PurchaseService.hasPremiumEntitlement(result.customerInfo)) {
        await PurchaseService.syncRevenueCatEntitlement();
        await refreshProfile();
      }
      await refreshUnlockedPacks();
      loadMoreNames();
      Alert.alert(t('shop.purchaseSuccessTitle'), t('shop.purchaseSuccessBody'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message ?? t('shop.purchaseError'));
    }
  };

  const handleRestorePurchases = async () => {
    try {
      await restorePurchases();
      await refreshUnlockedPacks();
      loadMoreNames();
      Alert.alert(t('shop.restoreSuccessTitle'), t('shop.restoreSuccessBody'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message ?? t('shop.restoreError'));
    }
  };

  const handleResetDevPremium = async () => {
    if (!__DEV__) return;
    await clearDevUnlockedPacks();
    await AsyncStorage.removeItem(CURATED_RECOMMENDATION_UNLOCKS_STORAGE_KEY).catch(() => {});
    setCuratedUnlocks({});
    loadMoreNames();
    Alert.alert('Dev premium reset');
  };

  const freeSwipesLeft = profile?.free_swipes_remaining ?? 0;
  const hasUnlockedPacks = isPremium;
  const formatRemaining = (pack: CuratedUnlockPack) => {
    const remaining = Math.max(0, CURATED_RECOMMENDATION_ACCESS_MS - (nowMs - pack.unlockedAt));
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return { hours, minutes };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('shop.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('shop.subtitle')}</Text>
        </View>

        {/* Free tier status */}
        <View style={styles.freeCard}>
          <View style={styles.freeCardLeft}>
            <Text style={styles.freeCardEmoji}>{hasUnlockedPacks ? '✨' : '🎁'}</Text>
            <View>
              <Text style={styles.freeCardTitle}>
                {hasUnlockedPacks ? t('shop.premiumActive.title') : t('shop.free.title')}
              </Text>
              <Text style={styles.freeCardSub}>
                {hasUnlockedPacks
                  ? t('shop.premiumActive.subtitle')
                  : freeSwipesLeft > 0
                    ? t('shop.free.remaining', { count: freeSwipesLeft })
                    : t('shop.free.empty')}
              </Text>
            </View>
          </View>
          {!hasUnlockedPacks ? (
            <View style={styles.freeProgress}>
              <View
                style={[
                  styles.freeProgressFill,
                  { width: `${(freeSwipesLeft / FREE_SWIPE_BANK_CAP) * 100}%` },
                ]}
              />
            </View>
          ) : null}
        </View>

        {/* Single Premium Couple offer */}
        <View style={styles.section}>
          <View style={[styles.premiumHero, SHADOWS.card]}>
            <LinearGradient
              colors={premiumCouplePack.gradient}
              style={styles.premiumHeroIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.premiumHeroEmoji}>{premiumCouplePack.emoji}</Text>
            </LinearGradient>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{t('shop.badge.bestValue')}</Text>
            </View>
            <Text style={styles.premiumHeroTitle}>{premiumCouplePack.label}</Text>
            <Text style={styles.premiumHeroSubtitle}>{premiumCouplePack.description}</Text>
            <Text style={styles.premiumPrice}>{premiumPrice}</Text>
            {(
              [
                'paywall.couple.feature.unlimitedSwipes',
                'paywall.couple.feature.curatedNames',
                'paywall.couple.feature.advancedFilters',
                'paywall.couple.feature.meaningInsights',
              ] as const
            ).map((featureKey) => (
              <View key={featureKey} style={styles.premiumFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.onboarding.primary} />
                <Text style={styles.premiumFeatureText}>{t(featureKey)}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.premiumCta, isPurchased(premiumCouplePack.key) && styles.premiumCtaOwned]}
              onPress={() => handlePurchase(premiumCouplePack)}
              activeOpacity={0.9}
            >
              <Text style={[styles.premiumCtaText, isPurchased(premiumCouplePack.key) && styles.premiumCtaTextOwned]}>
                {isPurchased(premiumCouplePack.key)
                  ? t('shop.badge.owned')
                  : t('shop.premiumCouple.cta')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={handleRestorePurchases}
              activeOpacity={0.85}
            >
              <Text style={styles.restoreBtnText}>{t('shop.restorePurchases')}</Text>
            </TouchableOpacity>
            {__DEV__ ? (
              <TouchableOpacity
                style={styles.devResetBtn}
                onPress={handleResetDevPremium}
                activeOpacity={0.85}
              >
                <Text style={styles.devResetBtnText}>Reset Dev Premium</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.footerNoteText}>
            {t('shop.footerNote')}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showCountryBrowser}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCountryBrowser(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('shop.section.country')}</Text>
              <TouchableOpacity onPress={() => setShowCountryBrowser(false)}>
                <Ionicons name="close" size={22} color={colors.shortlist.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={t('shop.searchCountries')}
              placeholderTextColor={COLORS.textMuted}
              value={countryQuery}
              onChangeText={setCountryQuery}
              autoCorrect={false}
            />
            <ScrollView contentContainerStyle={styles.countryList}>
              {countryResults.map((country) => {
                const localizedCountryName = getLocalizedCountryLabel(country.name);
                const pack = createCountryPack(country.name, country.flag, localizedCountryName);
                return (
                  <TouchableOpacity
                    key={pack.key}
                    style={styles.countryRow}
                    onPress={() => {
                      setShowCountryBrowser(false);
                      void handlePurchase(pack);
                    }}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={styles.countryName}>{localizedCountryName}</Text>
                    <Text style={styles.countryPrice}>{formatPrice(pack.price)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface PackCardProps {
  pack: NamePack;
  isPurchased: boolean;
  onPress: () => void;
  isFeatured?: boolean;
  compact?: boolean;
}

function PackCard({ pack, isPurchased, onPress, isFeatured, compact }: PackCardProps) {
  const { t, language } = useTranslation();
  const { profile } = useAuth();
  const { residenceCountry } = useApp();
  const formatPrice = (amount: number): string => {
    const currency = resolveCurrencyCode(residenceCountry, profile?.region_preference);
    return formatLocalizedPrice(amount, currency, language);
  };
  return (
    <TouchableOpacity
      style={[
        styles.packCard,
        compact && styles.packCardCompact,
        isPurchased && styles.packCardOwned,
        SHADOWS.card,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>{t('shop.badge.bestValue')}</Text>
        </View>
      )}

      <LinearGradient
        colors={pack.gradient}
        style={[styles.packGradient, compact && styles.packGradientCompact]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.packEmoji}>{pack.emoji}</Text>
      </LinearGradient>

      <View style={styles.packBody}>
        <Text style={[styles.packLabel, compact && styles.packLabelCompact]}>
          {pack.label}
        </Text>
        {!compact && (
          <Text style={styles.packDescription}>{pack.description}</Text>
        )}
        <Text style={styles.packCount}>{t('shop.packCount', { count: pack.nameCount })}</Text>
      </View>

      <View style={styles.packFooter}>
        {isPurchased ? (
          <View style={styles.ownedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.secondaryDark} />
            <Text style={styles.ownedText}>{t('shop.badge.owned')}</Text>
          </View>
        ) : (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{formatPrice(pack.price)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.shortlist.background,
  },
  scroll: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: colors.shortlist.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.text,
    marginTop: 2,
  },
  freeCard: {
    marginHorizontal: SPACING.xl,
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  freeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  freeCardEmoji: {
    fontSize: 28,
  },
  freeCardTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: colors.shortlist.text,
  },
  freeCardSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  freeProgress: {
    height: 6,
    backgroundColor: colors.neutral.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  freeProgressFill: {
    height: '100%',
    backgroundColor: colors.onboarding.primary,
    borderRadius: 3,
  },
  browseCountryBtn: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  browseCountryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  browseCountryText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: colors.shortlist.text,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: colors.shortlist.text,
  },
  premiumHero: {
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: SPACING.lg,
    overflow: 'hidden',
    gap: SPACING.sm,
  },
  premiumHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  premiumHeroEmoji: {
    fontSize: 34,
  },
  premiumHeroTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
    color: colors.shortlist.text,
    letterSpacing: -0.5,
  },
  premiumHeroSubtitle: {
    fontSize: FONTS.sizes.md,
    color: colors.shortlist.text,
    lineHeight: 22,
  },
  premiumPrice: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
    color: colors.shortlist.text,
    marginTop: SPACING.xs,
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  premiumFeatureText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.shortlist.text,
  },
  premiumCta: {
    marginTop: SPACING.sm,
    backgroundColor: colors.onboarding.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  premiumCtaOwned: {
    backgroundColor: colors.neutral.bgSoft,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  premiumCtaText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '900',
    color: colors.neutral.white,
  },
  premiumCtaTextOwned: {
    color: colors.shortlist.text,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  restoreBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.onboarding.primary,
  },
  devResetBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  devResetBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  aiPackCard: {
    width: '100%',
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: SPACING.md,
    gap: 4,
  },
  aiPackTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: colors.shortlist.text,
  },
  aiPackMeta: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.text,
  },
  aiCountdown: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  aiUrgency: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: colors.match.primary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  packCard: {
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  packCardCompact: {
    width: '47%',
  },
  packCardOwned: {
    opacity: 0.8,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  featuredBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: colors.shortlist.text,
    letterSpacing: 0.5,
  },
  packGradient: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packGradientCompact: {
    height: 70,
  },
  packEmoji: {
    fontSize: 40,
  },
  packBody: {
    padding: SPACING.md,
    gap: 2,
  },
  packLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: colors.shortlist.text,
  },
  packLabelCompact: {
    fontSize: FONTS.sizes.md,
  },
  packDescription: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.text,
    lineHeight: 18,
  },
  packCount: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.text,
    fontWeight: '600',
  },
  packFooter: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  priceTag: {
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  priceText: {
    color: colors.shortlist.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  ownedBadge: {
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  ownedText: {
    color: colors.shortlist.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  footerNoteText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: colors.shortlist.text,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: colors.shortlist.text,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    color: colors.shortlist.text,
  },
  countryList: {
    paddingBottom: SPACING.md,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    gap: SPACING.sm,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryName: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: colors.shortlist.text,
  },
  countryPrice: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.shortlist.text,
  },
});
