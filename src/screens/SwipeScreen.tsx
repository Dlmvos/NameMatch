import Constants from "expo-constants";

const DEV_MODE = __DEV__ || Constants.appOwnership === "expo";
let devLikeCounter = 0;

import React from 'react';
import { colors } from '../theme';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import SwipeCard from '../components/SwipeCard';
import MatchCelebration from '../components/MatchCelebration';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const VISIBLE_CARDS = 3;

export default function SwipeScreen() {
  const { namesToSwipe, isLoadingNames, recordSwipe, latestMatch, dismissLatestMatch, room } =
    useApp();
  const { profile } = useAuth();

  const freeSwipesLeft = profile?.free_swipes_remaining ?? 0;
  const hasPartner = !!(room?.user2_id);

  const visibleNames = namesToSwipe.slice(0, VISIBLE_CARDS);
  const totalRemaining = namesToSwipe.length;

  const handleSwipe = async (direction: 'left' | 'right') => {
    const name = namesToSwipe[0];
    if (!name) return;
    await recordSwipe(name.id, direction);
  };

  // ── Empty state ─────────────────────────────────────────
  if (!isLoadingNames && totalRemaining === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text style={styles.emptyTitle}>You've seen them all!</Text>
          <Text style={styles.emptySubtitle}>
            Check your Matches to see names you both loved, or visit the Shop to unlock more names.
          </Text>
          <View style={styles.emptyBadge}>
            <Text style={styles.emptyBadgeText}>
              {freeSwipesLeft > 0
                ? `${freeSwipesLeft} free swipes remaining`
                : 'Unlock more in the Shop 🛍️'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading state ────────────────────────────────────────
  if (isLoadingNames) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading names...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>
            {totalRemaining > 0 ? `${totalRemaining} names left` : 'Almost done!'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {!hasPartner && (
            <View style={styles.soloTag}>
              <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.soloTagText}>Solo</Text>
            </View>
          )}
          <View style={styles.freeTag}>
            <Text style={styles.freeTagText}>
              {freeSwipesLeft > 0 ? `${freeSwipesLeft} free` : '🔒 Locked'}
            </Text>
          </View>
        </View>
      </View>

      {/* Partner banner */}
      {!hasPartner && room && (
        <View style={styles.partnerBanner}>
          <Ionicons name="people-outline" size={16} color={COLORS.primary} />
          <Text style={styles.partnerBannerText}>
            Waiting for your partner · Share code{' '}
            <Text style={styles.partnerCode}>{room.code}</Text>
          </Text>
        </View>
      )}

      {/* Card Stack */}
      <View style={styles.cardStack}>
        {visibleNames.length > 0 ? (
          [...visibleNames].reverse().map((name, reverseIndex) => {
            const cardIndex = visibleNames.length - 1 - reverseIndex;
            const isTop = cardIndex === 0;
            return (
              <SwipeCard
                key={name.id}
                name={name}
                isTop={isTop}
                cardIndex={cardIndex}
                onSwipeLeft={() => handleSwipe('left')}
                onSwipeRight={() => handleSwipe('right')}
              />
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌸</Text>
            <Text style={styles.emptyTitle}>You've seen them all!</Text>
          </View>
        )}
      </View>

      {/* Free swipes warning */}
      {freeSwipesLeft <= 10 && freeSwipesLeft > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚡ {freeSwipesLeft} free swipes left — unlock more in the Shop!
          </Text>
        </View>
      )}

      {/* Match Celebration Modal */}
      {latestMatch && (
        <MatchCelebration name={latestMatch} onDismiss={dismissLatestMatch} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.swipe.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: colors.swipe.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: colors.swipe.text,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  soloTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.swipe.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  soloTagText: {
    fontSize: FONTS.sizes.xs,
    color: colors.swipe.text,
    fontWeight: '600',
  },
  freeTag: {
    backgroundColor: colors.swipe.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  freeTagText: {
    fontSize: FONTS.sizes.xs,
    color: colors.swipe.text,
    fontWeight: '700',
  },
  partnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginHorizontal: SPACING.xl,
    backgroundColor: colors.swipe.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    marginBottom: SPACING.sm,
  },
  partnerBannerText: {
    fontSize: FONTS.sizes.sm,
    color: colors.swipe.text,
    flex: 1,
  },
  partnerCode: {
    fontWeight: '800',
    color: colors.swipe.text,
  },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: colors.swipe.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: colors.swipe.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBadge: {
    backgroundColor: colors.swipe.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  emptyBadgeText: {
    fontSize: FONTS.sizes.sm,
    color: colors.swipe.text,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: colors.swipe.text,
  },
  warningBanner: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    backgroundColor: colors.swipe.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  warningText: {
    fontSize: FONTS.sizes.sm,
    color: colors.swipe.text,
    fontWeight: '600',
  },
});
