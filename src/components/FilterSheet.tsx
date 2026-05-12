import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import {
  NameFilters,
  NameLength,
  NameOriginTag,
  NameTrend,
  NameVibeTag,
  DEFAULT_FILTERS,
  type RootStackParamList,
} from '../types';
import { useTranslation } from '../i18n/I18nProvider';

interface FilterSheetProps {
  visible: boolean;
  currentFilters: NameFilters;
  onApply: (filters: NameFilters) => void;
  onClose: () => void;
  isPremium: boolean;
}

const LENGTH_OPTIONS: { key: NameLength; labelKey: string; hintKey: string }[] = [
  { key: 'short', labelKey: 'filter.length.short', hintKey: 'filter.lengthHint.short' },
  { key: 'medium', labelKey: 'filter.length.medium', hintKey: 'filter.lengthHint.medium' },
  { key: 'long', labelKey: 'filter.length.long', hintKey: 'filter.lengthHint.long' },
];

const TREND_OPTIONS: { key: NameTrend; labelKey: string; emoji: string }[] = [
  { key: 'rising', labelKey: 'filter.trend.trending', emoji: '📈' },
  { key: 'stable', labelKey: 'filter.trend.popular', emoji: '✦' },
  { key: 'classic', labelKey: 'filter.trend.classic', emoji: '👑' },
];

const ORIGIN_TAGS: NameOriginTag[] = ['spanish', 'dutch'];
const VIBE_TAGS: NameVibeTag[] = ['unique', 'international', 'soft', 'strong'];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FEATURED_LETTERS = ['A', 'E', 'L', 'M', 'N', 'S'];

const normalizeFilters = (filters: NameFilters): NameFilters => ({
  ...DEFAULT_FILTERS,
  ...filters,
  origins: filters.origins ?? [],
  vibes: filters.vibes ?? [],
});

const sanitizeFreeFilters = (filters: NameFilters): NameFilters => {
  const normalized = normalizeFilters(filters);
  if (normalized.lengths.length > 0) {
    return {
      ...DEFAULT_FILTERS,
      lengths: [normalized.lengths[0]],
    };
  }
  if (normalized.trends.length > 0) {
    return {
      ...DEFAULT_FILTERS,
      trends: [normalized.trends[0]],
    };
  }
  return DEFAULT_FILTERS;
};

