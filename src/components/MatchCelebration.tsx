import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BabyName } from '../types';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COUNT = 24;
const CONFETTI_COLORS = [
  colors.match.secondary,
  colors.match.primary,
  colors.swipe.like,
  colors.swipe.secondary,
  colors.onboarding.secondary,
  colors.shortlist.secondary,
  colors.onboarding.primary,
  colors.match.accent,
];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
}

interface MatchCelebrationProps {
  name: BabyName;
  onDismiss: () => void;
}

export default function MatchCelebration({ name, onDismiss }: MatchCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  const confetti = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-40),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 10,
    }))
  ).current;

  useEffect(() => {
    // Haptic celebration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 300);

    // Backdrop fade
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Card pop in
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Heart pulse
    Animated.loop(
      Animated.sequence([
        Animated.spring(heartPulse, {
          toValue: 1.3,
          tension: 120,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(heartPulse, {
          toValue: 1,
          tension: 120,
          friction: 3,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Confetti fall
    confetti.forEach((piece, i) => {
      const delay = i * 60;
      const duration = 2000 + Math.random() * 1500;
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: SCREEN_HEIGHT + 40,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotation, {
            toValue: 720 + Math.random() * 360,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration,
            delay: duration * 0.6,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, []);

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['rgba(255,107,157,0.95)', 'rgba(255,100,130,0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Confetti */}
      {confetti.map((piece, i) => {
        const rotateStr = piece.rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.confettiPiece,
              {
                left: piece.x,
                transform: [
                  { translateY: piece.y },
                  { rotate: rotateStr },
                ],
                opacity: piece.opacity,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? piece.size / 2 : 2,
              },
            ]}
          />
        );
      })}

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Heart */}
        <Animated.Text
          style={[styles.heartEmoji, { transform: [{ scale: heartPulse }] }]}
        >
          💕
        </Animated.Text>

        {/* Match text */}
        <Text style={styles.matchLabel}>IT'S A MATCH!</Text>
        <Text style={styles.subtitle}>You both love</Text>

        {/* Name */}
        <View style={styles.nameBubble}>
          <Text style={styles.nameText}>{name.name}</Text>
        </View>

        {/* Origin & meaning */}
        <Text style={styles.originText}>{name.origin}</Text>
        <Text style={styles.meaningText}>"{name.meaning}"</Text>

        {/* Actions */}
        <TouchableOpacity style={styles.continueBtn} onPress={onDismiss} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Keep Swiping 🔍</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.matchesBtn} onPress={onDismiss}>
          <Text style={styles.matchesBtnText}>View All Matches ✨</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  card: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    top: '50%',
    marginTop: -260,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
    zIndex: 10,
    gap: SPACING.sm,
  },
  heartEmoji: {
    fontSize: 72,
    marginBottom: SPACING.sm,
  },
  matchLabel: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
  },
  nameBubble: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.sm,
  },
  nameText: {
    fontSize: FONTS.sizes.huge,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  originText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  meaningText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.button,
  },
  continueBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  matchesBtn: {
    paddingVertical: SPACING.sm,
  },
  matchesBtnText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
});
