import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BabyName, NameRarity } from '../types';
import { useTranslation } from '../i18n/I18nProvider';
import { translateCountryName } from '../i18n/display';
import { getLocalizedNameMeaning, cleanOriginForDisplay } from '../i18n/nameMeaningDisplay';
import type { SwipeMetadataLabelKey } from '../lib/swipeMetadataLabel';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import { enrichName, getTrendBg, getTrendFg } from '../services/nameEnrichment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const ROTATION_ANGLE = 12;

// Premium exit animation constants
const EXIT_TRANSLATE_X = SCREEN_WIDTH * 1.3;
const EXIT_DURATION_MIN = 160;   // fast fling
const EXIT_DURATION_MAX = 340;   // gentle drag
const COMMIT_DELAY_MS = 100;
const FLING_VELOCITY_THRESHOLD = 1.2;  // px/ms — above this = fast fling
/** Button starts at (0,0) and travels the full exit distance — use ~gentle-gesture timing so it matches fling/drag feel. */
const BUTTON_EXIT_DURATION = Math.round(EXIT_DURATION_MAX * 1.18);
/** Short ease-in pull so the card enters the same displacement family as a finger drag (no instant launch from rest). */
const BUTTON_PULL_DURATION_MS = 85;
const BUTTON_PULL_X_RATIO = 0.82;
/** Synthetic pull Y ~ horizontal drag (pan uses dy * 0.18; typical small vertical drift while committing). */
const BUTTON_PULL_Y = 7;
/** Defer deck commit until pull + exit complete (gesture still uses short commit; drag already moved the card). */
const BUTTON_COMMIT_DELAY_MS = BUTTON_PULL_DURATION_MS + BUTTON_EXIT_DURATION;

// Stack: behind-card starts almost at rest so animated promotion is subtle (4 tiers for deeper preload).
const STACK_SCALE  = [1.0,  0.97, 0.94, 0.91];
const STACK_OFFSET = [0,    6,    14,   22];
const STACK_MAX_INDEX = STACK_SCALE.length - 1;

/** Light-touch swipe labels — only elevated tiers; unknown / common bands stay unbadged. */
function swipeRarityLabel(rarity: NameRarity | undefined): string | null {
  if (!rarity || rarity.tier === 'unknown') return null;
  switch (rarity.tier) {
    case 'uncommon':
      return 'Uncommon';
    case 'rare':
      return 'Rare';
    case 'very_rare':
      return 'Very rare';
    default:
      return null;
  }
}

function swipePopularityLabel(popularityRank: number | undefined): string | null {
  if (!popularityRank || !Number.isFinite(popularityRank)) return null;
  if (popularityRank <= 50) return 'Top 50';
  if (popularityRank <= 100) return 'Top 100';
  return `#${popularityRank}`;
}

interface SwipeCardProps {
  name: BabyName;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onBlockedSwipe?: () => void;
  isTop: boolean;
  cardIndex: number;
  metadataKey?: SwipeMetadataLabelKey | null;
  nextPreviewLabel?: string;
  canSwipe?: boolean;
}

