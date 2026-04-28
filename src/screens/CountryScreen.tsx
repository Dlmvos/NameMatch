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
  Switch,
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
import { useTranslation } from '../i18n/I18nProvider';
import { RootStackParamList } from '../types';
import { COUNTRY_OPTIONS, CountryOption } from '../data/countries';
import { getSuggestedLanguage } from '../services/languageService';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Country'>;

const countryToI18nKey = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export default function CountryScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { updateProfile } = useAuth();
  const { setCountryPreference, setResidenceCountry } = useApp();
  const isResidenceMode = route.params?.source === 'settingsResidence';
  const fromSettings = route.params?.source === 'settings' || isResidenceMode;

  const [selected, setSelected] = useState<CountryOption | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useAsResidenceCountry, setUseAsResidenceCountry] = useState(true);

  const localizedCountryLabel = (c: CountryOption): string => {
    const k = `country.${countryToI18nKey(c.name)}`;
    const tr = t(k);
    return tr === k ? c.name : tr;
  };

  // Filter countries by search query (match English + localized labels)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((c) => {
      const label = localizedCountryLabel(c).toLowerCase();
      return c.name.toLowerCase().includes(q) || label.includes(q);
    });
  }, [query, t]);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert(t('country.alert.selectTitle'), t('country.alert.selectBody'));
      return;
    }
    setIsLoading(true);
    try {
      if (isResidenceMode) {
        await setResidenceCountry(selected.name);
        navigation.goBack();
        return;
      }

      // Persist region to Supabase (required for hasPreferences check in AppNavigator)
      await updateProfile({ region_preference: selected.region });
      // Persist country to AsyncStorage (country-weighted name engine)
      await setCountryPreference(selected.name);
      if (!fromSettings && useAsResidenceCountry) {
        await setResidenceCountry(selected.name);
      }
      const deviceLanguage =
        Intl.DateTimeFormat().resolvedOptions().locale?.split(/[-_]/)[0] ?? 'en';
      const suggestedLanguage = getSuggestedLanguage(selected.name, deviceLanguage);
      if (__DEV__) {
        console.log('[CountryScreen] suggested language', {
          country: selected.name,
          deviceLanguage,
          suggestedLanguage,
        });
      }
      if (fromSettings) {
        navigation.goBack();
      } else {
        navigation.navigate('PartnerConnect');
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message ?? t('country.alert.genericError'));
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
          {localizedCountryLabel(item)}
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
        {!fromSettings && (
          <View style={styles.progress}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
        )}

        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>{t('country.title')}</Text>
        <Text style={styles.subtitle}>
          {t('country.subtitle')}
        </Text>

        {/* Search */}
        <View style={[styles.searchBox, SHADOWS.card]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('country.search')}
            placeholderTextColor={colors.neutral.border}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
        {!fromSettings && (
          <View style={styles.residenceRow}>
            <View style={styles.residenceCopy}>
              <Text style={styles.residenceTitle}>Use this as residence country</Text>
              <Text style={styles.residenceSubtitle}>Used for pricing and currency</Text>
            </View>
            <Switch
              value={useAsResidenceCountry}
              onValueChange={setUseAsResidenceCountry}
              trackColor={{ false: colors.neutral.border, true: colors.onboarding.secondary }}
              thumbColor={useAsResidenceCountry ? colors.onboarding.primary : colors.neutral.white}
            />
          </View>
        )}
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
            <Text style={styles.emptyText}>{t('country.emptySearch', { query })}</Text>
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
            colors={
              selected
                ? [colors.onboarding.primary, colors.onboarding.secondary]
                : [colors.neutral.border, colors.neutral.border]
            }
            style={styles.continueBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.continueBtnText}>
                {selected
                  ? t('country.continue.with', {
                      flag: selected.flag,
                      country: localizedCountryLabel(selected),
                    })
                  : t('country.continue.select')}
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
              if (fromSettings) {
                navigation.goBack();
              } else {
                navigation.navigate('PartnerConnect');
              }
            } catch {
              if (fromSettings) {
                navigation.goBack();
              } else {
                navigation.navigate('PartnerConnect');
              }
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <Text style={styles.skipText}>{t('country.skip')}</Text>
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
  residenceRow: {
    width: '100%',
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  residenceCopy: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  residenceTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  residenceSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
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
