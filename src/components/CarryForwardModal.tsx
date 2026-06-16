import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useCarryForward, useRoomActions } from '../context/RoomContext';
import { useTranslation } from '../i18n/I18nProvider';
import { navigationRef } from '../lib/navigationRef';
import { AnalyticsService } from '../services/AnalyticsService';
import { COLORS, FONTS, SHADOWS, SPACING, RADIUS } from '../theme';

/**
 * Post-pair carry-forward celebration modal.
 *
 * Renders fullscreen ON TOP of whatever screen the user lands on after
 * Babinom is opened post-pair (per Daan's design call 2026-06-16).
 *
 * Triggers when `profiles.pending_carry_forward_count` is non-null
 * (server-set by `merge_solo_into_room_after_join` RPC). The same value
 * is stamped on BOTH partners so the experience is symmetric.
 *
 *   - count > 0:   "💜 N names you both already love" + View matches CTA
 *   - count === 0: "Time to swipe together"            + OK CTA
 *
 * Dismiss path calls `dismissCarryForward()` which nulls the column
 * server-side; the local profile snapshot refreshes and the modal
 * collapses out. Idempotent — re-opening the app after dismissal does
 * not re-show.
 */
export default function CarryForwardModal() {
  const { t } = useTranslation();
  const { pendingCarryForwardCount } = useCarryForward();
  const { dismissCarryForward } = useRoomActions();
  const [isDismissing, setIsDismissing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const visible = pendingCarryForwardCount !== null;

  useEffect(() => {
    if (!visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
      return;
    }
    AnalyticsService.track('carry_forward_modal_shown', {
      count: pendingCarryForwardCount ?? 0,
    });
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 6,
        speed: 14,
      }),
    ]).start();
  }, [visible, pendingCarryForwardCount, fadeAnim, scaleAnim]);

  const handleDismiss = useCallback(async () => {
    if (isDismissing) return;
    setIsDismissing(true);
    AnalyticsService.track('carry_forward_modal_dismissed', {
      count: pendingCarryForwardCount ?? 0,
      action: 'ok',
    });
    try {
      await dismissCarryForward();
    } finally {
      setIsDismissing(false);
    }
  }, [dismissCarryForward, isDismissing, pendingCarryForwardCount]);

  const handleViewMatches = useCallback(async () => {
    if (isDismissing) return;
    setIsDismissing(true);
    AnalyticsService.track('carry_forward_modal_dismissed', {
      count: pendingCarryForwardCount ?? 0,
      action: 'view_matches',
    });
    try {
      await dismissCarryForward();
      // Navigate to the Matches tab. The navigation ref is attached to
      // the active NavigationContainer in AppNavigator. The nested
      // route names mirror src/navigation/AppNavigator.tsx.
      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: { screen: 'Matches' },
          }),
        );
      }
    } finally {
      setIsDismissing(false);
    }
  }, [dismissCarryForward, isDismissing, pendingCarryForwardCount]);

  if (!visible) return null;

  const count = pendingCarryForwardCount ?? 0;
  const hasMatches = count > 0;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>{hasMatches ? '💜' : '🌱'}</Text>
          <Text style={styles.title}>
            {hasMatches
              ? t('carryForward.titleMatches', { count, defaultValue: `${count} name${count === 1 ? '' : 's'} you both already love` })
              : t('carryForward.titleEmpty', { defaultValue: 'Time to swipe together' })}
          </Text>
          <Text style={styles.body}>
            {hasMatches
              ? t('carryForward.bodyMatches', {
                  defaultValue:
                    "We combined the names you each liked before pairing and found ones you both said yes to. Open Matches to see them.",
                })
              : t('carryForward.bodyEmpty', {
                  defaultValue:
                    "No overlap from your past likes yet — that's normal! Start swiping together and we'll let you know the moment you agree.",
                })}
          </Text>

          {hasMatches ? (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleViewMatches}
                disabled={isDismissing}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>
                  {t('carryForward.viewMatches', { defaultValue: 'View matches' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleDismiss}
                disabled={isDismissing}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>
                  {t('carryForward.maybeLater', { defaultValue: 'Maybe later' })}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleDismiss}
              disabled={isDismissing}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>
                {t('carryForward.startSwiping', { defaultValue: 'Start swiping' })}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(37, 49, 59, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
});
