import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BabyName } from '../types';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import { enrichName, getTrendLabel, getTrendBg, getTrendFg } from '../services/nameEnrichment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const ROTATION_ANGLE = 12;

// Stack scale/offset for each card position
const STACK_SCALE  = [1.0,  0.96, 0.92];
const STACK_OFFSET = [0,    10,   20];

interface SwipeCardProps {
  name: BabyName;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  cardIndex: number;
}

export default function SwipeCard({
  name,
  onSwipeLeft,
  onSwipeRight,
  isTop,
  cardIndex,
}: SwipeCardProps) {
  const position = useRef(new Animated.ValueXY()).current;
  const isSwipingRef = useRef(false);

  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    isSwipingRef.current = false;
  }, [name.id, isTop, position]);

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
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const swipeRight = () => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      onSwipeRight();
    });
  };

  const swipeLeft = () => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      onSwipeLeft();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          isTop && (Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          isTop && Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 6,
        onPanResponderMove: (_, gesture) => {
          if (!isTop) return;
          position.setValue({ x: gesture.dx, y: gesture.dy * 0.18 });
        },
        onPanResponderRelease: (_, gesture) => {
          if (!isTop || isSwipingRef.current) return;
          if (gesture.dx > SWIPE_THRESHOLD) {
            swipeRight();
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            swipeLeft();
          } else {
            resetPosition();
          }
        },
        onPanResponderTerminate: () => {
          if (isTop) resetPosition();
        },
      }),
    [isTop, position]
  );

  const safeIndex = Math.min(cardIndex, 2);
  const cardScale = STACK_SCALE[safeIndex];
  const cardTranslateY = STACK_OFFSET[safeIndex];

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
            opacity: safeIndex === 1 ? 0.85 : 0.65,
          },
        ]}
      >
        <CardContent name={name} isTop={false} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.card,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate: rotation },
          ],
          zIndex: 100,
        },
      ]}
    >
      <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacityInterp }]}>
        <Text style={styles.likeStampText}>💚 LOVE</Text>
      </Animated.View>

      <Animated.View style={[styles.stamp, styles.skipStamp, { opacity: skipOpacityInterp }]}>
        <Text style={styles.skipStampText}>SKIP 👎</Text>
      </Animated.View>

      <CardContent name={name} isTop />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.skipBtn]}
          onPress={swipeLeft}
          activeOpacity={0.8}
        >
          <Text style={styles.skipBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.actionCenter}>
          <Text style={styles.swipeHint}>← swipe →</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, styles.likeBtn]}
          onPress={swipeRight}
          activeOpacity={0.8}
        >
          <Text style={styles.likeBtnText}>♥</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Card Content
// ─────────────────────────────────────────────────────────────
function CardContent({ name, isTop }: { name: BabyName; isTop: boolean }) {
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
    name.gender === 'boy' ? 'Boy' : name.gender === 'girl' ? 'Girl' : 'Neutral';

  const trend = enrichment.trend ?? name.trend;
  const trendLabel = getTrendLabel(trend);
  const trendBg = getTrendBg(trend);
  const trendFg = getTrendFg(trend);
  const popularityRank = enrichment.popularity_rank ?? name.popularity_rank;
  const pronunciation = enrichment.pronunciation ?? name.pronunciation;

  return (
    <View style={styles.cardContent}>
      {/* Top row: gender badge + trend pill */}
      <View style={styles.topRow}>
        <View style={[styles.genderBadge, { backgroundColor: genderColor + '22' }]}>
          <Text style={styles.genderEmoji}>{genderEmoji}</Text>
          <Text style={[styles.genderLabel, { color: genderColor }]}>{genderLabel}</Text>
        </View>

        {trendLabel ? (
          <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
            <Text style={[styles.trendText, { color: trendFg }]}>{trendLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* Name */}
      <Text style={styles.nameText} adjustsFontSizeToFit numberOfLines={1}>
        {name.name}
      </Text>

      {/* Origin + pronunciation row */}
      <View style={styles.originRow}>
        <Text style={styles.originText}>{name.origin}</Text>
        {isTop && pronunciation ? (
          <TouchableOpacity
            style={styles.pronBtn}
            onPress={() => setShowPronunciation((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.pronIcon}>🔊</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Pronunciation guide (expandable) */}
      {showPronunciation && pronunciation ? (
        <View style={styles.pronBox}>
          <Text style={styles.pronText}>/{pronunciation}/</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Meaning */}
      <View style={styles.meaningSection}>
        <Text style={styles.meaningLabel}>MEANING</Text>
        <Text style={styles.meaningText} numberOfLines={3}>{name.meaning}</Text>
      </View>

      {/* Bottom chips */}
      <View style={styles.chips}>
        {name.country ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>📍 {name.country}</Text>
          </View>
        ) : null}
        <View style={styles.chip}>
          <Text style={styles.chipText}>🌐 {name.region}</Text>
        </View>
        {popularityRank ? (
          <View style={[styles.chip, styles.rankChip]}>
            <Text style={[styles.chipText, styles.rankText]}>#{popularityRank} popular</Text>
          </View>
        ) : null}
      </View>
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
  stackedCard: {},
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  nameText: {
    fontSize: 46,
    fontWeight: '800',
    color: colors.swipe.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    letterSpacing: -1,
    minWidth: '80%',
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  originText: {
    fontSize: FONTS.sizes.md,
    color: colors.swipe.textMuted ?? COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  pronBtn: {
    opacity: 0.7,
  },
  pronIcon: {
    fontSize: 16,
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
  rankChip: {
    backgroundColor: colors.match.background ?? '#FFF7E8',
  },
  rankText: {
    color: colors.match.text ?? '#3A2E1F',
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
    gap: SPACING.md,
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
