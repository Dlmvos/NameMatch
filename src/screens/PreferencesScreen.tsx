import React, { useState } from 'react';
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
import { RootStackParamList, GenderPreference } from '../types';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Preferences'>;

interface GenderOption {
  key: GenderPreference;
  emoji: string;
  label: string;
  description: string;
  color: string;
  lightColor: string;
}

const GENDER_OPTIONS: GenderOption[] = [
  {
    key: 'boy',
    emoji: '👦',
    label: "It's a Boy!",
    description: 'Show me boy names',
    color: COLORS.boy,
    lightColor: COLORS.boyLight,
  },
  {
    key: 'girl',
    emoji: '👧',
    label: "It's a Girl!",
    description: 'Show me girl names',
    color: COLORS.girl,
    lightColor: COLORS.girlLight,
  },
  {
    key: 'both',
    emoji: '✨',
    label: 'Surprise Us!',
    description: 'Show all names',
    color: COLORS.neutral,
    lightColor: COLORS.neutralLight,
  },
];

export default function PreferencesScreen({ navigation }: Props) {
  const { updateProfile } = useAuth();
  const [selected, setSelected] = useState<GenderPreference | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Almost there!', 'Please select a preference to continue.');
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile({ gender_preference: selected });
      navigation.navigate('Country');
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
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.emoji}>🍼</Text>
        <Text style={styles.title}>What are you{'\n'}expecting?</Text>
        <Text style={styles.subtitle}>
          We'll show you the most relevant names first. You can change this later.
        </Text>

        <View style={styles.options}>
          {GENDER_OPTIONS.map((opt) => {
            const isSelected = selected === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionCard,
                  SHADOWS.card,
                  isSelected && {
                    borderColor: opt.color,
                    borderWidth: 2.5,
                    backgroundColor: opt.lightColor,
                  },
                ]}
                onPress={() => setSelected(opt.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isSelected && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.description}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkmark, { backgroundColor: opt.color }]}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled, SHADOWS.button]}
          onPress={handleContinue}
          disabled={!selected || isLoading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={selected ? COLORS.gradientPink : [colors.neutral.border, colors.neutral.border]}
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
    paddingHorizontal: SPACING.xl,
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
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  options: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: SPACING.md,
  },
  optionEmoji: {
    fontSize: 36,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
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
    color: COLORS.textOnPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
});
