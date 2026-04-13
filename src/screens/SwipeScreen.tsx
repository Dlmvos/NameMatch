import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import SwipeCard from '../components/SwipeCard';
import MatchCelebration from '../components/MatchCelebration';
import FilterSheet from '../components/FilterSheet';
import { colors, COLORS, FONTS, SPACING } from '../theme';

const VISIBLE_CARDS = 3;

export default function SwipeScreen() {
  const { namesToSwipe, isLoadingNames, recordSwipe, latestMatch, dismissLatestMatch, room,
          filters, setFilters, activeFilterCount } = useApp();
  const { profile } = useAuth();
  const isSwipingRef = useRef(false);
  const [showFilters, setShowFilters] = useState(false);

  const freeSwipesLeft = profile?.free_swipes_remaining ?? 0;
  const hasPartner = !!(room?.user2_id);
  const visibleNames = namesToSwipe.slice(0, VISIBLE_CARDS);
  const totalRemaining = namesToSwipe.length;

  const handleSwipe = async (nameId: string, direction: 'left' | 'right') => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    try {
      await recordSwipe(nameId, direction);
    } finally {
      isSwipingRef.current = false;
    }
  };

  if (isLoadingNames) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FFF0F5', '#FFF9F5']} style={StyleSheet.absoluteFill} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading names...</Text>
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
          <Text style={styles.emptyTitle}>You've seen them all!</Text>
          <Text style={styles.emptySubtitle}>
            {freeSwipesLeft > 0
              ? `${freeSwipesLeft} free swipes remaining`
              : 'Visit the Shop to unlock more names 🛍️'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FFF0F5', '#FFF9F5']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>{totalRemaining} names left</Text>
        </View>
        <View style={styles.headerRight}>
          {!hasPartner && room && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Solo · {room.code}</Text>
            </View>
          )}
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {freeSwipesLeft > 0 ? `${freeSwipesLeft} free` : '🔒 Locked'}
            </Text>
          </View>
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

      {/* Card Stack — rendered back-to-front so top card is on top */}
      <View style={styles.cardStack}>
        {[...visibleNames].reverse().map((name, reverseIndex) => {
          const cardIndex = visibleNames.length - 1 - reverseIndex;
          const isTop = cardIndex === 0;
          return (
            <SwipeCard
              key={name.id}
              name={name}
              isTop={isTop}
              cardIndex={cardIndex}
              onSwipeLeft={() => handleSwipe(name.id, 'left')}
              onSwipeRight={() => handleSwipe(name.id, 'right')}
            />
          );
        })}
      </View>

      {freeSwipesLeft <= 10 && freeSwipesLeft > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚡ {freeSwipesLeft} free swipes left — unlock more in the Shop!
          </Text>
        </View>
      )}

      {latestMatch && (
        <MatchCelebration name={latestMatch} onDismiss={dismissLatestMatch} />
      )}

      <FilterSheet
        visible={showFilters}
        currentFilters={filters}
        onApply={setFilters}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
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
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 6, alignItems: 'center' },
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
  },
  tagText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
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
});
