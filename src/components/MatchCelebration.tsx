import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Share,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BabyName } from '../types';
import { useTranslation } from '../i18n/I18nProvider';
import { getLocalizedNameMeaning, cleanOriginForDisplay } from '../i18n/nameMeaningDisplay';
import { colors, FONTS, SHADOWS, SPACING } from '../theme';

// ── Floating sparkle particles ──
const SPARKLE_COUNT = 10;

interface Sparkle {
  x: number;
  startY: number;
  drift: Animated.Value;
  opacity: Animated.Value;
  size: number;
}

// ── App-aligned blush/ivory palette ──
const BLUSH_BACKGROUND = '#FFF7E8';
const TEXT_PRIMARY = colors.onboarding.text;
const TEXT_BODY = colors.neutral.textBody;
const TEXT_MUTED = colors.neutral.darkGray;
const CORAL = colors.onboarding.secondary;
const TEAL = colors.onboarding.primary;

interface MatchCelebrationProps {
  name: BabyName;
  onDismiss: () => void;
  onViewMatches?: () => void;
}

export default function MatchCelebration({ name, onDismiss, onViewMatches }: MatchCelebrationProps) {
  const { t, language } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.15)).current;
  const nameReveal = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.6)).current;
  const ringScale2 = useRef(new Animated.Value(0.5)).current;
  const ringScale3 = useRef(new Animated.Value(0.4)).current;

  const genderKey = String(name?.gender || '').toLowerCase();
  const localizedMeaning = getLocalizedNameMeaning(name, language);

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('match.share.message', {
          name: name.name,
          origin: cleanOriginForDisplay(name.origin),
          meaning: localizedMeaning,
        }),
        title: t('match.share.title', { name: name.name }),
      });
    } catch (_) {}
  };

  const theme = useMemo(() => {
    if (genderKey.includes('boy') || genderKey.includes('male') || genderKey.includes('masc')) {
      return {
        glow: 'rgba(127,169,201,0.18)',
        accent: colors.shortlist.secondary,
        sparkle: '#B9D7EA',
        ring: 'rgba(127,169,201,0.12)',
      };
    }
    if (genderKey.includes('girl') || genderKey.includes('female') || genderKey.includes('fem')) {
      return {
        glow: 'rgba(255,143,163,0.18)',
        accent: CORAL,
        sparkle: '#F0C4B4',
        ring: 'rgba(255,143,163,0.12)',
      };
    }
    return {
      glow: 'rgba(78,197,193,0.18)',
      accent: TEAL,
      sparkle: '#B5FFFC',
      ring: 'rgba(78,197,193,0.12)',
    };
  }, [genderKey]);

  // ── Sparkles: dots that float upward from center ──
  const sparkles = useRef<Sparkle[]>(
    Array.from({ length: SPARKLE_COUNT }, () => ({
      x: 0.2 + Math.random() * 0.6,
      startY: 0.35 + Math.random() * 0.3,
      drift: new Animated.Value(0),
      opacity: new Animated.Value(0),
      size: 2 + Math.random() * 3,
    })),
  ).current;

  useEffect(() => {
    // Premium tactile: warm satisfying pulse
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);

    // Fade in backdrop
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Content entrance: elegant spring
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Name reveal: delayed fade for sequenced drama
    Animated.timing(nameReveal, {
      toValue: 1,
      duration: 600,
      delay: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Concentric rings expand
    Animated.parallel([
      Animated.spring(ringScale1, { toValue: 1, tension: 20, friction: 12, useNativeDriver: true }),
      Animated.spring(ringScale2, { toValue: 1, tension: 18, friction: 14, delay: 100, useNativeDriver: true }),
      Animated.spring(ringScale3, { toValue: 1, tension: 16, friction: 16, delay: 200, useNativeDriver: true }),
    ]).start();

    // Glow pulse: slow breathing rhythm
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.35,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.15,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Sparkles: staggered float-up
    sparkles.forEach((sp, i) => {
      const delay = 500 + i * 350;
      const duration = 3500 + Math.random() * 2000;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(sp.drift, {
              toValue: 1,
              duration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(sp.opacity, {
                toValue: 0.6,
                duration: duration * 0.2,
                useNativeDriver: true,
              }),
              Animated.timing(sp.opacity, {
                toValue: 0,
                duration: duration * 0.8,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(sp.drift, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(sp.opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      ).start();
    });
  }, [fadeAnim, glowPulse, nameReveal, ringScale1, ringScale2, ringScale3, scaleAnim, sparkles]);

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      {/* Soft blush backdrop — full-screen, but still part of the app */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

      {/* Floating sparkles */}
      {sparkles.map((sp, i) => {
        const translateY = sp.drift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -100],
        });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.sparkle,
              {
                left: `${sp.x * 100}%` as any,
                top: `${sp.startY * 100}%` as any,
                width: sp.size,
                height: sp.size,
                borderRadius: sp.size / 2,
                backgroundColor: theme.sparkle,
                opacity: sp.opacity,
                transform: [{ translateY }],
              },
            ]}
          />
        );
      })}

      {/* Full-page content */}
      <Animated.View
        style={[
          styles.contentWrap,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Radial glow behind the name */}
        <Animated.View
          style={[
            styles.glowOrb,
            { backgroundColor: theme.glow, opacity: glowPulse },
          ]}
        />

        {/* Concentric rings — reverence, not gamification */}
        <Animated.View style={[styles.ring, styles.ring1, { borderColor: theme.ring, transform: [{ scale: ringScale3 }] }]} />
        <Animated.View style={[styles.ring, styles.ring2, { borderColor: theme.ring, transform: [{ scale: ringScale2 }] }]} />
        <Animated.View style={[styles.ring, styles.ring3, { borderColor: theme.ring, transform: [{ scale: ringScale1 }] }]} />

        {/* Headline: "You both chose {name}" */}
        <Text
          style={styles.headline}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {t('match.title', { name: name.name })}
        </Text>

        <Text style={styles.subtitle} numberOfLines={2}>
          {t('match.subtitle')}
        </Text>

        {/* The name — hero, centered, large */}
        <Animated.View style={[styles.nameArea, { opacity: nameReveal }]}>
          <Text
            style={styles.nameText}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {name.name}
          </Text>

          {/* Origin + meaning below name */}
          {(() => {
            const cleanedOrigin = cleanOriginForDisplay(name.origin);
            return cleanedOrigin ? (
              <Text style={styles.originText}>{cleanedOrigin}</Text>
            ) : null;
          })()}
          {!!localizedMeaning && (
            <Text style={styles.meaningText} numberOfLines={2}>
              &ldquo;{localizedMeaning}&rdquo;
            </Text>
          )}
        </Animated.View>

        {/* Heart pulse — emotional anchor, not a button */}
        <Animated.View style={[styles.heartPulse, { opacity: nameReveal }]}>
          <View style={[styles.heartOuter, { backgroundColor: theme.ring }]}>
            <View style={[styles.heartInner, { backgroundColor: theme.ring }]}>
              <Text style={[styles.heartIcon, { color: theme.accent }]}>&#x2665;</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions — bottom-anchored, de-emphasized */}
        <View style={styles.actionsArea}>
          {/* Primary: Keep Swiping */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Text
              style={styles.primaryBtnText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.76}
            >
              {t('match.keepSwiping')}
            </Text>
          </TouchableOpacity>

          {/* Secondary: Share — text-only, soft */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.accent }]}>
              {t('match.share')}
            </Text>
          </TouchableOpacity>

          {/* Tertiary: View Matches — barely visible, no pressure */}
          {onViewMatches && (
            <TouchableOpacity
              style={styles.tertiaryBtn}
              onPress={onViewMatches}
              activeOpacity={0.6}
            >
              <Text style={[styles.tertiaryBtnText, { color: theme.accent }]}>
                {t('match.viewAll')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BLUSH_BACKGROUND,
    zIndex: 0,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 1,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: 10,
  },
  // ── Radial glow ──
  glowOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    alignSelf: 'center',
  },
  // ── Concentric rings ──
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 9999,
    alignSelf: 'center',
  },
  ring1: {
    width: 200,
    height: 200,
  },
  ring2: {
    width: 280,
    height: 280,
  },
  ring3: {
    width: 360,
    height: 360,
  },
  // ── Typography ──
  headline: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '400',
    color: TEXT_BODY,
    textAlign: 'center',
    opacity: 0.78,
    marginBottom: SPACING.xl,
  },
  // ── Name hero ──
  nameArea: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  nameText: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  originText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  meaningText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '400',
    color: TEXT_BODY,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  // ── Heart pulse ──
  heartPulse: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  heartOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 22,
  },
  // ── Actions ──
  actionsArea: {
    position: 'absolute',
    bottom: 60,
    left: SPACING.xl,
    right: SPACING.xl,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 26,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    ...SHADOWS.button,
  },
  primaryBtnText: {
    color: colors.neutral.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  secondaryBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    opacity: 0.9,
  },
  tertiaryBtn: {
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  tertiaryBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
    opacity: 0.65,
  },
});