export default function SwipeCard({
  name,
  onSwipeLeft,
  onSwipeRight,
  onBlockedSwipe,
  isTop,
  cardIndex,
  metadataKey,
  nextPreviewLabel,
  canSwipe = true,
}: SwipeCardProps) {
  const { t } = useTranslation();
  const position = useRef(new Animated.ValueXY()).current;
  const promotionAnim = useRef(new Animated.Value(1)).current;
  const wasTopRef = useRef(isTop);
  const isSwipingRef = useRef(false);
  const pendingCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    isSwipingRef.current = false;
  }, [name.id, isTop, cardIndex, position]);

  useEffect(() => {
    return () => {
      if (pendingCommitTimerRef.current) {
        clearTimeout(pendingCommitTimerRef.current);
        pendingCommitTimerRef.current = null;
      }
    };
  }, []);

  // ── Animated promotion: behind-card rises to front-card position ──
  useEffect(() => {
    const wasTop = wasTopRef.current;
    if (!wasTop && isTop) {
      // Card just got promoted — spring from behind-card scale/offset to front.
      promotionAnim.setValue(0);
      Animated.spring(promotionAnim, {
        toValue: 1,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
    wasTopRef.current = isTop;
  }, [isTop, promotionAnim]);

  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [`-${ROTATION_ANGLE}deg`, '0deg', `${ROTATION_ANGLE}deg`],
    extrapolate: 'clamp',
  });

  const likeOpacityInterp = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const skipOpacityInterp = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD / 2, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      tension: 120,
      friction: 9,
      useNativeDriver: true,
    }).start();
  };

  /** Compute exit duration based on release velocity — fast flings exit fast. */
  const getExitDuration = (velocity: number): number => {
    const absV = Math.abs(velocity);
    if (absV > FLING_VELOCITY_THRESHOLD) return EXIT_DURATION_MIN;
    // Linearly interpolate between max and min based on velocity
    const t = Math.min(absV / FLING_VELOCITY_THRESHOLD, 1);
    return Math.round(EXIT_DURATION_MAX - t * (EXIT_DURATION_MAX - EXIT_DURATION_MIN));
  };

  /** Compute exit Y target from release velocity for a natural arc. */
  const getExitY = (vy: number): number => {
    // Clamp vertical component: range from -60 (upward fling) to +20
    return Math.max(-60, Math.min(20, vy * -40));
  };

  const startExit = (
    direction: 'left' | 'right',
    duration: number,
    exitY: number,
  ) => {
    Animated.timing(position, {
      toValue:
        direction === 'right'
          ? { x: EXIT_TRANSLATE_X, y: exitY }
          : { x: -EXIT_TRANSLATE_X, y: exitY },
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      isSwipingRef.current = false;
      position.setValue({ x: 0, y: 0 });
    });
  };

  /** Two-phase motion: ease-in to ~threshold (like a drag), then same exit timing/easing as gesture — avoids a visual pop from rest. */
  const startButtonExit = (direction: 'left' | 'right') => {
    const sign = direction === 'right' ? 1 : -1;
    const pullX = sign * SWIPE_THRESHOLD * BUTTON_PULL_X_RATIO;
    const exitY = getExitY(0.65);
    const endX = direction === 'right' ? EXIT_TRANSLATE_X : -EXIT_TRANSLATE_X;

    Animated.sequence([
      Animated.timing(position, {
        toValue: { x: pullX, y: BUTTON_PULL_Y },
        duration: BUTTON_PULL_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        toValue: { x: endX, y: exitY },
        duration: BUTTON_EXIT_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      isSwipingRef.current = false;
      position.setValue({ x: 0, y: 0 });
    });
  };

  const commitRight = (fromButton = false, vx = 0, vy = 0) => {
    if (!canSwipe) { onBlockedSwipe?.(); return; }
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;

    if (fromButton) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startButtonExit('right');
    } else {
      const duration = getExitDuration(vx);
      const exitY = getExitY(vy);
      startExit('right', duration, exitY);
    }

    const commitDelay = fromButton ? BUTTON_COMMIT_DELAY_MS : COMMIT_DELAY_MS;
    pendingCommitTimerRef.current = setTimeout(() => {
      pendingCommitTimerRef.current = null;
      onSwipeRight();
    }, commitDelay);
  };

  const commitLeft = (fromButton = false, vx = 0, vy = 0) => {
    if (!canSwipe) { onBlockedSwipe?.(); return; }
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;

    if (fromButton) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startButtonExit('left');
    } else {
      const duration = getExitDuration(vx);
      const exitY = getExitY(vy);
      startExit('left', duration, exitY);
    }

    const commitDelay = fromButton ? BUTTON_COMMIT_DELAY_MS : COMMIT_DELAY_MS;
    pendingCommitTimerRef.current = setTimeout(() => {
      pendingCommitTimerRef.current = null;
      onSwipeLeft();
    }, commitDelay);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) =>
      canSwipe && isTop && (Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6),
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      canSwipe && isTop && Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 6,
    onPanResponderMove: (_, gesture) => {
      if (!isTop) return;
      position.setValue({ x: gesture.dx, y: gesture.dy * 0.18 });
    },
    onPanResponderRelease: (_, gesture) => {
      if (!isTop || isSwipingRef.current) return;
      // Velocity-aware fling: if swiping fast enough, commit even below threshold
      const isFlingRight = gesture.vx > FLING_VELOCITY_THRESHOLD && gesture.dx > SWIPE_THRESHOLD * 0.4;
      const isFlingLeft = gesture.vx < -FLING_VELOCITY_THRESHOLD && gesture.dx < -SWIPE_THRESHOLD * 0.4;

      if (gesture.dx > SWIPE_THRESHOLD || isFlingRight) {
        commitRight(false, gesture.vx, gesture.vy);
      } else if (gesture.dx < -SWIPE_THRESHOLD || isFlingLeft) {
        commitLeft(false, gesture.vx, gesture.vy);
      } else {
        resetPosition();
      }
    },
    onPanResponderTerminate: () => {
      if (isTop) resetPosition();
    },
  });

  const safeIndex = Math.min(cardIndex, STACK_MAX_INDEX);
  const cardScale = STACK_SCALE[safeIndex];
  const cardTranslateY = STACK_OFFSET[safeIndex];

  // Promotion interpolation: springs from behind-card (index 1) values to front-card (index 0).
  // promotionAnim goes 0 → 1 when a card is promoted to top.
  const promotionTranslateY = promotionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [STACK_OFFSET[1], STACK_OFFSET[0]],   // 6 → 0
  });
  const promotionScale = promotionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [STACK_SCALE[1], STACK_SCALE[0]],      // 0.97 → 1.0
  });
  const topTranslateY = Animated.add(position.y, promotionTranslateY);

  if (!isTop) {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.card,
          styles.stackedCard,
          {
            transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
            zIndex: 10 - cardIndex,
            opacity: safeIndex === 1 ? 0.92 : 0.7,
          },
        ]}
      >
        <CardContent name={name} isTop={false} metadataKey={metadataKey} />
        {nextPreviewLabel && safeIndex === 1 ? (
          <View style={styles.nextPreviewPill}>
            <Text style={styles.nextPreviewText}>{nextPreviewLabel}</Text>
          </View>
        ) : null}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateX: position.x },
            { translateY: topTranslateY },
            { rotate: rotation },
            { scale: promotionScale },
          ],
          zIndex: 100,
        },
      ]}
    >
      <View style={styles.swipeSurface} {...panResponder.panHandlers}>
        <Animated.View pointerEvents="none" style={[styles.stamp, styles.likeStamp, { opacity: likeOpacityInterp }]}>
          <Text style={styles.likeStampText}>{t('swipe.card.love')}</Text>
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.stamp, styles.skipStamp, { opacity: skipOpacityInterp }]}>
          <Text style={styles.skipStampText}>{t('swipe.card.skip')}</Text>
        </Animated.View>

        <CardContent name={name} isTop metadataKey={metadataKey} />
      </View>

      <View style={styles.actions}>
        <View style={styles.actionSide}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={() => commitLeft(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.skipBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionCenter} pointerEvents="none">
          <Text style={styles.swipeHint}>{t('swipe.card.hint')}</Text>
        </View>

        <View style={[styles.actionSide, styles.actionSideRight]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => commitRight(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.likeBtnText}>♥</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Card Content
// ─────────────────────────────────────────────────────────────
function CardContent({
  name,
  isTop,
  metadataKey,
}: {
  name: BabyName;
  isTop: boolean;
  metadataKey?: SwipeMetadataLabelKey | null;
}) {
  const { t, language } = useTranslation();
  const [showPronunciation, setShowPronunciation] = useState(false);
  const enrichment = enrichName(name.name);

  const genderColor =
    name.gender === 'boy'
      ? colors.shortlist.secondary  // baby blue
      : name.gender === 'girl'
      ? colors.match.secondary      // rose pink
      : colors.onboarding.primary;  // teal for neutral

  const genderEmoji =
    name.gender === 'boy' ? '💙' : name.gender === 'girl' ? '💗' : '💜';

  const genderLabel =
    name.gender === 'boy'
      ? t('swipe.card.gender.boy')
      : name.gender === 'girl'
        ? t('swipe.card.gender.girl')
        : t('swipe.card.gender.neutral');

  const trend = enrichment.trend ?? name.trend;
  const getTranslated = (key: string, fallback: string): string => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  const trendLabel = trend
    ? trend === 'classic'
      ? `👑 ${t('name.category.classic')}`
      : trend === 'stable'
        ? `✦ ${t('name.category.modern')}`
        : `📈 ${t('name.category.trending')}`
    : '';
  const trendBg = getTrendBg(trend);
  const trendFg = getTrendFg(trend);
  const rarityLabel = swipeRarityLabel(name.rarity);
  const popularityRank = name.popularity_rank ?? enrichment.popularity_rank;
  const popularityLabel = swipePopularityLabel(popularityRank);
  const metadataLabel = metadataKey ? t(metadataKey) : null;
  const showMetadataLabel =
    !!metadataLabel &&
    !(metadataKey === 'swipe.next.popularChoice' && !!popularityLabel);
  const categoryLabel = showMetadataLabel ? metadataLabel : trendLabel || null;
  const categorySource: 'metadata' | 'trend' | null = showMetadataLabel
    ? 'metadata'
    : trendLabel
      ? 'trend'
      : null;
  const rightChipQueue: Array<
    | { kind: 'category'; label: string; source: 'metadata' | 'trend' }
    | { kind: 'popularity'; label: string }
    | { kind: 'rarity'; label: string }
  > = [];
  if (categoryLabel && categorySource) {
    rightChipQueue.push({ kind: 'category', label: categoryLabel, source: categorySource });
  }
  if (popularityLabel) {
    rightChipQueue.push({ kind: 'popularity', label: popularityLabel });
  }
  if (rarityLabel) {
    rightChipQueue.push({ kind: 'rarity', label: rarityLabel });
  }
  const rightChips = rightChipQueue.slice(0, 2);
  const pronunciation = enrichment.pronunciation ?? name.pronunciation;
  const cleanedCountry = cleanOriginForDisplay(name.country);
  const cleanedOrigin = cleanOriginForDisplay(name.origin);
  const translatedCountry = cleanedCountry
    ? translateCountryName(t, cleanedCountry, cleanedCountry)
    : '';
  const translatedOrigin = cleanedCountry
    ? translatedCountry
    : translateCountryName(t, cleanedOrigin, cleanedOrigin);
  const regionKey =
    name.region === 'LATIN_AMERICA'
      ? 'region.latinAmerica'
      : `region.${name.region.toLowerCase()}`;
  const translatedRegion = getTranslated(regionKey, name.region);

  return (
    <View style={styles.cardContent}>
      {/* Top row: gender badge + trend pill */}
      <View style={styles.topRow}>
        <View style={[styles.genderBadge, { backgroundColor: genderColor + '22' }]}>
          <Text style={styles.genderEmoji}>{genderEmoji}</Text>
          <Text style={[styles.genderLabel, { color: genderColor }]}>{genderLabel}</Text>
        </View>

        {rightChips.length > 0 ? (
          <View style={styles.topRowRight}>
            {rightChips.map((chip) => {
              if (chip.kind === 'category') {
                if (chip.source === 'trend') {
                  return (
                    <View key={`${chip.kind}:${chip.label}`} style={[styles.trendBadge, { backgroundColor: trendBg }]}>
                      <Text style={[styles.trendText, { color: trendFg }]}>{chip.label}</Text>
                    </View>
                  );
                }
                return (
                  <View key={`${chip.kind}:${chip.label}`} style={styles.metadataBadge}>
                    <Text style={styles.metadataBadgeText}>{chip.label}</Text>
                  </View>
                );
              }
              if (chip.kind === 'popularity') {
                return (
                  <View key={`${chip.kind}:${chip.label}`} style={styles.popularityBadge}>
                    <Text style={styles.popularityBadgeText}>{chip.label}</Text>
                  </View>
                );
              }
              return (
                <View key={`${chip.kind}:${chip.label}`} style={styles.rarityBadge}>
                  <Text style={styles.rarityBadgeText}>{chip.label}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Name */}
      <Text
        style={styles.nameText}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
        numberOfLines={1}
      >
        {name.name}
      </Text>

      {/* Origin + pronunciation row */}
      <View style={styles.originRow}>
        <Text style={styles.originText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
          {translatedOrigin}
        </Text>
        {isTop && pronunciation ? (
          <TouchableOpacity
            style={styles.pronBtn}
            onPress={() => setShowPronunciation((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.pronIcon}>📝</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {isTop && pronunciation ? (
        <Text style={styles.pronHint}>{t('swipe.card.pronunciationReveal')}</Text>
      ) : null}

      {/* Pronunciation guide (expandable) */}
      {showPronunciation && pronunciation ? (
        <View style={styles.pronBox}>
          <Text style={styles.pronText}>/{pronunciation}/</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Meaning — hidden when empty/placeholder */}
      {(() => {
        const meaningText = getLocalizedNameMeaning(name, language);
        if (!meaningText) return null;
        return (
          <View style={styles.meaningSection}>
            <Text style={styles.meaningLabel}>{t('name.meaningLabel')}</Text>
            <Text style={styles.meaningText} numberOfLines={3}>
              {meaningText}
            </Text>
          </View>
        );
      })()}

      {/* Bottom chips */}
      <View style={styles.chips}>
        {name.country ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>📍 {translatedCountry}</Text>
          </View>
        ) : null}
        <View style={styles.chip}>
          <Text style={styles.chipText}>🌐 {translatedRegion}</Text>
        </View>
      </View>
    </View>
  );
}

export function ReadOnlySwipeCard({ name }: { name: BabyName }) {
  return (
    <View style={[styles.card, styles.readOnlyCard]}>
      <CardContent name={name} isTop metadataKey={null} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    maxWidth: CARD_WIDTH,
    minHeight: 530,
    backgroundColor: colors.swipe.surface,
    borderRadius: 28,
    padding: SPACING.xl,
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  readOnlyCard: {
    position: 'relative',
    width: '100%',
    maxWidth: CARD_WIDTH,
    minHeight: 500,
  },
  stackedCard: {},
  nextPreviewPill: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    ...SHADOWS.card,
  },
  nextPreviewText: {
    fontSize: FONTS.sizes.xs,
    color: colors.onboarding.primary,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeSurface: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
  },
  genderEmoji: {
    fontSize: 13,
  },
  genderLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  trendBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
  },
  trendText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  topRowRight: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginLeft: SPACING.sm,
  },
  rarityBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
  },
  rarityBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.35,
    color: colors.swipe.secondary,
  },
  metadataBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: colors.swipe.background,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  metadataBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.28,
    color: colors.swipe.text,
  },
  popularityBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: colors.swipe.background,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  popularityBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.swipe.textMuted ?? COLORS.textMuted,
  },
  nameText: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '800',
    color: colors.swipe.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginBottom: SPACING.xs,
    letterSpacing: -1,
    width: '100%',
    includeFontPadding: false,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    width: '100%',
    paddingHorizontal: SPACING.sm,
  },
  originText: {
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
    color: colors.swipe.textMuted ?? COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    includeFontPadding: false,
    flexShrink: 1,
  },
  pronBtn: {
    opacity: 0.7,
  },
  pronIcon: {
    fontSize: 16,
  },
  pronHint: {
    fontSize: FONTS.sizes.xs,
    color: colors.swipe.textMuted ?? COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  pronBox: {
    backgroundColor: colors.swipe.overlayLike ?? '#E8F8F1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  pronText: {
    fontSize: FONTS.sizes.sm,
    color: colors.swipe.primary ?? colors.onboarding.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    width: 40,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.neutral.border ?? COLORS.border,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  meaningSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    width: '100%',
  },
  meaningLabel: {
    fontSize: FONTS.sizes.xs,
    letterSpacing: 1.5,
    fontWeight: '800',
    color: colors.swipe.textMuted ?? COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  meaningText: {
    fontSize: FONTS.sizes.md,
    color: colors.swipe.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  chips: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: colors.swipe.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: FONTS.sizes.xs,
    color: colors.swipe.text,
    fontWeight: '600',
  },
  // Swipe stamps
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 2.5,
    borderRadius: 10,
    zIndex: 20,
  },
  likeStamp: {
    left: 20,
    borderColor: colors.swipe.like,
    transform: [{ rotate: '-14deg' }],
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  likeStampText: {
    color: colors.swipe.like,
    fontWeight: '900',
    fontSize: 17,
  },
  skipStamp: {
    right: 20,
    borderColor: colors.swipe.pass,
    transform: [{ rotate: '14deg' }],
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  skipStampText: {
    color: colors.swipe.pass,
    fontWeight: '900',
    fontSize: 17,
  },
  // Action buttons
  actions: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionSide: {
    width: 72,
    alignItems: 'flex-start',
  },
  actionSideRight: {
    alignItems: 'flex-end',
  },
  actionBtn: {
    width: 62,
    height: 62,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
  skipBtn: {
    backgroundColor: colors.swipe.overlayPass ?? '#FFE8E8',
  },
  likeBtn: {
    backgroundColor: colors.swipe.overlayLike ?? '#E8F8F1',
  },
  skipBtnText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.swipe.pass,
  },
  likeBtnText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.swipe.like,
  },
  actionCenter: {
    flex: 1,
    alignItems: 'center',
  },
  swipeHint: {
    fontSize: FONTS.sizes.sm,
    color: colors.swipe.textMuted ?? COLORS.textMuted,
    fontWeight: '500',
    opacity: 0.7,
  },
});
