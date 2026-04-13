// ============================================================
// NameMatch – CountryScreen
//
// Onboarding step 2: pick your country.
// - Derives region from selected country → saved to Supabase (region_preference)
// - Saves country name to AsyncStorage (countryPreference via AppContext)
// - Navigates to PartnerConnect on continue
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../types';
import { COUNTRY_OPTIONS, findCountry, CountryOption } from '../data/countries';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Country'>;

export default function CountryScreen({ navigation }: Props) {
  const { updateProfile } = useAuth();
  const { setCountryPreference } = useApp();

  const [selected, setSelected] = useState<CountryOption | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter countries by search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Almost there!', 'Please select your country to continue.');
      return;
    }
    setIsLoading(true);
    try {
      // Persist region to Supabase (required for hasPreferences check in AppNavigator)
      await updateProfile({ region_preference: selected.region });
      // Persist country to AsyncStorage (country-weighted name engine)
      await setCountryPreference(selected.name);
      navigation.navigate('PartnerConnect');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CountryOption }) => {
    const isSelected = selected?.name === item.name;
    return (
      <TouchableOpacity
        style={[styles.countryRow, isSelected && styles.countryRowSelected]}
        onPress={() => setSelected(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>
          {item.name}
        </Text>
        {isSelected && (
          <View style={styles.checkDot}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Progress dots: step 2 of 3 */}
        <View style={styles.progress}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>Where are you{'\n'}from?</Text>
        <Text style={styles.subtitle}>
          We'll prioritise names that feel natural in your culture.
        </Text>

        {/* Search */}
        <View style={[styles.searchBox, SHADOWS.card]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
            placeholderTextColor={colors.neutral.border}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Country list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No countries found for "{query}"</Text>
          </View>
        }
      />

      {/* Footer: Continue button */}
      <View style={styles.footer}>
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
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.continueBtnText}>
                {selected ? `Continue with ${selected.flag} ${selected.name} →` : 'Select a country'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={async () => {
            // Skip: default to WORLDWIDE region with no country
            setIsLoading(true);
            try {
              await updateProfile({ region_preference: 'WORLDWIDE' });
              navigation.navigate('PartnerConnect');
            } catch {
              navigation.navigate('PartnerConnect');
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: SPACING.md,
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
    fontSize: 48,
    marginBottom: SPACING.sm,
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
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },

  // ── Search ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    width: '100%',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    paddingVertical: 0,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'transparent',
  },
  countryRowSelected: {
    backgroundColor: colors.onboarding.accent,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  countryNameSelected: {
    fontWeight: '700',
    color: colors.onboarding.primary,
  },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.onboarding.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginLeft: 56,
  },
  emptyState: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  continueBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  continueBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  skipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
