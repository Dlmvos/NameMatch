import React, { useState } from 'react';
import { colors } from '../theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';
import { RootStackParamList, Region, REGION_OPTIONS } from '../types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Region'>;

function regionLabelKey(key: Region): string {
  return key === 'LATIN_AMERICA' ? 'region.latinAmerica' : `region.${key.toLowerCase()}`;
}

function regionDescKey(key: Region): string {
  return key === 'LATIN_AMERICA' ? 'region.desc.latinAmerica' : `region.desc.${key.toLowerCase()}`;
}

export default function RegionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { updateProfile } = useAuth();
  const [selected, setSelected] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getTranslated = (translationKey: string, fallback: string): string => {
    const translated = t(translationKey);
    return translated === translationKey ? fallback : translated;
  };

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert(t('region.alert.selectTitle'), t('region.alert.selectBody'));
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile({ region_preference: selected });
      navigation.navigate('PartnerConnect');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message ?? t('region.alert.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>{t('region.cancel')}</Text>
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={styles.progress}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>{t('region.title')}</Text>
        <Text style={styles.subtitle}>
          {t('region.subtitle')}
        </Text>

        <View style={styles.grid}>
          {REGION_OPTIONS.map((opt) => {
            const isSelected = selected === opt.key;
            const label = getTranslated(regionLabelKey(opt.key), opt.label);
            const description = getTranslated(regionDescKey(opt.key), opt.description);
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.regionCard,
                  SHADOWS.card,
                  isSelected && styles.regionCardSelected,
                ]}
                onPress={() => setSelected(opt.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.regionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.regionLabel, isSelected && styles.regionLabelSelected]}>
                  {label}
                </Text>
                <Text style={styles.regionDesc} numberOfLines={2}>
                  {description}
                </Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Free tier note */}
        <View style={styles.freeNote}>
          <Text style={styles.freeNoteText}>
            {t('region.freeNote')}
          </Text>
        </View>

        <View style={[styles.premiumPreview, SHADOWS.card]}>
          <Text style={styles.premiumPreviewTitle}>
            Unlock more names, deeper meanings, and smarter matches
          </Text>
          <View style={styles.lockedNameRow}>
            {['Aurelia', 'Mateo', 'Noor'].map((name) => (
              <View key={name} style={styles.lockedNameCard}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockedNameText}>{name}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.premiumPreviewCta}
            onPress={() => navigation.navigate('Paywall')}
            activeOpacity={0.85}
          >
            <Text style={styles.premiumPreviewCtaText}>See Premium</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled, SHADOWS.button]}
          onPress={handleContinue}
          disabled={!selected || isLoading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={selected ? [colors.onboarding.primary, colors.onboarding.secondary] : [colors.neutral.border, colors.neutral.border]}
            style={styles.continueBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueBtnText}>
              {isLoading ? t('region.saving') : t('region.continue')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 64,
    paddingBottom: SPACING.xxl,
  },
  topRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cancelBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  cancelBtnText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onboarding.background,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.onboarding.background,
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: colors.onboarding.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: colors.onboarding.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  regionCard: {
    width: '46%',
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 130,
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  regionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: colors.onboarding.background,
  },
  regionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  regionLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: colors.onboarding.text,
    textAlign: 'center',
  },
  regionLabelSelected: {
    color: colors.onboarding.text,
  },
  regionDesc: {
    fontSize: FONTS.sizes.xs,
    color: colors.onboarding.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.onboarding.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: colors.onboarding.text,
    fontSize: 12,
    fontWeight: '800',
  },
  freeNote: {
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  freeNoteText: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  premiumPreview: {
    width: '100%',
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  premiumPreviewTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: colors.onboarding.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockedNameRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  lockedNameCard: {
    flex: 1,
    minHeight: 58,
    borderRadius: RADIUS.md,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.72,
  },
  lockIcon: {
    fontSize: 13,
    marginBottom: 2,
  },
  lockedNameText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: colors.onboarding.text,
  },
  premiumPreviewCta: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  premiumPreviewCtaText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: colors.onboarding.primary,
  },
  continueBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  continueBtnText: {
    color: colors.onboarding.text,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
});
