import React, { useEffect, useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import {
  NameFilters,
  NameLength,
  NameTrend,
  NameVibeTag,
  DEFAULT_FILTERS,
  OriginCountryChip,
  Region,
  type RootStackParamList,
  ORIGIN_FILTER_WORLDWIDE,
} from '../types';
import { useApp } from '../context/AppContext';
import { useSwipeDeckActions } from '../context/SwipeDeckContext';
import { findCountry } from '../data/countries';
import { translateOriginFilterCountry } from '../i18n/display';
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

const VIBE_TAGS: NameVibeTag[] = ['unique', 'international', 'soft', 'strong'];
const LEGACY_ORIGIN_TAGS = new Set(['spanish', 'dutch']);

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FEATURED_LETTERS = ['A', 'E', 'L', 'M', 'N', 'S'];

const REGION_ORDER: (Region | 'OTHER')[] = [
  'EU',
  'US',
  'LATIN_AMERICA',
  'ASIA',
  'MENA',
  'ARABIA',
  'WORLDWIDE',
  'OTHER',
];

const REGION_LABEL_KEYS: Record<Region, string> = {
  EU: 'region.eu',
  US: 'region.us',
  LATIN_AMERICA: 'region.latinAmerica',
  ASIA: 'region.asia',
  MENA: 'region.mena',
  ARABIA: 'region.arabia',
  WORLDWIDE: 'region.worldwide',
};

/** Countries below this count are selectable but not full national datasets. */
const ORIGIN_FULL_COVERAGE_MIN = 5;

function isLimitedOriginCoverage(count: number): boolean {
  return count > 0 && count < ORIGIN_FULL_COVERAGE_MIN;
}

function regionLabelKey(region: Region | 'OTHER'): string {
  return region === 'OTHER' ? 'filter.origin.regionOther' : REGION_LABEL_KEYS[region];
}

function buildFeaturedCountries(
  chips: OriginCountryChip[],
  countryPreference: string | null | undefined,
  selectedOrigins: string[],
): OriginCountryChip[] {
  const byCountry = new Map(chips.map((c) => [c.country, c]));
  const seen = new Set<string>();
  const out: OriginCountryChip[] = [];
  const add = (country: string | undefined | null) => {
    const c = country?.trim();
    if (!c || seen.has(c)) return;
    const chip = byCountry.get(c);
    if (!chip) return;
    seen.add(c);
    out.push(chip);
  };
  add(countryPreference);
  [...selectedOrigins].reverse().forEach((c) => add(c));
  for (const chip of chips) {
    if (out.length >= 8) break;
    add(chip.country);
  }
  return out;
}

function groupCountriesByRegion(
  chips: OriginCountryChip[],
  exclude: ReadonlySet<string>,
): { region: Region | 'OTHER'; chips: OriginCountryChip[] }[] {
  const buckets = new Map<Region | 'OTHER', OriginCountryChip[]>();
  for (const chip of chips) {
    if (exclude.has(chip.country)) continue;
    const region =
      chip.country === ORIGIN_FILTER_WORLDWIDE
        ? 'WORLDWIDE'
        : (findCountry(chip.country)?.region ?? 'OTHER');
    const list = buckets.get(region) ?? [];
    list.push(chip);
    buckets.set(region, list);
  }
  return REGION_ORDER.filter((r) => (buckets.get(r)?.length ?? 0) > 0).map((region) => ({
    region,
    chips: buckets.get(region)!,
  }));
}

type OriginCountryPickerModalProps = {
  visible: boolean;
  chips: OriginCountryChip[];
  selected: string[];
  countryPreference: string | null | undefined;
  onToggle: (country: string) => void;
  onClose: () => void;
};

function OriginCountryPickerModal({
  visible,
  chips,
  selected,
  countryPreference,
  onToggle,
  onClose,
}: OriginCountryPickerModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const featured = useMemo(
    () => buildFeaturedCountries(chips, countryPreference, selected),
    [chips, countryPreference, selected],
  );
  const featuredSet = useMemo(() => new Set(featured.map((c) => c.country)), [featured]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return chips.filter((chip) => {
      const label = translateOriginFilterCountry(t, chip.country).toLowerCase();
      if (chip.country === ORIGIN_FILTER_WORLDWIDE) {
        return (
          label.includes(q) ||
          q.includes('world') ||
          q.includes('international') ||
          q.includes('internation')
        );
      }
      return chip.country.toLowerCase().includes(q) || label.includes(q);
    });
  }, [chips, query, t]);

  const grouped = useMemo(
    () => (searchResults ? [] : groupCountriesByRegion(chips, featuredSet)),
    [chips, featuredSet, searchResults],
  );

  const renderCountryRow = (chip: OriginCountryChip) => {
    const active = selected.includes(chip.country);
    const disabled = chip.count === 0 && !active;
    const limitedCoverage = isLimitedOriginCoverage(chip.count);
    return (
      <TouchableOpacity
        key={chip.country}
        style={[
          styles.originRow,
          disabled && styles.originRowDisabled,
          limitedCoverage && !active && styles.originRowLimited,
          active && styles.originRowActive,
        ]}
        onPress={() => !disabled && onToggle(chip.country)}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.originRowLabel,
            disabled && styles.originRowLabelDisabled,
            limitedCoverage && !active && styles.originRowLabelLimited,
          ]}
        >
          {chip.flag ? `${chip.flag} ` : ''}
          {translateOriginFilterCountry(t, chip.country)}
        </Text>
        <View style={styles.originRowRight}>
          {limitedCoverage ? (
            <Text
              style={[
                styles.originRowLimitedBadge,
                active && styles.originRowLimitedBadgeActive,
              ]}
            >
              {t('filter.origin.limitedCoverageCount', { count: chip.count })}
            </Text>
          ) : (
            <Text style={[styles.originRowCount, disabled && styles.originRowLabelDisabled]}>{chip.count}</Text>
          )}
          {active ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.onboarding.primary} />
          ) : (
            <Ionicons name="ellipse-outline" size={20} color={colors.neutral.border} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerBackdrop}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{t('filter.section.origin')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.pickerDone}>{t('filter.origin.done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.neutral.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('filter.origin.searchPlaceholder')}
              placeholderTextColor={colors.neutral.gray}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {chips.length === 0 ? (
              <Text style={styles.sectionHint}>{t('filter.origin.empty')}</Text>
            ) : searchResults ? (
              searchResults.map(renderCountryRow)
            ) : (
              <>
                {featured.length > 0 ? (
                  <>
                    <Text style={styles.pickerSectionLabel}>{t('filter.origin.featured')}</Text>
                    {featured.map(renderCountryRow)}
                  </>
                ) : null}
                {grouped.map(({ region, chips: regionChips }) => (
                  <View key={region}>
                    <Text style={styles.pickerSectionLabel}>{t(regionLabelKey(region))}</Text>
                    {regionChips.map(renderCountryRow)}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const normalizeFilters = (filters: NameFilters): NameFilters => ({
  ...DEFAULT_FILTERS,
  ...filters,
  origins: (filters.origins ?? []).filter((c) => !LEGACY_ORIGIN_TAGS.has(c)),
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
  const { countryPreference } = useApp();
  const { getOriginCountryChips } = useSwipeDeckActions();
  const [draft, setDraft] = useState<NameFilters>(
    isPremium ? normalizeFilters(currentFilters) : sanitizeFreeFilters(currentFilters),
  );
  const [showAllLetters, setShowAllLetters] = useState(false);
  const [showOriginPicker, setShowOriginPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(isPremium ? normalizeFilters(currentFilters) : sanitizeFreeFilters(currentFilters));
      setShowAllLetters(false);
      setShowOriginPicker(false);
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

  const originCountryChips = useMemo(
    () => getOriginCountryChips(draft),
    [draft, getOriginCountryChips],
  );

  const toggleOriginCountry = (country: string) => {
    if (!isPremium) return;
    setDraft((prev) => ({
      ...prev,
      origins: prev.origins.includes(country)
        ? prev.origins.filter((x) => x !== country)
        : [...prev.origins, country],
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

          {/* Origin / culture — searchable picker grouped by region */}
          <Text style={styles.sectionLabel}>{t('filter.section.origin')}</Text>
          <TouchableOpacity
            style={[
              styles.originSelector,
              !isPremium && styles.chipLocked,
            ]}
            onPress={() =>
              !isPremium ? openPaywallFromLockedFilter('origin') : setShowOriginPicker(true)
            }
            activeOpacity={0.85}
          >
            <View style={styles.originSelectorMain}>
              <Ionicons
                name="earth-outline"
                size={18}
                color={!isPremium ? colors.neutral.gray : colors.onboarding.primary}
              />
              <Text
                style={[styles.originSelectorText, !isPremium && styles.chipLockedText]}
                numberOfLines={1}
              >
                {draft.origins.length === 0
                  ? t('filter.origin.noneSelected')
                  : t('filter.origin.selectedCount', { count: draft.origins.length })}
              </Text>
            </View>
            {!isPremium ? (
              <Ionicons name="lock-closed-outline" size={16} color={colors.neutral.gray} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.neutral.gray} />
            )}
          </TouchableOpacity>
          {isPremium && draft.origins.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedOriginRow}
            >
              {draft.origins.map((country) => {
                const chip = originCountryChips.find((c) => c.country === country);
                return (
                  <TouchableOpacity
                    key={country}
                    style={styles.selectedOriginChip}
                    onPress={() => toggleOriginCountry(country)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.selectedOriginChipText}>
                      {chip?.flag ? `${chip.flag} ` : ''}
                      {translateOriginFilterCountry(t, country)}
                    </Text>
                    <Ionicons name="close-circle" size={16} color={colors.onboarding.primary} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

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

      <OriginCountryPickerModal
        visible={showOriginPicker && isPremium}
        chips={originCountryChips}
        selected={draft.origins}
        countryPreference={countryPreference}
        onToggle={toggleOriginCountry}
        onClose={() => setShowOriginPicker(false)}
      />
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
  chipDisabled: {
    opacity: 0.45,
    borderStyle: 'dashed',
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.bgSoft,
  },
  chipDisabledText: {
    color: colors.neutral.gray,
  },
  chipCount: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: colors.neutral.gray,
    minWidth: 16,
    textAlign: 'right',
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
  originSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.bgSoft,
    marginBottom: SPACING.xs,
  },
  originSelectorMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
  },
  originSelectorText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.neutral.textDark,
  },
  selectedOriginRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  selectedOriginChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: colors.onboarding.primary + '14',
    borderWidth: 1,
    borderColor: colors.onboarding.primary + '55',
  },
  selectedOriginChipText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: colors.onboarding.primary,
    maxWidth: 140,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + 16,
    maxHeight: '85%',
    ...SHADOWS.card,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  pickerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: colors.neutral.textDark,
  },
  pickerDone: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.onboarding.primary,
  },
  pickerSectionLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.neutral.gray,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.bgSoft,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: colors.neutral.textDark,
    paddingVertical: 4,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.border,
  },
  originRowActive: {
    backgroundColor: colors.onboarding.primary + '08',
  },
  originRowDisabled: {
    opacity: 0.45,
  },
  originRowLimited: {
    opacity: 0.78,
  },
  originRowLabel: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: colors.neutral.textDark,
  },
  originRowLabelDisabled: {
    color: colors.neutral.gray,
  },
  originRowLabelLimited: {
    color: colors.neutral.gray,
    fontWeight: '500',
  },
  originRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  originRowCount: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: colors.neutral.gray,
    minWidth: 24,
    textAlign: 'right',
  },
  originRowLimitedBadge: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    fontStyle: 'italic',
    color: 'rgba(118,126,146,0.92)',
    maxWidth: 112,
    textAlign: 'right',
    lineHeight: 15,
  },
  originRowLimitedBadgeActive: {
    color: colors.onboarding.primary,
    fontStyle: 'normal',
  },
});