export default function FilterSheet({
  visible,
  currentFilters,
  onApply,
  onClose,
  isPremium,
}: FilterSheetProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [draft, setDraft] = useState<NameFilters>(
    isPremium ? normalizeFilters(currentFilters) : sanitizeFreeFilters(currentFilters),
  );
  const [showAllLetters, setShowAllLetters] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(isPremium ? normalizeFilters(currentFilters) : sanitizeFreeFilters(currentFilters));
      setShowAllLetters(false);
    }
  }, [currentFilters, isPremium, visible]);

  const openPaywallFromLockedFilter = (contextLabel?: string) => {
    onClose();
    navigation.navigate('Paywall', {
      source: 'filter_chip',
      ...(contextLabel ? { contextLabel } : {}),
    });
  };

  const toggleLength = (key: NameLength) => {
    if (!isPremium) {
      setDraft((prev) => ({
        ...prev,
        lengths: prev.lengths.includes(key) ? [] : [key],
      }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      lengths: prev.lengths.includes(key) ? prev.lengths.filter((l) => l !== key) : [...prev.lengths, key],
    }));
  };

  const toggleTrend = (key: NameTrend) => {
    if (!isPremium) return;
    setDraft((prev) => ({
      ...prev,
      trends: prev.trends.includes(key) ? prev.trends.filter((x) => x !== key) : [...prev.trends, key],
    }));
  };

  const toggleVibe = (key: NameVibeTag) => {
    if (!isPremium) return;
    setDraft((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(key) ? prev.vibes.filter((x) => x !== key) : [...prev.vibes, key],
    }));
  };

  const toggleOriginTag = (key: NameOriginTag) => {
    if (!isPremium) return;
    setDraft((prev) => ({
      ...prev,
      origins: prev.origins.includes(key) ? prev.origins.filter((x) => x !== key) : [...prev.origins, key],
    }));
  };

  const toggleLetter = (letter: string) => {
    if (!isPremium) return;
    setDraft((prev) => ({
      ...prev,
      startingLetter: prev.startingLetter === letter ? '' : letter,
    }));
  };

  const handleReset = () => setDraft(DEFAULT_FILTERS);

  const handleApply = () => {
    onApply(isPremium ? normalizeFilters(draft) : sanitizeFreeFilters(draft));
    onClose();
  };

  const activeCount =
    (draft.lengths.length > 0 ? 1 : 0) +
    (draft.startingLetter ? 1 : 0) +
    (draft.trends.length > 0 ? 1 : 0) +
    (draft.origins.length > 0 ? 1 : 0) +
    (draft.vibes.length > 0 ? 1 : 0);

  const letterOptions = showAllLetters
    ? LETTERS
    : draft.startingLetter && !FEATURED_LETTERS.includes(draft.startingLetter)
      ? [...FEATURED_LETTERS, draft.startingLetter]
      : FEATURED_LETTERS;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>{t('filter.title')}</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>{t('filter.reset')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Length */}
          <Text style={styles.sectionLabel}>{t('filter.section.length')}</Text>
          <View style={styles.chipRow}>
            {LENGTH_OPTIONS.map((opt) => {
              const active = draft.lengths.includes(opt.key);
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => toggleLength(opt.key)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {t(opt.labelKey)}
                  </Text>
                  <Text style={[styles.filterChipHint, active && styles.filterChipTextActive]}>
                    {t(opt.hintKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Origin */}
          <Text style={styles.sectionLabel}>{t('filter.section.origin')}</Text>
          <View style={styles.chipRow}>
            {ORIGIN_TAGS.map((tag) => {
              const active = isPremium && draft.origins.includes(tag);
              const locked = !isPremium;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.filterChip, locked && styles.chipLocked, active && styles.filterChipActive]}
                  onPress={() =>
                    locked ? openPaywallFromLockedFilter('origin') : toggleOriginTag(tag)
                  }
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      locked && styles.chipLockedText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {t(`filter.chip.${tag}`)}
                  </Text>
                  {locked ? (
                    <View style={styles.lockBadgeSmall}>
                      <Ionicons name="lock-closed-outline" size={12} color={colors.neutral.gray} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Vibe */}
          <Text style={styles.sectionLabel}>{t('filter.section.style')}</Text>
          <Text style={styles.sectionHint}>{t('filter.section.styleHint')}</Text>
          <View style={styles.chipRow}>
            {VIBE_TAGS.map((tag) => {
              const active = isPremium && draft.vibes.includes(tag);
              const locked = !isPremium;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.filterChip, locked && styles.chipLocked, active && styles.filterChipActive]}
                  onPress={() => (locked ? openPaywallFromLockedFilter('vibe') : toggleVibe(tag))}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      locked && styles.chipLockedText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {t(`filter.chip.${tag}`)}
                  </Text>
                  {locked ? (
                    <View style={styles.lockBadgeSmall}>
                      <Ionicons name="lock-closed-outline" size={12} color={colors.neutral.gray} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Trend */}
          <Text style={styles.sectionLabel}>{t('filter.section.trend')}</Text>
          <View style={styles.chipRow}>
            {TREND_OPTIONS.map((opt) => {
              const active = isPremium && draft.trends.includes(opt.key);
              const locked = !isPremium;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, locked && styles.chipLocked, active && styles.filterChipActive]}
                  onPress={() => (locked ? openPaywallFromLockedFilter('trend') : toggleTrend(opt.key))}
                  activeOpacity={0.85}
                >
                  <Text style={styles.trendEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.filterChipText,
                      locked && styles.chipLockedText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                  {locked ? (
                    <View style={styles.lockBadgeSmall}>
                      <Ionicons name="lock-closed-outline" size={12} color={colors.neutral.gray} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Starts with */}
          <Text style={styles.sectionLabel}>{t('filter.section.startsWith')}</Text>
          <View style={styles.compactLetterRow}>
            {letterOptions.map((letter) => {
              const active = isPremium && draft.startingLetter === letter;
              const locked = !isPremium;
              return (
                <TouchableOpacity
                  key={letter}
                  style={[styles.letterChip, locked && styles.letterChipLocked, active && styles.letterChipActive]}
                  onPress={() => (locked ? openPaywallFromLockedFilter('starts_with') : toggleLetter(letter))}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.letterText,
                      locked && styles.letterTextLocked,
                      active && styles.letterTextActive,
                    ]}
                  >
                    {letter}
                  </Text>
                  {locked ? (
                    <Ionicons
                      name="lock-closed-outline"
                      size={9}
                      color={colors.neutral.gray}
                      style={styles.letterLockIcon}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.letterChip, styles.moreLetterChip, !isPremium && styles.letterChipLocked]}
              onPress={() =>
                !isPremium ? openPaywallFromLockedFilter('starts_with') : setShowAllLetters((prev) => !prev)
              }
              activeOpacity={0.85}
            >
              <Text style={styles.moreLetterText}>
                {showAllLetters ? t('filter.letters.less') : t('filter.letters.more')}
              </Text>
              {!isPremium ? (
                <Ionicons name="lock-closed-outline" size={10} color={colors.neutral.gray} />
              ) : null}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyText}>
            {activeCount > 1
              ? t('filter.apply.countMany', { count: activeCount })
              : activeCount === 1
                ? t('filter.apply.countOne', { count: activeCount })
                : t('filter.apply.none')}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl + 16,
    paddingTop: SPACING.sm,
    maxHeight: '80%',
    ...SHADOWS.card,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: colors.neutral.textDark,
  },
  resetText: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.primary,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.neutral.gray,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  sectionHint: {
    fontSize: FONTS.sizes.sm,
    color: colors.neutral.gray,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: colors.neutral.bgSoft,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  chipLocked: {
    opacity: 0.88,
    borderStyle: 'dashed',
    borderColor: 'rgba(118,126,146,0.38)',
    backgroundColor: 'rgba(238,239,244,0.95)',
  },
  chipLockedText: {
    color: 'rgba(88,92,108,0.82)',
  },
  lockBadgeSmall: {
    marginLeft: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.onboarding.primary + '18',
    borderColor: colors.onboarding.primary,
    borderStyle: 'solid',
    opacity: 1,
  },
  filterChipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.neutral.textDark,
  },
  filterChipTextActive: {
    color: colors.onboarding.primary,
  },
  filterChipHint: {
    fontSize: FONTS.sizes.xs,
    color: colors.neutral.gray,
    marginTop: 1,
  },
  trendEmoji: {
    fontSize: 14,
    marginBottom: 2,
  },
  compactLetterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  letterChip: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.neutral.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  letterChipActive: {
    backgroundColor: colors.onboarding.primary,
    borderColor: colors.onboarding.primary,
  },
  letterChipLocked: {
    opacity: 0.72,
    borderStyle: 'dashed',
    borderColor: 'rgba(118,126,146,0.32)',
    backgroundColor: 'rgba(238,239,244,0.88)',
  },
  letterText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.neutral.textDark,
  },
  letterTextActive: {
    color: colors.neutral.white,
  },
  letterTextLocked: {
    color: colors.neutral.gray,
  },
  letterLockIcon: {
    position: 'absolute',
    right: 3,
    bottom: 3,
  },
  moreLetterChip: {
    width: 58,
    borderStyle: 'dashed',
  },
  moreLetterText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: colors.neutral.gray,
  },
  applyBtn: {
    marginTop: SPACING.lg,
    backgroundColor: colors.onboarding.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    ...SHADOWS.button,
  },
  applyText: {
    color: colors.neutral.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
});
