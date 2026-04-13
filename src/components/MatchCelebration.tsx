import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BabyName } from '../types';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import { enrichName } from '../services/nameEnrichment';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COUNT = 24;

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
  onViewMatches?: () => void;
}

export default function MatchCelebration({ name, onDismiss, onViewMatches }: MatchCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  const genderKey = String(name?.gender || '').toLowerCase();
  const enrichment = enrichName(name.name);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `We matched on the name "${name.name}" 🎉\n\n${name.origin} · ${name.meaning}\n\nFind your baby's perfect name together on BabySwipe! 👶`,
        title: `${name.name} — Our Match!`,
      });
    } catch (_) {}
  };

  const theme = useMemo(() => {
    if (genderKey.includes('boy') || genderKey.includes('male') || genderKey.includes('masc')) {
      return {
        gradient: ['rgba(104,169,255,0.96)', 'rgba(71,128,230,0.96)'] as const,
        bubble: '#EAF2FF',
        primary: '#2F6FE4',
        secondary: '#6F8FCF',
        confetti: ['#D7E7FF', '#AFCBFF', '#7FB3FF', '#4F8DFF', '#DDEBFF', '#7AA7F8'],
        emoji: '💙',
        label: "IT'S A MATCH!",
      };
    }

    if (genderKey.includes('girl') || genderKey.includes('female') || genderKey.includes('fem')) {
      return {
        gradient: ['rgba(255,107,157,0.95)', 'rgba(255,100,130,0.95)'] as const,
        bubble: '#FFE5F0',
        primary: '#F25D94',
        secondary: '#B35C7A',
        confetti: ['#FFD6E7', '#FFB6D5', '#FFC7DD', '#FF94C2', '#FFE2EE', '#F9A8C7'],
        emoji: '💗',
        label: "IT'S A MATCH!",
      };
    }

    return {
      gradient: ['rgba(168,125,255,0.95)', 'rgba(126,92,220,0.95)'] as const,
      bubble: '#F0E8FF',
      primary: '#7A5AE0',
      secondary: '#7B6FA8',
      confetti: ['#E8D9FF', '#CDB8FF', '#D8C8FF', '#B49AF8', '#EFE7FF', '#C7B2FF'],
      emoji: '💜',
      label: "IT'S A MATCH!",
    };
  }, [genderKey]);

  const confetti = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2),
      y: new Animated.Value(-60),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: theme.confetti[Math.floor(Math.random() * theme.confetti.length)],
      size: 8 + Math.random() * 10,
    }))
  ).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 260);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 90,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.spring(heartPulse, {
          toValue: 1.14,
          tension: 120,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(heartPulse, {
          toValue: 1,
          tension: 120,
          friction: 4,
          useNativeDriver: true,
        }),
      ])
    ).start();

    confetti.forEach((piece, i) => {
      const delay = i * 45;
      const duration = 1800 + Math.random() * 1100;

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: SCREEN_HEIGHT + 80,
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
            duration: Math.max(500, duration * 0.45),
            delay: duration * 0.45,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [confetti, fadeAnim, heartPulse, scaleAnim]);

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {confetti.map((piece, i) => {
        const rotateStr = piece.rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.confettiPiece,
              {
                opacity: piece.opacity,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? piece.size / 2 : 2,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { rotate: rotateStr },
                ],
              },
            ]}
          />
        );
      })}

      <Animated.View
        style={[
          styles.cardWrap,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.card}>
          <Animated.Text
            style={[
              styles.heartEmoji,
              { transform: [{ scale: heartPulse }] },
            ]}
          >
            {theme.emoji}
          </Animated.Text>

          <Text style={[styles.matchLabel, { color: theme.primary }]}>{theme.label}</Text>
          <Text style={styles.subtitle}>You both love</Text>

          <View style={[styles.nameBubble, { backgroundColor: theme.bubble }]}>
            <Text
              style={[styles.nameText, { color: theme.primary }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.58}
            >
              {name.name}
            </Text>
          </View>

          {!!name.origin && <Text style={[styles.originText, { color: theme.secondary }]}>{name.origin}</Text>}
          {!!name.meaning && (
            <Text style={styles.meaningText} numberOfLines={3}>
              “{name.meaning}”
            </Text>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.continueBtn, { backgroundColor: theme.primary }]} onPress={onDismiss} activeOpacity={0.9}>
              <Text style={styles.continueBtnText}>Keep Swiping</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.shareBtn, { borderColor: theme.primary }]} onPress={handleShare} activeOpacity={0.8}>
              <Text style={[styles.shareBtnText, { color: theme.primary }]}>📤 Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.matchesBtn}
            onPress={onViewMatches ?? onDismiss}
            activeOpacity={0.8}
          >
            <Text style={[styles.matchesBtnText, { color: theme.primary }]}>View All Matches →</Text>
          </TouchableOpacity>
        </View>
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
    left: SCREEN_WIDTH / 2,
    zIndex: 1,
  },
  cardWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: 10,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl + 2,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  heartEmoji: {
    fontSize: 68,
    marginBottom: SPACING.sm,
  },
  matchLabel: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  nameBubble: {
    width: '100%',
    minHeight: 116,
    borderRadius: 999,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '900',
    letterSpacing: -1.5,
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
  },
  originText: {
    fontSize: FONTS.sizes.lg,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  meaningText: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  btnRow: {
    marginTop: SPACING.xl,
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  continueBtn: {
    flex: 2,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  shareBtn: {
    flex: 1,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  shareBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  matchesBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  matchesBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
});
