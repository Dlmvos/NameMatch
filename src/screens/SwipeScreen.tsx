import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useMatchState, useRoomState } from '../context/RoomContext';
import { useSwipeDeckActions, useSwipeDeckState } from '../context/SwipeDeckContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';
import SwipeCard from '../components/SwipeCard';
import MatchCelebration from '../components/MatchCelebration';
import FilterSheet from '../components/FilterSheet';
import NameDetailModal from '../components/NameDetailModal';
import { formatLocalizedPrice, resolveCurrencyCode } from '../lib/currency';
import { getSwipeMetadataLabelKey } from '../lib/swipeMetadataLabel';
import { getRecommendedPack, type RecommendedPack, type SwipeSignal } from '../services/namePackRecommendationService';
import type { BabyName, RootStackParamList } from '../types';
import { colors, COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme';

/** Slice depth: keep one extra card mounted under the stack so the next name is already rendered before it surfaces. */
const VISIBLE_CARDS = 4;
const AI_PACK_UNLOCKS_KEY = 'AI_PACK_UNLOCKS';
const DEV_PAYWALL_INTERVAL = 10;
const DEV_PREVIEW_MATCH: BabyName = {
  id: 'dev-match-preview',
  name: 'Noah',
  meaning: 'Rest; comfort',
  meaningTranslations: {
    nl: 'Rust; troost',
    es: 'Descanso; consuelo',
  },
  origin: 'Hebrew',
  gender: 'boy',
  country: 'Netherlands',
  region: 'EU',
  is_worldwide: true,
  popularity_rank: 5,
  trend: 'stable',
};
const DEV_SCREENSHOT_NAMES: BabyName[] = [
  {
    id: 'dev-screenshot-aurelia',
    name: 'Aurelia',
    meaning: 'Golden; radiant',
    meaningTranslations: {
      nl: 'Gouden; stralend',
      es: 'Dorada; radiante',
    },
    origin: 'Latin',
    gender: 'girl',
    country: 'Spain',
    region: 'EU',
    is_worldwide: true,
    popularity_rank: 18,
    trend: 'rising',
  },
  {
    id: 'dev-screenshot-mateo',
    name: 'Mateo',
    meaning: 'Gift of God',
    meaningTranslations: {
      nl: 'Geschenk van God',
      es: 'Regalo de Dios',
    },
    origin: 'Spanish',
    gender: 'boy',
    country: 'Spain',
    region: 'EU',
    is_worldwide: true,
    popularity_rank: 5,
    trend: 'stable',
  },
  {
    id: 'dev-screenshot-livia',
    name: 'Livia',
    meaning: 'Graceful; blue',
    origin: 'Roman',
    gender: 'girl',
    country: 'Italy',
    region: 'EU',
    is_worldwide: true,
    popularity_rank: 21,
    trend: 'classic',
  },
  {
    id: 'dev-screenshot-elio',
    name: 'Elio',
    meaning: 'Sun',
    origin: 'Italian',
    gender: 'boy',
    country: 'Italy',
    region: 'EU',
    is_worldwide: true,
    popularity_rank: 28,
    trend: 'rising',
  },
];

export default function SwipeScreen() {
  const { t } = useTranslation();
  const { namesToSwipe, isLoadingNames, filters, activeFilterCount } = useSwipeDeckState();
  const { recordSwipe, loadMoreNames, setFilters } = useSwipeDeckActions();
  const { countryPreference, residenceCountry, effectiveUnlockedPacks, effectiveLanguage } = useApp();
  const { room } = useRoomState();
  const { latestMatch, dismissLatestMatch } = useMatchState();
  const { profile } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isSwipingRef = useRef(false);
  const swipeCountRef = useRef(0);
  const lastOfferSwipeRef = useRef(-30);
  const swipeSignalsRef = useRef<SwipeSignal[]>([]);
  const offeredPackTypesRef = useRef<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [suggestedPack, setSuggestedPack] = useState<RecommendedPack | null>(null);
  const [showPackModal, setShowPackModal] = useState(false);
  const [devPreviewMatch, setDevPreviewMatch] = useState<BabyName | null>(null);
  const [devDetailName, setDevDetailName] = useState<BabyName | null>(null);
  const [showDevScreenshotMenu, setShowDevScreenshotMenu] = useState(false);
  const [useDevScreenshotDeck, setUseDevScreenshotDeck] = useState(false);
  const didRefillAttemptRef = useRef(false);
  const lockedAttemptRef = useRef(0);

  // Completion-bias: show 'N swipes to curated picks' tied to real 15-swipe recommendation cadence
  const RECOMMENDATION_CADENCE = 15;

  const freeSwipesLeft = profile?.free_swipes_remaining ?? 0;
  const hasUnlockedPacks = effectiveUnlockedPacks.length > 0;
  const hasPartner = !!(room?.user2_id);
  const screenshotNames = __DEV__ && useDevScreenshotDeck ? DEV_SCREENSHOT_NAMES : namesToSwipe;
  const visibleNames = screenshotNames.slice(0, VISIBLE_CARDS);
  const nextName = visibleNames[1];
  const totalRemaining = screenshotNames.length;
  const isLocked =
    !useDevScreenshotDeck &&
    profile !== null &&
    freeSwipesLeft <= 0 &&
    !hasUnlockedPacks;
  const formatOfferPrice = (amount: number) => {
    const currency = resolveCurrencyCode(residenceCountry, profile?.region_preference);
    return formatLocalizedPrice(amount, currency, effectiveLanguage);
  };
  const getNextPreviewLabel = (name: BabyName): string => {
    const key = getSwipeMetadataLabelKey(name, countryPreference);
    return key ? t(key) : t('swipe.next.upNext');
  };
  const nextPreviewLabel = nextName ? getNextPreviewLabel(nextName) : t('swipe.next.upNext');
  const resolveRecommendedPackTitle = (pack: RecommendedPack | null): string => {
    if (!pack) return '';
    if (pack.titleKey) {
      const translated = t(pack.titleKey);
      if (translated !== pack.titleKey) return translated;
    }
    return pack.title;
  };
  const swipesToCurated = RECOMMENDATION_CADENCE - (swipeCountRef.current % RECOMMENDATION_CADENCE);
  const shouldShowProgressCue =
    swipeCountRef.current > 0 &&
    swipesToCurated > 0 &&
    swipesToCurated <= 3;

  useEffect(() => {
    if (!isFocused) {
      didRefillAttemptRef.current = false;
    }
  }, [isFocused]);

  useEffect(() => {
    if (
      isFocused &&
      !isLoadingNames &&
      namesToSwipe.length === 0 &&
      effectiveUnlockedPacks.length > 0 &&
      !didRefillAttemptRef.current
    ) {
      didRefillAttemptRef.current = true;
      loadMoreNames();
    }
  }, [isFocused, isLoadingNames, namesToSwipe.length, effectiveUnlockedPacks, loadMoreNames]);

  const handleSwipe = async (name: BabyName, direction: 'left' | 'right') => {
    if (__DEV__ && useDevScreenshotDeck) return;
    if (isLocked) {
      if (!__DEV__) {
        navigation.navigate('Paywall');
        return;
      }
      lockedAttemptRef.current += 1;
      if (lockedAttemptRef.current % DEV_PAYWALL_INTERVAL === 0) {
        navigation.navigate('Paywall');
      }
      return;
    }
    if (isSwipingRef.current) return;
    console.log('[SwipeScreen] handleSwipe', name.id, direction);
    isSwipingRef.current = true;
    let swipePromise: Promise<boolean>;
    try {
      swipePromise = recordSwipe(name.id, direction);
    } finally {
      // Release before persistence finishes so the promoted card can swipe while Supabase/updateProfile runs
      isSwipingRef.current = false;
    }
    await swipePromise;

    swipeCountRef.current += 1;
    swipeSignalsRef.current = [
      ...swipeSignalsRef.current.slice(-89),
      { direction, name },
    ];

    const shouldCheckRecommendation =
      swipeCountRef.current % 15 === 0 &&
      swipeCountRef.current - lastOfferSwipeRef.current >= 30 &&
      namesToSwipe.length > 0 &&
      !showPackModal;

    if (shouldCheckRecommendation) {
      const recommendation = getRecommendedPack({
        swipeHistory: swipeSignalsRef.current,
        genderPreference: profile?.gender_preference,
        countryPreference,
        regionPreference: profile?.region_preference,
        purchasedPacks: effectiveUnlockedPacks,
      });

      if (
        recommendation &&
        !offeredPackTypesRef.current.has(recommendation.packType) &&
        !effectiveUnlockedPacks.includes(recommendation.packType)
      ) {
        setTimeout(() => {
          setSuggestedPack(recommendation);
          setShowPackModal(true);
          lastOfferSwipeRef.current = swipeCountRef.current;
          offeredPackTypesRef.current.add(recommendation.packType);
        }, 180);
      }
    }
  };

  const handleBlockedSwipe = () => {
    if (!isLocked) return;
    if (!__DEV__) {
      navigation.navigate('Paywall');
      return;
    }
    lockedAttemptRef.current += 1;
    if (lockedAttemptRef.current % DEV_PAYWALL_INTERVAL === 0) {
      navigation.navigate('Paywall');
    }
  };

  if (isLoadingNames) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FFF0F5', '#FFF9F5']} style={StyleSheet.absoluteFill} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('swipe.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (totalRemaining === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FFF0F5', '#FFF9F5']} style={StyleSheet.absoluteFill} />
        <View style={styles.centerState}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text
            style={styles.emptyTitle}
            onLongPress={__DEV__ ? () => setShowDevScreenshotMenu(true) : undefined}
          >
            {t('swipe.empty.title')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {freeSwipesLeft > 0
              ? t('swipe.empty.freeRemaining', { count: freeSwipesLeft })
              : t('swipe.empty.locked')}
          </Text>
        </View>
        {__DEV__ ? renderDevScreenshotMenu() : null}
      </SafeAreaView>
    );
  }

  console.log('[SwipeScreen] top ids (render)', namesToSwipe.slice(0, 3).map((n) => n.id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FFF0F5', '#FFF9F5']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            onLongPress={__DEV__ ? () => setShowDevScreenshotMenu(true) : undefined}
          >
            {t('swipe.header.discover')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={2}>
            {t('swipe.header.namesLeft', { count: totalRemaining })}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {!hasPartner && room && (
            <View style={styles.tag}>
              <Text
                style={styles.tagText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {t('swipe.header.soloRoom', { code: room.code })}
              </Text>
            </View>
          )}
          {!hasUnlockedPacks ? (
            <View style={styles.tag}>
              <Text
                style={styles.tagText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {freeSwipesLeft > 0
                  ? t('swipe.header.free', { count: freeSwipesLeft })
                  : t('swipe.header.locked')}
              </Text>
            </View>
          ) : null}
          {/* Filter button */}
          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFilterCount > 0 ? colors.neutral.white : colors.neutral.darkGray}
            />
            {activeFilterCount > 0 && (
              <Text style={styles.filterBadge}>{activeFilterCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Completion-bias progress cue — only in final 3 swipes to cadence */}
      {shouldShowProgressCue ? (
        <View pointerEvents="none" style={styles.progressCue}>
          <Text style={styles.progressCueText}>
            {t('swipe.progress.curated', {
              count: swipesToCurated,
            })}
          </Text>
        </View>
      ) : null}

      {/* Card Stack — rendered back-to-front so top card is on top */}
           <View style={styles.cardStack}>
        {[...visibleNames].reverse().map((name, reverseIndex) => {
          const cardIndex = visibleNames.length - 1 - reverseIndex;
          const isTop = cardIndex === 0;
          const metadataKey = getSwipeMetadataLabelKey(name, countryPreference);
          return (
            <SwipeCard
              key={name.id}
              name={name}
              isTop={isTop}
              cardIndex={cardIndex}
              metadataKey={metadataKey}
              nextPreviewLabel={cardIndex === 1 ? nextPreviewLabel : undefined}
              canSwipe={!isLocked}
              onBlockedSwipe={handleBlockedSwipe}
              onSwipeLeft={() => handleSwipe(name, 'left')}
              onSwipeRight={() => handleSwipe(name, 'right')}
            />
          );
        })}
      </View>

      {!hasUnlockedPacks && freeSwipesLeft <= 10 && freeSwipesLeft > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            {t('swipe.warning', { count: freeSwipesLeft })}
          </Text>
        </View>
      )}

      {latestMatch && (
        <MatchCelebration name={latestMatch} onDismiss={dismissLatestMatch} />
      )}
      {__DEV__ && devPreviewMatch ? (
        <MatchCelebration
          name={devPreviewMatch}
          onDismiss={() => setDevPreviewMatch(null)}
        />
      ) : null}

      <FilterSheet
        visible={showFilters}
        currentFilters={filters}
        onApply={setFilters}
        onClose={() => setShowFilters(false)}
      />
      {__DEV__ ? (
        <NameDetailModal
          name={devDetailName}
          visible={devDetailName !== null}
          onClose={() => setDevDetailName(null)}
        />
      ) : null}
      {__DEV__ ? renderDevScreenshotMenu() : null}

      <Modal
        visible={showPackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPackModal(false)}
      >
        <View style={styles.offerBackdrop}>
          <View style={styles.offerCard}>
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>{t('swipe.pack.badge')}</Text>
            </View>
            <Text
              style={styles.offerTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.88}
            >
              {t('swipe.pack.title')}
            </Text>
            <Text style={styles.offerSubtitle} numberOfLines={2}>
              {t('swipe.pack.subtitle')}
            </Text>
            {suggestedPack ? (
              <>
                <LinearGradient
                  colors={['#FFF6FC', '#F6F0FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.offerHighlightCard}
                >
                  <Text style={styles.offerHighlightEyebrow}>{t('swipe.pack.recommendedLabel')}</Text>
                  <Text style={styles.offerPackName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.86}>
                    {resolveRecommendedPackTitle(suggestedPack)}
                  </Text>
                  <Text style={styles.offerPriceText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                    {formatOfferPrice(suggestedPack.price)}
                  </Text>
                  <Text style={styles.offerPriceCaption}>{t('swipe.pack.value.oneTimeUnlock')}</Text>
                </LinearGradient>

                <View style={styles.offerMetaRow}>
                  <View style={styles.offerMetaPill}>
                    <Text style={styles.offerMetaText} numberOfLines={1}>
                      {t('swipe.pack.includes', { count: suggestedPack.packNames.length })}
                    </Text>
                  </View>
                  <View style={styles.offerMetaPill}>
                    <Text style={styles.offerMetaText} numberOfLines={1}>
                      {t('swipe.pack.oneTime', { price: formatOfferPrice(suggestedPack.price) })}
                    </Text>
                  </View>
                  <View style={styles.offerMetaPill}>
                    <Text style={styles.offerMetaText} numberOfLines={1}>
                      {t('swipe.pack.value.instantAccess')}
                    </Text>
                  </View>
                </View>
              </>
            ) : null}
            <View style={styles.offerActions}>
              <TouchableOpacity
                style={[styles.offerBtn, styles.offerBtnPrimary]}
                activeOpacity={0.9}
                onPress={async () => {
                  if (suggestedPack) {
                    const existingRaw = await AsyncStorage.getItem(AI_PACK_UNLOCKS_KEY).catch(() => null);
                    let existing: Record<string, unknown> = {};
                    if (existingRaw) {
                      try {
                        existing = JSON.parse(existingRaw) as Record<string, unknown>;
                      } catch {
                        existing = {};
                      }
                    }
                    existing[suggestedPack.packType] = {
                      packType: suggestedPack.packType,
                      title: suggestedPack.title,
                      titleKey: suggestedPack.titleKey,
                      price: suggestedPack.price,
                      packNames: suggestedPack.packNames.map((n) => n.name),
                      unlockedAt: Date.now(),
                    };
                    await AsyncStorage.setItem(AI_PACK_UNLOCKS_KEY, JSON.stringify(existing)).catch(() => {});
                  }
                  setShowPackModal(false);
                  navigation.navigate('MainTabs', { screen: 'Shop' });
                }}
              >
                <Text style={styles.offerBtnPrimaryText}>{t('swipe.pack.unlock')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.offerBtn, styles.offerBtnSecondary]}
                activeOpacity={0.85}
                onPress={() => setShowPackModal(false)}
              >
                <Text style={styles.offerBtnSecondaryText}>{t('swipe.pack.keep')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  function renderDevScreenshotMenu() {
    return (
      <Modal
        visible={showDevScreenshotMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDevScreenshotMenu(false)}
      >
        <TouchableOpacity
          style={styles.devMenuBackdrop}
          activeOpacity={1}
          onPress={() => setShowDevScreenshotMenu(false)}
        >
          <View style={styles.devMenuCard}>
            <TouchableOpacity
              style={styles.devMenuItem}
              onPress={() => {
                setUseDevScreenshotDeck((prev) => !prev);
                setShowDevScreenshotMenu(false);
              }}
            >
              <Text style={styles.devMenuText}>
                {useDevScreenshotDeck ? 'Use live deck' : 'Use screenshot deck'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devMenuItem}
              onPress={() => {
                setDevPreviewMatch(DEV_PREVIEW_MATCH);
                setShowDevScreenshotMenu(false);
              }}
            >
              <Text style={styles.devMenuText}>Show match celebration</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devMenuItem}
              onPress={() => {
                setDevDetailName(DEV_SCREENSHOT_NAMES[0]);
                setShowDevScreenshotMenu(false);
              }}
            >
              <Text style={styles.devMenuText}>Show name detail</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: SPACING.xs,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  headerRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexShrink: 0,
    maxWidth: '50%',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.neutral.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  filterBtnActive: {
    backgroundColor: colors.onboarding.primary,
    borderColor: colors.onboarding.primary,
  },
  filterBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.neutral.white,
  },
  tag: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 140,
  },
  tagText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  progressCue: {
    alignSelf: 'center',
    backgroundColor: colors.onboarding.accent,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    marginBottom: SPACING.xs,
  },
  progressCueText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onboarding.text,
    letterSpacing: 0.2,
    opacity: 0.6,
  },
  devScreenshotTools: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  devPreviewBtn: {
    alignSelf: 'center',
    backgroundColor: colors.neutral.bgSoft,
    borderColor: colors.neutral.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginBottom: SPACING.xs,
  },
  devPreviewBtnActive: {
    backgroundColor: colors.onboarding.accent,
    borderColor: colors.onboarding.secondary,
  },
  devPreviewBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: colors.neutral.darkGray,
  },
  devMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 88,
    paddingHorizontal: SPACING.lg,
  },
  devMenuCard: {
    minWidth: 220,
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  devMenuItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  devMenuText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.neutral.darkGray,
  },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  loadingText: { marginTop: SPACING.md, fontSize: 15, color: COLORS.textSecondary },
  warningBanner: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  warningText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  offerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  offerCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 24,
    padding: SPACING.xl + 2,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    ...SHADOWS.card,
  },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.onboarding.accent,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  offerBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: colors.onboarding.text,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  offerTitle: {
    fontSize: FONTS.sizes.xl + 2,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'left',
  },
  offerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'left',
    lineHeight: 19,
  },
  offerHighlightCard: {
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F1E4FF',
    gap: 4,
  },
  offerHighlightEyebrow: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  offerPackName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'left',
  },
  offerPriceText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  offerPriceCaption: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  offerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  offerMetaPill: {
    backgroundColor: colors.neutral.bgSoft,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  offerMetaText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  offerActions: {
    gap: SPACING.xs,
    marginTop: 2,
  },
  offerBtn: {
    borderRadius: 14,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  offerBtnPrimary: {
    backgroundColor: colors.onboarding.primary,
    ...SHADOWS.button,
  },
  offerBtnSecondary: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  offerBtnPrimaryText: {
    color: colors.neutral.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  offerBtnSecondaryText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
});
