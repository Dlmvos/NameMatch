import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BabyName } from '../types';
import { useTranslation } from '../i18n/I18nProvider';
import { getLocalizedNameMeaning, cleanOriginForDisplay, isCustomName } from '../i18n/nameMeaningDisplay';
import { enrichName, getTrendLabel } from '../services/nameEnrichment';
import { colors, COLORS, FONTS, SPACING } from '../theme';

// ── Character tags derived from name properties ──

function deriveCharacterTags(name: BabyName, trend?: string): string[] {
  const tags: string[] = [];
  const len = name.name.length;
  const origin = (name.origin ?? '').toLowerCase();

  if (len <= 4) tags.push('character.modern');
  else if (len >= 8) tags.push('character.elegant');

  if (trend === 'rising') tags.push('character.trending');
  else if (trend === 'classic') tags.push('character.timeless');

  if (/latin|roman|greek|italian/i.test(origin)) tags.push('character.classical');
  if (/french|spanish|portuguese/i.test(origin)) tags.push('character.romantic');
  if (/norse|nordic|scandinavian|viking|celtic|irish|gaelic/i.test(origin)) tags.push('character.strong');
  if (/arabic|persian|hebrew/i.test(origin)) tags.push('character.noble');
  if (/japanese|chinese|korean/i.test(origin)) tags.push('character.graceful');
  if (/african|nigerian|kenyan|south african/i.test(origin)) tags.push('character.spirited');

  const rank = name.popularity_rank;
  if (rank && rank > 50) tags.push('character.rare');
  else if (rank && rank <= 5) tags.push('character.beloved');

  const g = (name.gender ?? '').toLowerCase();
  if (g.includes('girl') || g.includes('fem')) {
    const hasElegantOrStrong = tags.includes('character.elegant') || tags.includes('character.strong');
    if (!hasElegantOrStrong) tags.push('character.graceful');
  }

  return [...new Set(tags)].slice(0, 3);
}

function popularityTier(rank?: number): { key: string; level: number } {
  if (!rank) return { key: '', level: 0 };
  if (rank <= 5) return { key: 'popularity.detail.veryPopular', level: 5 };
  if (rank <= 15) return { key: 'popularity.detail.popular', level: 4 };
  if (rank <= 30) return { key: 'popularity.detail.wellKnown', level: 3 };
  if (rank <= 50) return { key: 'popularity.detail.uncommon', level: 2 };
  return { key: 'popularity.detail.rare', level: 1 };
}

// ── Palette ──

const IVORY = '#FFF9F5';
const IVORY_CARD = colors.neutral.white;
const TEXT_PRIMARY = colors.onboarding.text;
const TEXT_SECONDARY = colors.neutral.darkGray;
const TEXT_MUTED = colors.neutral.gray;
const ACCENT_SOFT = colors.onboarding.primary + '18';
const ACCENT_FG = colors.onboarding.primary;
const DIVIDER = colors.neutral.border;
const TAG_BG = colors.onboarding.primary + '12';
const TAG_FG = colors.onboarding.primary;
const BAR_TRACK = colors.neutral.border;
const BAR_FILL = colors.onboarding.primary;

// ── Component ──

interface NameDetailModalProps {
  name: BabyName | null;
  visible: boolean;
  onClose: () => void;
}

