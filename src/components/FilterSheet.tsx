import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import { NameFilters, NameLength, NameTrend, DEFAULT_FILTERS } from '../types';

interface FilterSheetProps {
  visible: boolean;
  currentFilters: NameFilters;
  onApply: (filters: NameFilters) => void;
  onClose: () => void;
}

const LENGTH_OPTIONS: { key: NameLength; label: string; hint: string }[] = [
  { key: 'short',  label: 'Short',  hint: '≤4 letters' },
  { key: 'medium', label: 'Medium', hint: '5–7 letters' },
  { key: 'long',   label: 'Long',   hint: '8+ letters' },
];

const TREND_OPTIONS: { key: NameTrend; label: string; emoji: string }[] = [
  { key: 'rising',  label: 'Trending', emoji: '📈' },
  { key: 'stable',  label: 'Popular',  emoji: '✦'  },
  { key: 'classic', label: 'Classic',  emoji: '👑' },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function FilterSheet({ visible, currentFilters, onApply, onClose }: FilterSheetProps) {
  const [draft, setDraft] = useState<NameFilters>(currentFilters);

  const toggleLength = (key: NameLength) => {
    setDraft((prev) => ({
      ...prev,
      lengths: prev.lengths.includes(key)
        ? prev.lengths.filter((l) => l !== key)
        : [...prev.lengths, key],
    }));
  };

  const toggleTrend = (key: NameTrend) => {
    setDraft((prev) => ({
      ...prev,
      trends: prev.trends.includes(key)
        ? prev.trends.filter((t) => t !== key)
        : [...prev.trends, key],
    }));
  };

  const toggleLetter = (letter: string) => {
    setDraft((prev) => ({
      ...prev,
      startingLetter: prev.startingLetter === letter ? '' : letter,
    }));
  };

  const handleReset = () => setDraft(DEFAULT_FILTERS);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const activeCount =
    (draft.lengths.length > 0 ? 1 : 0) +
    (draft.startingLetter ? 1 : 0) +
    (draft.trends.length > 0 ? 1 : 0) +
    (draft.originsContain ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filter Names</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Name Length */}
          <Text style={styles.sectionLabel}>NAME LENGTH</Text>
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
                    {opt.label}
                  </Text>
                  <Text style={[styles.filterChipHint, active && styles.filterChipTextActive]}>
                    {opt.hint}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Trend */}
          <Text style={styles.sectionLabel}>TREND</Text>
          <View style={styles.chipRow}>
            {TREND_OPTIONS.map((opt) => {
              const active = draft.trends.includes(opt.key);
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => toggleTrend(opt.key)}
                >
                  <Text style={styles.trendEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Starting Letter */}
          <Text style={styles.sectionLabel}>STARTS WITH</Text>
          <View style={styles.letterGrid}>
            {LETTERS.map((letter) => {
              const active = draft.startingLetter === letter;
              return (
                <TouchableOpacity
                  key={letter}
                  style={[styles.letterChip, active && styles.letterChipActive]}
                  onPress={() => toggleLetter(letter)}
                >
                  <Text style={[styles.letterText, active && styles.letterTextActive]}>
                    {letter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Origin search */}
          <Text style={styles.sectionLabel}>ORIGIN / CULTURE</Text>
          <View style={styles.originInputWrapper}>
            <Ionicons name="search-outline" size={16} color={colors.neutral.gray} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.originInput}
              placeholder="e.g. Irish, Hebrew, Italian..."
              placeholderTextColor={colors.neutral.gray}
              value={draft.originsContain}
              onChangeText={(t) => setDraft((prev) => ({ ...prev, originsContain: t }))}
              autoCorrect={false}
            />
            {draft.originsContain ? (
              <TouchableOpacity onPress={() => setDraft((prev) => ({ ...prev, originsContain: '' }))}>
                <Ionicons name="close-circle" size={18} color={colors.neutral.gray} />
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>

        {/* Apply button */}
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyText}>
            {activeCount > 0 ? `Apply ${activeCount} filter${activeCount > 1 ? 's' : ''}` : 'Apply Filters'}
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
  },
  filterChipActive: {
    backgroundColor: colors.onboarding.primary + '18',
    borderColor: colors.onboarding.primary,
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
  letterGrid: {
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
  letterText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.neutral.textDark,
  },
  letterTextActive: {
    color: colors.neutral.white,
  },
  originInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.bgSoft,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  originInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: colors.neutral.textDark,
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
