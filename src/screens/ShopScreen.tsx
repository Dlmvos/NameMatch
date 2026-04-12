import React, { useState } from 'react';
import { colors } from '../theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { NAME_PACKS, NamePack } from '../types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

export default function ShopScreen() {
  const { profile } = useAuth();
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const isPurchased = (key: string) =>
    profile?.purchased_packs?.includes(key) ?? false;

  const handlePurchase = (pack: NamePack) => {
    if (isPurchased(pack.key)) {
      Alert.alert('Already Unlocked!', `You already have the ${pack.label}.`);
      return;
    }
    // TODO: Integrate Stripe here
    Alert.alert(
      'Coming Soon',
      `Stripe payment integration will be added next! The ${pack.label} costs $${pack.price.toFixed(2)}.`,
      [{ text: 'OK' }]
    );
  };

  const freeSwipesLeft = profile?.free_swipes_remaining ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop</Text>
          <Text style={styles.headerSubtitle}>Unlock more beautiful names</Text>
        </View>

        {/* Free tier status */}
        <View style={styles.freeCard}>
          <View style={styles.freeCardLeft}>
            <Text style={styles.freeCardEmoji}>🎁</Text>
            <View>
              <Text style={styles.freeCardTitle}>Free Swipes</Text>
              <Text style={styles.freeCardSub}>
                {freeSwipesLeft > 0
                  ? `${freeSwipesLeft} remaining — keep going!`
                  : 'All used up — time to unlock more!'}
              </Text>
            </View>
          </View>
          <View style={styles.freeProgress}>
            <View
              style={[
                styles.freeProgressFill,
                { width: `${(freeSwipesLeft / 100) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Section: Best Value */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Best Value</Text>
          <PackCard
            pack={NAME_PACKS[0]}
            isPurchased={isPurchased(NAME_PACKS[0].key)}
            onPress={() => handlePurchase(NAME_PACKS[0])}
            isFeatured
          />
        </View>

        {/* Section: Region Packs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Region Packs</Text>
          <View style={styles.grid}>
            {NAME_PACKS.slice(1).map((pack) => (
              <PackCard
                key={pack.key}
                pack={pack}
                isPurchased={isPurchased(pack.key)}
                onPress={() => handlePurchase(pack)}
                compact
              />
            ))}
          </View>
        </View>

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.footerNoteText}>
            Purchases are one-time and shared between both partners in your room.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface PackCardProps {
  pack: NamePack;
  isPurchased: boolean;
  onPress: () => void;
  isFeatured?: boolean;
  compact?: boolean;
}

function PackCard({ pack, isPurchased, onPress, isFeatured, compact }: PackCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.packCard,
        compact && styles.packCardCompact,
        isPurchased && styles.packCardOwned,
        SHADOWS.card,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>BEST VALUE</Text>
        </View>
      )}

      <LinearGradient
        colors={pack.gradient}
        style={[styles.packGradient, compact && styles.packGradientCompact]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.packEmoji}>{pack.emoji}</Text>
      </LinearGradient>

      <View style={styles.packBody}>
        <Text style={[styles.packLabel, compact && styles.packLabelCompact]}>
          {pack.label}
        </Text>
        {!compact && (
          <Text style={styles.packDescription}>{pack.description}</Text>
        )}
        <Text style={styles.packCount}>{pack.nameCount}+ names</Text>
      </View>

      <View style={styles.packFooter}>
        {isPurchased ? (
          <View style={styles.ownedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.secondaryDark} />
            <Text style={styles.ownedText}>Owned</Text>
          </View>
        ) : (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>${pack.price.toFixed(2)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.shortlist.background,
  },
  scroll: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: colors.shortlist.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.text,
    marginTop: 2,
  },
  freeCard: {
    marginHorizontal: SPACING.xl,
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  freeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  freeCardEmoji: {
    fontSize: 28,
  },
  freeCardTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: colors.shortlist.text,
  },
  freeCardSub: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.text,
  },
  freeProgress: {
    height: 6,
    backgroundColor: colors.shortlist.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  freeProgressFill: {
    height: '100%',
    backgroundColor: colors.shortlist.background,
    borderRadius: 3,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: colors.shortlist.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  packCard: {
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  packCardCompact: {
    width: '47%',
  },
  packCardOwned: {
    opacity: 0.8,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  featuredBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: colors.shortlist.text,
    letterSpacing: 0.5,
  },
  packGradient: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packGradientCompact: {
    height: 70,
  },
  packEmoji: {
    fontSize: 40,
  },
  packBody: {
    padding: SPACING.md,
    gap: 2,
  },
  packLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: colors.shortlist.text,
  },
  packLabelCompact: {
    fontSize: FONTS.sizes.md,
  },
  packDescription: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.text,
    lineHeight: 18,
  },
  packCount: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.text,
    fontWeight: '600',
  },
  packFooter: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  priceTag: {
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  priceText: {
    color: colors.shortlist.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  ownedBadge: {
    backgroundColor: colors.shortlist.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  ownedText: {
    color: colors.shortlist.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  footerNoteText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: colors.shortlist.text,
    lineHeight: 18,
  },
});
