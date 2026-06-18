import React, { useRef, useState } from 'react';
import { colors } from '../theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Linking,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  setPaywallScreenshotMode,
  usePaywallScreenshotMode,
} from '../lib/paywallScreenshotMode';
import { REGION_OPTIONS, GenderPreference, Region, RootStackParamList } from '../types';
import { SUPPORTED_LANGUAGE_OPTIONS } from '../services/languageService';
import { useTranslation } from '../i18n/I18nProvider';
import { translateCountryName } from '../i18n/display';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoomActions, useRoomState } from '../context/RoomContext';
import { useSwipeDeckActions } from '../context/SwipeDeckContext';
import { supabase } from '../lib/supabase';

const PRIVACY_POLICY_URL = 'https://babinom.com/privacy/';
const TERMS_OF_SERVICE_URL = 'https://babinom.com/terms/';
const AI_DISCLAIMER_URL = 'https://babinom.com/ai-disclaimer/';
const SUPPORT_URL = 'https://babinom.com/support/';

export default function SettingsScreen() {
  const { t, language } = useTranslation();
  const tr = t;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // __DEV__ only — toggled below in the About section. Forces the paywall to
  // render with the localised "price unavailable" fallback so the App Store
  // Connect Review Information Screenshot can be captured without prices.
  const paywallScreenshotMode = usePaywallScreenshotMode();
  const { session, user, profile, signOut, updateProfile, restorePurchases, deleteAccount } =
    useAuth();
  const { room } = useRoomState();
  const { leaveRoom } = useRoomActions();
  const {
    languagePreference,
    setLanguagePreference,
    effectiveLanguage,
    countryPreference,
    residenceCountry,
    refreshUnlockedPacks,
    effectiveUnlockedPacks,
  } = useApp();
  const hasUnlockedPacks = effectiveUnlockedPacks.length > 0;
  const { loadMoreNames } = useSwipeDeckActions();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const passwordResetInFlightRef = useRef(false);

  const accountEmail = String(session?.user?.email ?? '').trim();

  const handlePasswordReset = async () => {
    if (!accountEmail) {
      Alert.alert(tr('common.error'), tr('settings.passwordResetNoEmail'));
      return;
    }
    if (passwordResetInFlightRef.current) return;
    passwordResetInFlightRef.current = true;
    try {
      const redirectTo = process.env.EXPO_PUBLIC_AUTH_PASSWORD_RESET_REDIRECT_URL?.trim();
      const { error } = await supabase.auth.resetPasswordForEmail(
        accountEmail,
        redirectTo ? { redirectTo } : {},
      );
      if (error) throw error;
      Alert.alert(tr('settings.passwordResetSuccessTitle'), tr('settings.passwordResetSuccessBody'));
    } catch (err: any) {
      Alert.alert(tr('common.error'), err?.message ?? tr('settings.passwordResetError'));
    } finally {
      passwordResetInFlightRef.current = false;
    }
  };

  const handleDeleteAccountPress = () => {
    setDeleteModalVisible(true);
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setDeleteModalVisible(false);
    } catch (err: any) {
      Alert.alert(tr('common.error'), err?.message ?? tr('common.error'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      tr('settings.signOut'),
      tr('settings.signOutConfirm'),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } catch (err: any) {
              Alert.alert(tr('common.error'), err.message);
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      tr('settings.leaveRoom'),
      tr('settings.leaveRoomConfirm'),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('settings.leaveRoom'),
          style: 'destructive',
          onPress: leaveRoom,
        },
      ]
    );
  };

  const handleGenderChange = async (pref: GenderPreference) => {
    try {
      await updateProfile({ gender_preference: pref });
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message);
    }
  };

  const handleRegionChange = async (region: Region) => {
    try {
      await updateProfile({ region_preference: region });
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const restored = await restorePurchases();
      await refreshUnlockedPacks();
      loadMoreNames();
      if (restored) {
        Alert.alert(tr('shop.restoreReadyTitle'), tr('shop.restoreReadyBody'));
      } else {
        Alert.alert(tr('shop.restoreNoneTitle'), tr('shop.restoreNoneBody'));
      }
    } catch (err: any) {
      Alert.alert(tr('common.error'), err?.message ?? tr('settings.restorePurchasesError'));
    }
  };

  const openExternalUrl = (url: string) => {
    const separator = url.includes('?') ? '&' : '?';
    const localizedUrl = `${url}${separator}lang=${language}`;
    Linking.openURL(localizedUrl).catch((err: any) => {
      Alert.alert(tr('common.error'), err?.message ?? url);
    });
  };

  const currentRegionLabel = REGION_OPTIONS.find(
    (r) => r.key === profile?.region_preference
  );
  const getTranslated = (key: string, fallback: string): string => {
    const translated = tr(key);
    return translated === key ? fallback : translated;
  };
  const translatedRegion = profile?.region_preference
    ? getTranslated(
        profile.region_preference === 'LATIN_AMERICA'
          ? 'region.latinAmerica'
          : `region.${profile.region_preference.toLowerCase()}`,
        currentRegionLabel?.label ?? profile.region_preference
      )
    : '';
  const translatedCountry = countryPreference
    ? translateCountryName(tr, countryPreference, countryPreference)
    : tr('settings.notSet');
  const translatedResidenceCountry = residenceCountry
    ? translateCountryName(tr, residenceCountry, residenceCountry)
    : tr('settings.notSet');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{tr('settings.title')}</Text>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, SHADOWS.card]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.display_name ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{profile?.display_name ?? tr('settings.nameNotSet')}</Text>
            <Text style={styles.profileSub}>
              {hasUnlockedPacks
                ? tr('swipe.header.unlimited')
                : tr('settings.freeSwipesRemaining', { count: profile?.free_swipes_remaining ?? 0 })}
            </Text>
          </View>
        </View>

        <SettingsSection title={tr('settings.section.account')}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="mail-outline" size={18} color={colors.shortlist.primary} />
              </View>
              <View style={styles.accountTextCol}>
                <Text style={styles.rowSubLabel}>{tr('settings.account.emailLabel')}</Text>
                <Text style={styles.accountEmailValue} selectable>
                  {accountEmail ? accountEmail : tr('settings.notSet')}
                </Text>
              </View>
            </View>
          </View>
          {__DEV__ && user?.id ? (
            <View style={styles.settingsRow}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="finger-print-outline" size={18} color={colors.shortlist.primary} />
                </View>
                <View style={styles.accountTextCol}>
                  <Text style={styles.rowSubLabel}>{tr('settings.account.userIdLabel')}</Text>
                  <Text style={styles.accountDevUserId} selectable>
                    {user.id}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
          <SettingsRow
            icon="key-outline"
            label={tr('settings.passwordReset')}
            value=""
            onPress={handlePasswordReset}
          />
        </SettingsSection>

        {/* Room section */}
        <SettingsSection title={tr('settings.partnerRoom')}>
          {room ? (
            <>
              <SettingsRow
                icon="people"
                label={tr('settings.roomCode')}
                value={room.code}
                onPress={() => navigation.navigate('RoomManagement')}
                showChevron={false}
              />
              <SettingsRow
                icon="wifi"
                label={tr('settings.partnerStatus')}
                value={room.user2_id ? tr('settings.partnerConnected') : tr('settings.partnerWaiting')}
                onPress={() => navigation.navigate('PartnerConnect')}
              />
              <SettingsRow
                icon="exit-outline"
                label={tr('settings.leaveRoom')}
                value=""
                onPress={handleLeaveRoom}
                destructive
              />
            </>
          ) : (
            <SettingsRow
              icon="add-circle-outline"
              label={tr('settings.connectPartner')}
              value=""
              onPress={() => navigation.navigate('PartnerConnect')}
            />
          )}
        </SettingsSection>

        {/* Preferences section */}
        <SettingsSection title={tr('settings.namePreferences')}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="heart" size={18} color={colors.shortlist.primary} />
              </View>
              <Text style={styles.rowLabel}>{tr('settings.showNamesFor')}</Text>
            </View>
            <View style={styles.genderPicker}>
              {(['boy', 'girl', 'both'] as GenderPreference[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    profile?.gender_preference === g && styles.genderBtnActive,
                  ]}
                  onPress={() => handleGenderChange(g)}
                >
                  <Text
                    style={[
                      styles.genderBtnText,
                      profile?.gender_preference === g && styles.genderBtnTextActive,
                    ]}
                  >
                    {g === 'boy' ? '💙' : g === 'girl' ? '💗' : '✨'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <SettingsRow
            icon="globe-outline"
            label={tr('settings.region')}
            value={`${currentRegionLabel?.emoji ?? ''} ${translatedRegion}`}
            onPress={() => navigation.navigate('Region')}
          />
          <SettingsRow
            icon="flag-outline"
            label={tr('settings.country')}
            value={translatedCountry}
            onPress={() => navigation.navigate('Country', { source: 'settings' })}
          />
          <SettingsRow
            icon="card-outline"
            label={tr('settings.residenceCountry')}
            value={translatedResidenceCountry}
            onPress={() => navigation.navigate('Country', { source: 'settingsResidence' })}
          />
        </SettingsSection>

        <SettingsSection title={tr('settings.section.language')}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="language-outline" size={18} color={colors.shortlist.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>{tr('settings.language.app')}</Text>
                <Text style={styles.rowSubLabel}>
                  {tr('settings.activeLanguage', { code: effectiveLanguage.toUpperCase() })}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.languagePicker}>
            <TouchableOpacity
              style={[
                styles.languageBtn,
                !languagePreference && styles.languageBtnActive,
              ]}
              onPress={() => setLanguagePreference(null)}
            >
              <Text
                style={[
                  styles.languageBtnText,
                  !languagePreference && styles.languageBtnTextActive,
                ]}
              >
                {tr('settings.language.auto')}
              </Text>
            </TouchableOpacity>
            {SUPPORTED_LANGUAGE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.code}
                style={[
                  styles.languageBtn,
                  languagePreference === opt.code && styles.languageBtnActive,
                ]}
                onPress={() => setLanguagePreference(opt.code)}
              >
                <Text
                  style={[
                    styles.languageBtnText,
                    languagePreference === opt.code && styles.languageBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title={tr('settings.notifications')}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="notifications" size={18} color={colors.shortlist.primary} />
              </View>
              <Text style={styles.rowLabel}>{tr('settings.matchNotifications')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.neutral.border, true: colors.shortlist.secondary }}
              thumbColor={notificationsEnabled ? colors.shortlist.primary : colors.shortlist.secondary}
            />
          </View>
        </SettingsSection>

        {/* About */}
        <SettingsSection title={tr('settings.about')}>
          {__DEV__ ? (
            <SettingsRow
              icon="analytics-outline"
              label="Dev Analytics"
              value=""
              onPress={() =>
                navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate(
                  'DevAnalytics',
                )
              }
            />
          ) : null}
          {__DEV__ ? (
            <View style={styles.settingsRow}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="camera-outline" size={18} color={colors.shortlist.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Storefront screenshot mode</Text>
                  <Text style={styles.rowSubLabel}>
                    Hides live prices on the Paywall and Shop so the App Store Connect IAP review screenshot can be captured cleanly. Dev builds only.
                  </Text>
                </View>
              </View>
              <Switch
                value={paywallScreenshotMode}
                onValueChange={(v) => {
                  void setPaywallScreenshotMode(v);
                }}
                trackColor={{ false: colors.neutral.border, true: colors.shortlist.secondary }}
                thumbColor={paywallScreenshotMode ? colors.shortlist.primary : colors.shortlist.secondary}
              />
            </View>
          ) : null}
          <SettingsRow
            icon="refresh-circle-outline"
            label={tr('settings.restorePurchases')}
            value=""
            onPress={handleRestorePurchases}
          />
          <SettingsRow icon="heart" label={tr('settings.rate')} value="" onPress={() => Alert.alert(tr('common.comingSoon'), tr('settings.rateComingSoon'))} />
          <SettingsRow icon="share-outline" label={tr('settings.shareWithFriends')} value="" onPress={() => Share.share({ message: tr('settings.shareAppMessage') })} />
          <SettingsRow icon="document-text-outline" label={tr('settings.privacyPolicy')} value="" onPress={() => openExternalUrl(PRIVACY_POLICY_URL)} />
          <SettingsRow icon="reader-outline" label={tr('settings.termsOfService')} value="" onPress={() => openExternalUrl(TERMS_OF_SERVICE_URL)} />
          <SettingsRow icon="sparkles-outline" label={tr('settings.aiDisclaimer')} value="" onPress={() => openExternalUrl(AI_DISCLAIMER_URL)} />
          <SettingsRow icon="help-circle-outline" label={tr('settings.helpSupport')} value="" onPress={() => openExternalUrl(SUPPORT_URL)} />
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="information-circle" size={18} color={colors.shortlist.primary} />
              </View>
              <Text style={styles.rowLabel}>{tr('settings.version')}</Text>
            </View>
            <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? ''}</Text>
          </View>
        </SettingsSection>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, SHADOWS.card]}
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.skip} />
          <Text style={styles.signOutText}>
            {isSigningOut ? tr('settings.signingOut') : tr('settings.signOut')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteAccountBtn, SHADOWS.card]}
          onPress={handleDeleteAccountPress}
          disabled={isSigningOut || isDeletingAccount}
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={20} color={colors.neutral.white} />
          <Text style={styles.deleteAccountText}>{tr('settings.deleteAccount')}</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>{tr('settings.footerMadeWithLove')}</Text>
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeletingAccount) setDeleteModalVisible(false);
        }}
      >
        <View style={styles.deleteModalRoot}>
          <Pressable
            style={styles.deleteModalBackdrop}
            onPress={() => {
              if (!isDeletingAccount) setDeleteModalVisible(false);
            }}
          />
          <View
            style={[
              styles.deleteModalCard,
              SHADOWS.card,
              { paddingBottom: Math.max(insets.bottom, SPACING.md) },
            ]}
          >
            <Text style={styles.deleteModalTitle}>{tr('settings.deleteAccountConfirmTitle')}</Text>
            <Text style={styles.deleteModalBody}>{tr('settings.deleteAccountConfirmBody')}</Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalCancelBtn, SHADOWS.card]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeletingAccount}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteModalCancelText}>{tr('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalConfirmBtn, isDeletingAccount && styles.deleteModalConfirmDisabled]}
                onPress={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                activeOpacity={0.85}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color={colors.neutral.white} />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>{tr('settings.deleteAccountConfirmAction')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={[styles.sectionCard, SHADOWS.card]}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  showChevron = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  destructive?: boolean;
  /**
   * Whether to render the right-pointing chevron affordance.
   * Defaults to true (the original behavior). Pass false for rows
   * that display info but don't usefully navigate or open a sheet
   * (e.g. the Room Code row — see Daan's feedback 2026-06-16, the
   * chevron implied tappability that didn't materialise).
   */
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? COLORS.skip : colors.shortlist.primary}
          />
        </View>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {showChevron ? (
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: colors.onboarding.text,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.xl,
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.onboarding.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: colors.onboarding.text,
  },
  profileName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: colors.onboarding.text,
  },
  profileSub: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.onboarding.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.onboarding.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: colors.onboarding.background,
  },
  rowLabel: {
    fontSize: FONTS.sizes.md,
    color: colors.onboarding.text,
    fontWeight: '500',
  },
  rowLabelDestructive: {
    color: colors.onboarding.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rowValue: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    fontWeight: '500',
  },
  genderPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  genderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.onboarding.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderBtnActive: {
    borderColor: colors.shortlist.primary,
    backgroundColor: colors.onboarding.background,
  },
  genderBtnText: {
    fontSize: 18,
  },
  genderBtnTextActive: {},
  rowSubLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  accountTextCol: {
    flex: 1,
    gap: 2,
  },
  accountEmailValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: colors.onboarding.text,
  },
  accountDevUserId: {
    fontSize: FONTS.sizes.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS.textMuted,
  },
  languagePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  languageBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: colors.onboarding.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  languageBtnActive: {
    borderColor: colors.shortlist.primary,
    backgroundColor: colors.onboarding.accent,
  },
  languageBtnText: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    fontWeight: '500',
  },
  languageBtnTextActive: {
    color: colors.shortlist.primary,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.xl,
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.skip + '44',
  },
  signOutText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: colors.onboarding.text,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    backgroundColor: COLORS.skip,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.skip,
  },
  deleteAccountText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  deleteModalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  deleteModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(47, 58, 68, 0.45)',
  },
  deleteModalCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    zIndex: 1,
    elevation: 8,
  },
  deleteModalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: colors.onboarding.text,
    marginBottom: SPACING.sm,
  },
  deleteModalBody: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  deleteModalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: colors.onboarding.background,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  deleteModalCancelText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: colors.onboarding.text,
  },
  deleteModalConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.skip,
  },
  deleteModalConfirmDisabled: {
    opacity: 0.65,
  },
  deleteModalConfirmText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: colors.neutral.white,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: colors.onboarding.text,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xl,
  },
});
