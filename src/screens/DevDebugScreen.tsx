import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useRoomState } from '../context/RoomContext';
import { PurchaseService } from '../services/purchaseService';
import { colors, FONTS, RADIUS, SPACING } from '../theme';

/** Dev-only diagnostics; never reachable when __DEV__ is false. */
export default function DevDebugScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const { effectiveLanguage, countryPreference, residenceCountry, effectiveUnlockedPacks } = useApp();
  const { room } = useRoomState();

  const [rcBusy, setRcBusy] = useState(false);
  const [rcError, setRcError] = useState<string | null>(null);
  const [rcEntitled, setRcEntitled] = useState<boolean | null>(null);
  const [rcActiveEntitlements, setRcActiveEntitlements] = useState<string>('—');

  const loadRc = useCallback(() => {
    if (!__DEV__) return;
    setRcBusy(true);
    setRcError(null);
    PurchaseService.configure();
    PurchaseService.getCustomerInfo()
      .then((info) => {
        setRcEntitled(PurchaseService.hasPremiumEntitlement(info));
        const keys = Object.keys(info.entitlements.active ?? {});
        setRcActiveEntitlements(keys.length ? keys.sort().join(', ') : '(none)');
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        setRcEntitled(null);
        setRcActiveEntitlements('—');
        setRcError(msg);
      })
      .finally(() => setRcBusy(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRc();
    }, [loadRc]),
  );

  if (!__DEV__) return null;

  const hasCompletedOnboarding = !!(
    profile?.gender_preference &&
    profile?.region_preference &&
    profile?.country_preference
  );
  const hasRoom = !!profile?.room_id;
  const onboardingPhase = !hasCompletedOnboarding
    ? 'onboarding (prefs incomplete)'
    : !hasRoom
      ? 'partner (no room)'
      : 'main';

  const rows: { label: string; value: string }[] = [
    {
      label: 'Auth uid',
      value: user?.id ?? '(signed out)',
    },
    {
      label: 'Auth email',
      value: user?.email?.trim() || '(none)',
    },
    {
      label: 'Profile purchased_packs',
      value:
        profile?.purchased_packs?.length ? profile.purchased_packs.join(', ') : '(empty)',
    },
    {
      label: 'Room premium_packs',
      value: room?.premium_packs?.length ? room.premium_packs.join(', ') : '(none / no room)',
    },
    {
      label: 'Effective unlocked packs',
      value: effectiveUnlockedPacks.length ? effectiveUnlockedPacks.join(', ') : '(empty)',
    },
    {
      label: 'RevenueCat premium_couple',
      value:
        rcBusy ? 'loading…' : rcEntitled === null ? rcError ?? 'unknown' : rcEntitled ? 'active' : 'inactive',
    },
    {
      label: 'RC active entitlements',
      value: rcActiveEntitlements,
    },
    {
      label: 'App effectiveLanguage',
      value: effectiveLanguage || '(fallback)',
    },
    {
      label: 'Profile language_preference',
      value: profile?.language_preference?.trim() || '(unset)',
    },
    {
      label: 'Country (deck weighting)',
      value: countryPreference?.trim() || '(unset)',
    },
    {
      label: 'Residence country',
      value: residenceCountry?.trim() || '(unset)',
    },
    {
      label: 'Onboarding',
      value: onboardingPhase,
    },
    {
      label: 'Prefs detail',
      value: [
        `gender=${profile?.gender_preference ?? '—'}`,
        `region=${profile?.region_preference ?? '—'}`,
        `country_pref=${profile?.country_preference ?? '—'}`,
      ].join(' · '),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.onboarding.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Dev session</Text>
        <TouchableOpacity
          onPress={loadRc}
          disabled={rcBusy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {rcBusy ? (
            <ActivityIndicator size="small" color={colors.onboarding.text} />
          ) : (
            <Ionicons name="refresh" size={22} color={colors.onboarding.text} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rows.map(({ label, value }) => (
          <View key={label} style={styles.card}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value} selectable>
              {value}
            </Text>
          </View>
        ))}
        <Text style={styles.footer}>__DEV__ only — not bundled for production QA without dev client.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.bgSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: colors.onboarding.text,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: colors.neutral.textBody,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: colors.neutral.textDark,
    lineHeight: 22,
  },
  footer: {
    marginTop: SPACING.md,
    fontSize: 12,
    color: colors.neutral.gray,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
});