export default function NameDetailModal({ name, visible, onClose }: NameDetailModalProps) {
  const { language, t } = useTranslation();

  const detail = useMemo(() => {
    if (!name) return null;
    const enrichment = enrichName(name.name);
    const meaning = getLocalizedNameMeaning(name, language);
    const origin = cleanOriginForDisplay(name.origin);
    const trendLabel = getTrendLabel(enrichment.trend);
    const characterTags = deriveCharacterTags(name, enrichment.trend);
    const popularity = popularityTier(enrichment.popularity_rank ?? name.popularity_rank);
    const pronunciation = enrichment.pronunciation ?? name.pronunciation;
    const similarNames = enrichment.similar_names ?? name.similar_names ?? [];

    return {
      meaning,
      origin,
      trendLabel,
      characterTags,
      popularity,
      pronunciation,
      similarNames,
      rank: enrichment.popularity_rank ?? name.popularity_rank,
    };
  }, [name, language]);

  if (!name || !detail) return null;

  const genderEmoji =
    name.gender === 'boy' ? '♂' : name.gender === 'girl' ? '♀' : '⚬';
  const genderColor =
    name.gender === 'boy'
      ? COLORS.boy
      : name.gender === 'girl'
        ? COLORS.girl
        : COLORS.neutral;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="dark-content" backgroundColor={IVORY} />
      <View style={s.container}>
        {/* Header bar */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-down" size={26} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          bounces
        >
          {/* Hero name */}
          <View style={s.heroArea}>
            <Text style={[s.genderIndicator, { color: genderColor }]}>
              {genderEmoji}
            </Text>
            <Text
              style={s.heroName}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              numberOfLines={1}
            >
              {name.name}
            </Text>
            {!!detail.pronunciation && (
              <Text style={s.pronunciation}>/{detail.pronunciation}/</Text>
            )}
          </View>

          {/* Origin + trend row */}
          <View style={s.metaRow}>
            {!!detail.origin && (
              <View style={s.originPill}>
                <Text style={s.originPillText}>{detail.origin}</Text>
              </View>
            )}
            {!!detail.trendLabel && (
              <View style={s.trendPill}>
                <Text style={s.trendPillText}>{detail.trendLabel}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Meaning section — show a localized fallback for custom names without a meaning. */}
          {detail.meaning ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>{t('nameDetail.section.meaning')}</Text>
              <Text style={s.meaningText}>&ldquo;{detail.meaning}&rdquo;</Text>
            </View>
          ) : isCustomName(name) ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>{t('nameDetail.section.meaning')}</Text>
              <Text style={s.meaningText}>{t('name.meaning.notAvailableYet')}</Text>
            </View>
          ) : null}

          {/* Popularity section */}
          {detail.popularity.level > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>{t('nameDetail.section.popularity')}</Text>
              <View style={s.popularityRow}>
                <View style={s.popularityBar}>
                  <View
                    style={[
                      s.popularityFill,
                      { width: `${(detail.popularity.level / 5) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={s.popularityLabel}>{t(detail.popularity.key)}</Text>
              </View>
              {!!detail.rank && (
                <Text style={s.rankText}>{t('nameDetail.rank', { rank: detail.rank })}</Text>
              )}
            </View>
          )}

          {/* Character tags */}
          {detail.characterTags.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>{t('nameDetail.section.character')}</Text>
              <View style={s.tagsRow}>
                {detail.characterTags.map((tagKey) => (
                  <View key={tagKey} style={s.tag}>
                    <Text style={s.tagText}>{t(tagKey)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Similar names */}
          {detail.similarNames.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>{t('nameDetail.section.similar')}</Text>
              <View style={s.tagsRow}>
                {detail.similarNames.slice(0, 4).map((n) => (
                  <View key={n} style={s.similarTag}>
                    <Text style={s.similarTagText}>{n}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bottom spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IVORY,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: IVORY_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
  },
  // ── Hero ──
  heroArea: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  genderIndicator: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: SPACING.sm,
    opacity: 0.6,
  },
  heroName: {
    fontSize: 52,
    lineHeight: 60,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  pronunciation: {
    fontSize: FONTS.sizes.md,
    fontWeight: '400',
    color: TEXT_MUTED,
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
  // ── Meta row ──
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  originPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: ACCENT_SOFT,
  },
  originPillText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: ACCENT_FG,
    letterSpacing: 0.5,
  },
  trendPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.match.primary + '20',
  },
  trendPillText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: colors.match.text,
  },
  // ── Sections ──
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 2.5,
    marginBottom: SPACING.sm,
  },
  meaningText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '400',
    color: TEXT_PRIMARY,
    fontStyle: 'italic',
    lineHeight: FONTS.sizes.xl * 1.5,
  },
  // ── Popularity ──
  popularityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  popularityBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: BAR_TRACK,
    overflow: 'hidden',
  },
  popularityFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: BAR_FILL,
  },
  popularityLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    minWidth: 80,
  },
  rankText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginTop: 4,
  },
  // ── Tags ──
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: TAG_BG,
  },
  tagText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: TAG_FG,
  },
  similarTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.neutral.bgSoft,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  similarTagText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
});
