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
import { RootStackParamList, Region, REGION_OPTIONS } from '../types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Region'>;

export default function RegionScreen({ navigation }: Props) {
  const { updateProfile } = useAuth();
  const [selected, setSelected] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Almost there!', 'Please select a region to continue.');
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile({ region_preference: selected });
      navigation.navigate('PartnerConnect');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Progress dots */}
        <View style={styles.progress}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>Where's your{'\n'}heart from?</Text>
        <Text style={styles.subtitle}>
          Pick the region of names that speaks to you.{'\n'}You can unlock more in the Shop.
        </Text>

        <View style={styles.grid}>
          {REGION_OPTIONS.map((opt) => {
            const isSelected = selected === opt.key;
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
                  {opt.label}
                </Text>
                <Text style={styles.regionDesc} numberOfLines={2}>
                  {opt.description}
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
            🎁 Start with 100 free swipes from your chosen region
          </Text>
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
              {isLoading ? 'Saving...' : 'Continue →'}
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
