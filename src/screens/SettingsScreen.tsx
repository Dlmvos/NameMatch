import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { REGION_OPTIONS, GenderPreference, Region } from '../types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { profile, signOut, updateProfile } = useAuth();
  const { room, leaveRoom } = useApp();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } catch (err: any) {
              Alert.alert('Error', err.message);
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure? You\'ll need a new code to reconnect with your partner.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Room',
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
      Alert.alert('Error', err.message);
    }
  };

  const handleRegionChange = async (region: Region) => {
    try {
      await updateProfile({ region_preference: region });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const currentRegionLabel = REGION_OPTIONS.find(
    (r) => r.key === profile?.region_preference
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, SHADOWS.card]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.display_name ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{profile?.display_name ?? 'Name not set'}</Text>
            <Text style={styles.profileSub}>
              {profile?.free_swipes_remaining ?? 0} free swipes remaining
            </Text>
          </View>
        </View>

        {/* Room section */}
        <SettingsSection title="Partner Room">
          {room ? (
            <>
              <SettingsRow
                icon="people"
                label="Room Code"
                value={room.code}
                onPress={() => {}}
              />
              <SettingsRow
                icon="wifi"
                label="Partner Status"
                value={room.user2_id ? '✅ Connected' : '⏳ Waiting'}
                onPress={() => navigation.navigate('PartnerConnect')}
              />
              <SettingsRow
                icon="exit-outline"
                label="Leave Room"
                value=""
                onPress={handleLeaveRoom}
                destructive
              />
            </>
          ) : (
            <SettingsRow
              icon="add-circle-outline"
              label="Connect with Partner"
              value=""
              onPress={() => navigation.navigate('PartnerConnect')}
            />
          )}
        </SettingsSection>

        {/* Preferences section */}
        <SettingsSection title="Name Preferences">
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="heart" size={18} color={colors.shortlist.primary} />
              </View>
              <Text style={styles.rowLabel}>Show Names For</Text>
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
            label="Region"
            value={`${currentRegionLabel?.emoji ?? ''} ${currentRegionLabel?.label ?? ''}`}
            onPress={() => navigation.navigate('Region')}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="notifications" size={18} color={colors.shortlist.primary} />
              </View>
              <Text style={styles.rowLabel}>Match Notifications</Text>
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
        <SettingsSection title="About">
          <SettingsRow icon="heart" label="Rate NameMatch" value="" onPress={() => Alert.alert('Coming soon', 'Add your App Store / Play Store link here once the app is published.')} />
          <SettingsRow icon="share-outline" label="Share with Friends" value="" onPress={() => Share.share({ message: 'Try NameMatch — the baby-name matching app for couples.' })} />
          <SettingsRow icon="document-text-outline" label="Privacy Policy" value="" onPress={() => Alert.alert('Privacy Policy', 'Add your privacy policy URL here.')} />
          <SettingsRow icon="help-circle-outline" label="Help & Support" value="" onPress={() => Alert.alert('Help & Support', 'Add your support email or support page here.')} />
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="information-circle" size={18} color={colors.shortlist.primary} />
              </View>
              <Text style={styles.rowLabel}>Version</Text>
            </View>
            <Text style={styles.rowValue}>1.0.0</Text>
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
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Made with 💕 for expecting parents</Text>
      </ScrollView>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  destructive?: boolean;
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
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
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
    borderColor: COLORS.primary,
    backgroundColor: colors.onboarding.background,
  },
  genderBtnText: {
    fontSize: 18,
  },
  genderBtnTextActive: {},
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
  footer: {
    textAlign: 'center',
    color: colors.onboarding.text,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xl,
  },
});
