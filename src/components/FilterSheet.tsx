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
import { colors, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import { NameFilters, NameLength, NameStyleTag, NameTrend, DEFAULT_FILTERS } from '../types';
import { useTranslation } from '../i18n/I18nProvider';

interface FilterSheetProps {
  visible: boolean;
  currentFilters: NameFilters;
  onApply: (filters: NameFilters) => void;
  onClose: () => void;
  isPremium: boolean;
  onPremiumFilterPress: () => void;
}

const LENGTH_OPTIONS: { key: NameLength; labelKey: string; hintKey: string }[] = [
  { key: 'short',  labelKey: 'filter.length.short',  hintKey: 'filter.lengthHint.short' },
  { key: 'medium', labelKey: 'filter.length.medium', hintKey: 'filter.lengthHint.medium' },
  { key: 'long',   labelKey: 'filter.length.long',   hintKey: 'filter.lengthHint.long' },
];

const TREND_OPTIONS: { key: NameTrend; labelKey: string; emoji: string }[] = [
  { key: 'rising',  labelKey: 'filter.trend.trending', emoji: '📈' },
  { key: 'stable',  labelKey: 'filter.trend.popular',  emoji: '✦'  },
  { key: 'classic', labelKey: 'filter.trend.classic',  emoji: '👑' },
];

type QuickChip =
  | { key: 'modern' | 'classic'; label: string; trend: NameTrend }
  | { key: 'short'; label: string; length: NameLength }
  | { key: NameStyleTag; label: string; styleTag: NameStyleTag };

const QUICK_CHIPS: QuickChip[] = [
  { key: 'modern', label: 'Modern', trend: 'rising' },
  { key: 'classic', label: 'Classic', trend: 'classic' },
  { key: 'short', label: 'Short', length: 'short' },
  { key: 'unique', label: 'Unique', styleTag: 'unique' },
  { key: 'international', label: 'International', styleTag: 'international' },
  { key: 'spanish', label: 'Spanish', styleTag: 'spanish' },
  { key: 'dutch', label: 'Dutch', styleTag: 'dutch' },
  { key: 'soft', label: 'Soft', styleTag: 'soft' },
  { key: 'strong', label: 'Strong', styleTag: 'strong' },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FEATURED_LETTERS = ['A', 'E', 'L', 'M', 'N', 'S'];

const normalizeFilters = (filters: NameFilters): NameFilters => ({
  ...DEFAULT_FILTERS,
  ...filters,
  styleTags: filters.styleTags ?? [],
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
  onPremiumFilterPress,
}: FilterSheetProps) {
  const { t } = useTranslation();
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

  const openPremium = () => {
    onClose();
    onPremiumFilterPress();
  };

  const hasAnyFreeFilter = draft.lengths.length > 0 || draft.trends.length > 0;

  const toggleLength = (key: NameLength) => {
    const isActive = draft.lengths.includes(key);
    if (!isPremium && !isActive && hasAnyFreeFilter) {
      openPremium();
      return;
    }
    setDraft((prev) => ({
      ...prev,
      lengths: prev.lengths.includes(key)
        ? prev.lengths.filter((l) => l !== key)
        : isPremium
          ? [...prev.lengths, key]
          : [key],
    }));
  };

  const toggleTrend = (key: NameTrend) => {
    const isActive = draft.trends.includes(key);
    if (!isPremium && !isActive && hasAnyFreeFilter) {
      openPremium();
      return;
    }
    setDraft((prev) => ({
      ...prev,
      trends: prev.trends.includes(key)
        ? prev.trends.filter((t) => t !== key)
        : isPremium
          ? [...prev.trends, key]
          : [key],
    }));
  };

  const toggleStyleTag = (key: NameStyleTag) => {
    if (!isPremium) {
      openPremium();
      return;
    }
    setDraft((prev) => ({
      ...prev,
      styleTags: prev.styleTags.includes(key)
        ? prev.styleTags.filter((tag) => tag !== key)
        : [...prev.styleTags, key],
      originsContain: key === 'spanish' || key === 'dutch' ? '' : prev.originsContain,
    }));
  };

  const toggleQuickChip = (chip: QuickChip) => {
    if (!isPremium) {
      openPremium();
      return;
    }
    if ('trend' in chip) {
      toggleTrend(chip.trend);
      return;
    }
    if ('length' in chip) {
      toggleLength(chip.length);
      return;
    }
    toggleStyleTag(chip.styleTag);
  };

  const isQuickChipActive = (chip: QuickChip): boolean => {
    if ('trend' in chip) return draft.trends.includes(chip.trend);
    if ('length' in chip) return draft.lengths.includes(chip.length);
    return draft.styleTags.includes(chip.styleTag);
  };

  const toggleLetter = (letter: string) => {
    if (!isPremium) {
      openPremium();
      return;
    }
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
    (draft.originsContain ? 1 : 0) +
    (draft.styleTags.length > 0 ? 1 : 0);

  const letterOptions = showAllLetters
    ? LETTERS
    : draft.startingLetter && !FEATURED_LETTERS.includes(draft.startingLetter)
      ? [...FEATURED_LETTERS, draft.startingLetter]
      : FEATURED_LETTERS;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('filter.title')}</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>{t('filter.reset')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Style / culture */}
          <Text style={styles.sectionLabel}>STYLE / CULTURE</Text>
          <Text style={styles.sectionHint}>Combine chips to shape the deck without typing.</Text>
          <View style={styles.chipRow}>
            {QUICK_CHIPS.map((chip) => {
              const active = isQuickChipActive(chip);
              return (
                <TouchableOpacity
                  key={chip.key}
                  style={[
                    styles.filterChip,
                    styles.quickChip,
                    !isPremium && styles.filterChipLocked,
                    active && styles.filterChipActive,
                  ]}
                  onPress={() => toggleQuickChip(chip)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                  {!isPremium ? (
                    <Ionicons name="lock-closed-outline" size={13} color={colors.neutral.gray} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {draft.originsContain ? (
              <TouchableOpacity
                style={[styles.filterChip, styles.customOriginChip]}
                onPress={() => setDraft((prev) => ({ ...prev, originsContain: '' }))}
              >
                <Text style={styles.filterChipText}>{draft.originsContain}</Text>
                <Ionicons name="close-circle" size={16} color={colors.neutral.gray} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Name Length */}
          <Text style={styles.sectionLabel}>{t('filter.section.length')}</Text>
          <View style={styles.chipRow}>
            {LENGTH_OPTIONS.map((opt) => {
              const active = draft.lengths.includes(opt.key);
              const locked = !isPremium && !active && hasAnyFreeFilter;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, locked && styles.filterChipLocked, active && styles.filterChipActive]}
                  onPress={() => toggleLength(opt.key)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {t(opt.labelKey)}
                  </Text>
                  <Text style={[styles.filterChipHint, active && styles.filterChipTextActive]}>
                    {t(opt.hintKey)}
                  </Text>
                  {locked ? (
                    <Ionicons name="lock-closed-outline" size={13} color={colors.neutral.gray} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Trend */}
          <Text style={styles.sectionLabel}>{t('filter.section.trend')}</Text>
          <View style={styles.chipRow}>
            {TREND_OPTIONS.map((opt) => {
              const active = draft.trends.includes(opt.key);
              const locked = !isPremium && !active && hasAnyFreeFilter;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, locked && styles.filterChipLocked, active && styles.filterChipActive]}
                  onPress={() => toggleTrend(opt.key)}
                >
                  <Text style={styles.trendEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {t(opt.labelKey)}
                  </Text>
                  {locked ? (
                    <Ionicons name="lock-closed-outline" size={13} color={colors.neutral.gray} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Starting Letter */}
          <Text style={styles.sectionLabel}>{t('filter.section.startsWith')}</Text>
          <View style={styles.compactLetterRow}>
            {letterOptions.map((letter) => {
              const active = draft.startingLetter === letter;
              return (
                <TouchableOpacity
                  key={letter}
                  style={[styles.letterChip, !isPremium && styles.letterChipLocked, active && styles.letterChipActive]}
                  onPress={() => toggleLetter(letter)}
                >
                  <Text style={[styles.letterText, !isPremium && styles.letterTextLocked, active && styles.letterTextActive]}>
                    {letter}
                  </Text>
                  {!isPremium ? (
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
              onPress={() => {
                if (!isPremium) {
                  openPremium();
                  return;
                }
                setShowAllLetters((prev) => !prev);
              }}
            >
              <Text style={styles.moreLetterText}>{showAllLetters ? 'Less' : 'More'}</Text>
              {!isPremium ? (
                <Ionicons name="lock-closed-outline" size={10} color={colors.neutral.gray} />
              ) : null}
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Apply button */}
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
  quickChip: {
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm + 2,
  },
  filterChipActive: {
    backgroundColor: colors.onboarding.primary + '18',
    borderColor: colors.onboarding.primary,
  },
  filterChipLocked: {
    opacity: 0.72,
    borderStyle: 'dashed',
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
  customOriginChip: {
    borderStyle: 'dashed',
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
