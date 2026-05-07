import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../i18n/I18nProvider';
import { colors, FONTS, SHADOWS, SPACING } from '../theme';
import type { Milestone } from '../lib/milestoneTracker';
import { nextMilestoneAfter } from '../lib/milestoneTracker';

const BLUSH_BACKGROUND = '#FFF7E8';
const TEXT_PRIMARY = colors.onboarding.text;
const TEXT_BODY = colors.neutral.textBody;
const TEAL = colors.onboarding.primary;

const MILESTONE_EMOJI: Record<Milestone, string> = {
  1: '🌱',
  5: '🌿',
  10: '🌳',
  25: '🏆',
};

interface MilestoneCelebrationProps {
  milestone: Milestone;
  onDismiss: () => void;
}

export default function MilestoneCelebration({
  milestone,
  onDismiss,
}: MilestoneCelebrationProps) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const emojiScale = useRef(new Animated.Value(0.5)).current;

  const next = nextMilestoneAfter(milestone);

  useEffect(() => {
    // Subtle double-tap haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 45,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(emojiScale, {
        toValue: 1,
        tension: 35,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, emojiScale]);

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

      <Animated.View
        style={[
          styles.contentWrap,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Animated.Text
          style={[styles.emoji, { transform: [{ scale: emojiScale }] }]}
        >
          {MILESTONE_EMOJI[milestone]}
        </Animated.Text>

        <Text style={styles.headline}>
          {t('milestone.title', { count: String(milestone) })}
        </Text>

        <Text style={styles.subtitle}>
          {t(`milestone.body.${milestone}`)}
        </Text>

        {next && (
          <Text style={styles.progress}>
            {t('milestone.next', { count: String(next) })}
          </Text>
        )}

        <View style={styles.actionsArea}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {t('match.keepSwiping')}
            </Text>
          </TouchableOpacity>
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
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: 10,
  },
  emoji: {
    fontSize: 72,
    marginBottom: SPACING.lg,
  },
  headline: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '400',
    color: TEXT_BODY,
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },
  progress: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: TEAL,
    textAlign: 'center',
    opacity: 0.75,
    marginBottom: SPACING.xl,
  },
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
    backgroundColor: TEAL,
    ...SHADOWS.button,
  },
  primaryBtnText: {
    color: colors.neutral.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
