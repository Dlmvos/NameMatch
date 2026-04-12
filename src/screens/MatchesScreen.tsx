import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Match } from '../types';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

export default function MatchesScreen() {
  const { matches } = useApp();

  const handleShare = async () => {
    if (matches.length === 0) return;
    const nameList = matches
      .slice(0, 10)
      .map((m) => `• ${m.baby_names?.name ?? ''}`)
      .join('\n');
    await Share.share({
      message: `We found ${matches.length} name matches on NameMatch! 💕\n\n${nameList}\n\nFind your baby's perfect name together!`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Matches</Text>
          <Text style={styles.headerSubtitle}>
            {matches.length > 0
              ? `${matches.length} name${matches.length > 1 ? 's' : ''} you both love`
              : 'Your shared favourites'}
          </Text>
        </View>
        {matches.length > 0 && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.match.primary} />
          </TouchableOpacity>
        )}
      </View>

      {matches.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          renderItem={({ item, index }) => (
            <MatchCard match={item} rank={index + 1} />
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Keep swiping to find more! 💕
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function MatchCard({ match, rank }: { match: Match; rank: number }) {
  const name = match.baby_names;
  if (!name) return null;

  const genderColor =
    name.gender === 'boy'
      ? COLORS.boy
      : name.gender === 'girl'
      ? COLORS.girl
      : COLORS.neutral;

  const genderEmoji =
    name.gender === 'boy' ? '💙' : name.gender === 'girl' ? '💗' : '💜';

  const date = new Date(match.created_at);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.matchCard, SHADOWS.card]}>
      {/* Rank */}
      <View style={[styles.rankBadge, { backgroundColor: genderColor + '22' }]}>
        <Text style={[styles.rankText, { color: genderColor }]}>#{rank}</Text>
      </View>

      {/* Name info */}
      <View style={styles.matchInfo}>
        <View style={styles.matchNameRow}>
          <Text style={styles.matchName}>{name.name}</Text>
          <Text style={styles.genderEmoji}>{genderEmoji}</Text>
        </View>
        <Text style={styles.matchOrigin}>{name.origin}</Text>
        <Text style={styles.matchMeaning} numberOfLines={2}>
          {name.meaning}
        </Text>
      </View>

      {/* Meta */}
      <View style={styles.matchMeta}>
        <Text style={styles.matchDate}>{dateStr}</Text>
        <View style={styles.heartIcon}>
          <Text>💕</Text>
        </View>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>⭐</Text>
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Text style={styles.emptySubtitle}>
        When you and your partner both swipe right on the same name, it'll appear here as a match!
      </Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>How it works</Text>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>1</Text>
          <Text style={styles.tipText}>You both swipe names independently</Text>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>2</Text>
          <Text style={styles.tipText}>When you both swipe right — instant match! 🎉</Text>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>3</Text>
          <Text style={styles.tipText}>All your shared faves appear here</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  matchInfo: {
    flex: 1,
    gap: 2,
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  matchName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  genderEmoji: {
    fontSize: 16,
  },
  matchOrigin: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  matchMeaning: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  matchMeta: {
    alignItems: 'center',
    gap: 4,
  },
  matchDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  heartIcon: {},
  footer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
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
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tipBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    ...SHADOWS.card,
  },
  tipTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  tipStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.match.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: colors.match.primary,
  },
  tipText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
