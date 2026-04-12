import React, { useRef } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const ROTATION_ANGLE = 12;

interface SwipeCardProps {
  name: BabyName;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  cardIndex: number; // 0 = top card
}

export default function SwipeCard({
  name,
  onSwipeLeft,
  onSwipeRight,
  isTop,
  cardIndex,
}: SwipeCardProps) {
  const position = useRef(new Animated.ValueXY()).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;
  const isSwipingRef = useRef(false);

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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: () => isTop,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (isSwipingRef.current) return;
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const swipeRight = () => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      isSwipingRef.current = false;
      onSwipeRight();
    });
  };

  const swipeLeft = () => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      isSwipingRef.current = false;
      onSwipeLeft();
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Scale/translate for stacked cards below the top
  const cardScale = 1 - cardIndex * 0.04;
  const cardTranslateY = cardIndex * -12;

  if (!isTop) {
    return (
    <View style={styles.cardStack}>
      <View pointerEvents="none" style={styles.cardGlow} />
      <Animated.View
        style={[
          styles.card,
          styles.stackedCard,
          {
            transform: [
              { scale: cardScale },
              { translateY: cardTranslateY },
            ],
            zIndex: -cardIndex,
          },
        ]}
      >
        <CardContent name={name} />
      </Animated.View>
    </View>
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
          zIndex: 10,
        },
      ]}
    >
      {/* LIKE stamp */}
      <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacityInterp }]}>
        <Text style={styles.likeStampText}>💚 LOVE</Text>
      </Animated.View>

      {/* SKIP stamp */}
      <Animated.View style={[styles.stamp, styles.skipStamp, { opacity: skipOpacityInterp }]}>
        <Text style={styles.skipStampText}>SKIP 👎</Text>
      </Animated.View>

      <CardContent name={name} />

      {/* Action buttons */}
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

function CardContent({ name }: { name: BabyName }) {
  const genderColor =
    name.gender === 'boy'
      ? COLORS.boy
      : name.gender === 'girl'
      ? COLORS.girl
      : COLORS.neutral;

  const genderEmoji =
    name.gender === 'boy' ? '💙' : name.gender === 'girl' ? '💗' : '💜';

  const genderLabel =
    name.gender === 'boy' ? 'Boy' : name.gender === 'girl' ? 'Girl' : 'Neutral';

  return (
    <View style={styles.cardContent}>
      {/* Gender badge */}
      <View style={[styles.genderBadge, { backgroundColor: genderColor + '33' }]}>
        <Text style={styles.genderEmoji}>{genderEmoji}</Text>
        <Text style={[styles.genderLabel, { color: genderColor }]}>{genderLabel}</Text>
      </View>

      {/* Name */}
      <Text style={styles.nameText}>{name.name}</Text>

      {/* Origin */}
      <Text style={styles.originText}>{name.origin}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Meaning */}
      <View style={styles.meaningSection}>
        <Text style={styles.meaningLabel}>MEANING</Text>
        <Text style={styles.meaningText}>{name.meaning}</Text>
      </View>

      {/* Country/Region chip */}
      <View style={styles.chips}>
        {name.country && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>📍 {name.country}</Text>
          </View>
        )}
        <View style={styles.chip}>
          <Text style={styles.chipText}>🌐 {name.region}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardStack: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: 14,
    left: 10,
    right: 10,
    bottom: -4,
    borderRadius: 28,
    backgroundColor: colors.onboarding.accent,
    opacity: 0.55,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.swipe.surface,
    borderWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.04)',
    borderRadius: RADIUS.xl,
    position: 'absolute',
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  stackedCard: {
    borderRadius: RADIUS.xl,
  },
  cardContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.md,
    minHeight: 380,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 4,
    marginBottom: SPACING.lg,
  },
  genderEmoji: {
    fontSize: 14,
  },
  genderLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -2,
    marginBottom: SPACING.xs,
    lineHeight: 60,
  },
  originText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: SPACING.lg,
  },
  meaningSection: {
    marginBottom: SPACING.lg,
  },
  meaningLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  meaningText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    lineHeight: 26,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  chipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  stamp: {
    position: 'absolute',
    top: 36,
    zIndex: 20,
    borderWidth: 4,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    transform: [{ rotate: '-15deg' }],
  },
  likeStamp: {
    right: 24,
    borderColor: COLORS.like,
  },
  likeStampText: {
    color: COLORS.like,
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
  },
  skipStamp: {
    left: 24,
    borderColor: COLORS.skip,
    transform: [{ rotate: '15deg' }],
  },
  skipStampText: {
    color: COLORS.skip,
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  skipBtn: {
    backgroundColor: COLORS.skipLight,
    borderWidth: 2,
    borderColor: COLORS.skip,
  },
  skipBtnText: {
    fontSize: 24,
    color: COLORS.skip,
    fontWeight: '700',
  },
  likeBtn: {
    backgroundColor: COLORS.likeLight,
    borderWidth: 2,
    borderColor: COLORS.like,
  },
  likeBtnText: {
    fontSize: 24,
    color: COLORS.like,
    fontWeight: '700',
  },
  actionCenter: {
    alignItems: 'center',
  },
  swipeHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
});
