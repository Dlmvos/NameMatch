import React, { useState, useRef, useEffect, useCallback } from 'react';
import { colors } from '../theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Share,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { useRoomActions, useRoomState } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';
import { createRoomJoinPayload } from '../lib/roomJoinPayload';
import { AnalyticsService } from '../services/AnalyticsService';
import { RootStackParamList } from '../types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PartnerConnect'>;

type Tab = 'create' | 'join';
const DEV_SCREENSHOT_ROOM_CODE = 'NEST24';

export default function PartnerConnectScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { room } = useRoomState();
  const { createRoom, joinRoom } = useRoomActions();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDevConnectedState, setShowDevConnectedState] = useState(false);
  // Derive effective code: prefer room context (survives unmount/remount), fall back to local state.
  const effectiveCode = room?.code ?? roomCode;
  const isConnected = !!(room?.user1_id && room?.user2_id) || (__DEV__ && showDevConnectedState);
  const normalizedJoinCode = joinCode.trim().toUpperCase();
  const isJoinCodeComplete = normalizedJoinCode.length === 6;

  const hasCompletedOnboarding = !!(
    profile?.gender_preference &&
    profile?.region_preference &&
    profile?.country_preference
  );

  const navigateToSoloSwipeHome = () => {
    if (!hasCompletedOnboarding) {
      navigation.navigate('Preferences');
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Swipe' });
  };

  const joinPayload = effectiveCode
    ? createRoomJoinPayload(effectiveCode)
    : '';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const inviteQrViewLogged = useRef(false);

  useEffect(() => {
    if (!effectiveCode) inviteQrViewLogged.current = false;
  }, [effectiveCode]);

  const onInviteQrLayout = useCallback(() => {
    if (inviteQrViewLogged.current || !effectiveCode || isConnected) return;
    inviteQrViewLogged.current = true;
    AnalyticsService.track('invite_qr_view', { room_code_length: effectiveCode.length });
  }, [effectiveCode, isConnected]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    // Only reset local state when the screen is focused and there's no room.
    // If room exists, the code is derived from room.code — no reset needed.
    if (!isFocused || room) return;
    setRoomCode('');
    setIsLoading(false);
  }, [isFocused, room]);

  const handleCreateRoom = async () => {
    if (effectiveCode) {
      // Already created — share it
      handleShare();
      return;
    }
    setIsLoading(true);
    try {
      const code = await createRoom();
      setRoomCode(code);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message ?? t('partner.error.createRoom'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (effectiveCode) {
      AnalyticsService.track('invite_share_tap', { room_code_length: effectiveCode.length });
    }
    try {
      await Share.share({
        message: t('partner.share.message', {
          code: effectiveCode,
          url: createRoomJoinPayload(effectiveCode),
        }),
        title: t('partner.share.title'),
      });
    } catch (err) {
      // Share.share rejects on user cancel as well as on real errors; log in
      // dev so genuine failures (no share targets, OS misconfigured) surface
      // instead of being swallowed silently.
      if (__DEV__) console.warn('[PartnerConnectScreen] share failed', err);
    }
  };

  const handleJoinRoom = async () => {
    const raw = normalizedJoinCode;
    if (__DEV__) {
      console.log('[PartnerConnectScreen] join pressed', {
        rawJoinCode: joinCode,
        normalizedCode: raw,
        codeLength: raw.length,
        userId: user?.id ?? null,
        isJoining: isLoading,
      });
    }
    // Room codes are generated from: [A-HJ-NP-Z2-9] (no I/O; digits 2-9) and are always 6 chars.
    if (!raw || raw.length !== 6 || !/^[A-HJ-NP-Z2-9]{6}$/.test(raw)) {
      Alert.alert(t('partner.error.invalidCodeTitle'), t('partner.error.invalidCodeBody'));
      return;
    }
    setIsLoading(true);
    try {
      await joinRoom(raw);
      // Navigation handled by AppNavigator
    } catch (err: any) {
      Alert.alert(t('partner.error.joinTitle'), err.message ?? t('partner.error.joinBody'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setJoinCode('');
    setRoomCode('');
    setIsLoading(false);
    setActiveTab('create');
    navigateToSoloSwipeHome();
  };

  const handleStartSwiping = () => {
    navigateToSoloSwipeHome();
  };

  return (
    <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <Text style={styles.emoji}>💑</Text>
          <Text style={styles.title}>{t('partner.title')}</Text>
          <Text style={styles.subtitle}>
            {t('partner.subtitle')}
          </Text>
        </Animated.View>

        {isConnected ? (
          <View style={styles.panel}>
            <View style={[styles.connectedCard, SHADOWS.card]}>
              <Text style={styles.connectedEmoji}>🎉</Text>
              <Text style={styles.connectedTitle}>{t('partner.connected.title')}</Text>
              <Text style={styles.connectedText}>
                {t('partner.connected.text.primary')}
              </Text>
              <Text style={styles.connectedText}>
                {t('partner.connected.text.secondary')}
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, SHADOWS.button]}
                onPress={handleStartSwiping}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.onboarding.primary, colors.onboarding.secondary]}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryBtnText}>{t('partner.connected.cta')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                onPress={() => setActiveTab('create')}
              >
                <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                  {t('partner.tab.create')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'join' && styles.tabActive]}
                onPress={() => setActiveTab('join')}
              >
                <Text style={[styles.tabText, activeTab === 'join' && styles.tabTextActive]}>
                  {t('partner.tab.join')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Create Room Panel */}
            {activeTab === 'create' && (
              <View style={styles.panel}>
            {!effectiveCode ? (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    {t('partner.info.create')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, SHADOWS.button]}
                  onPress={handleCreateRoom}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.onboarding.primary, colors.onboarding.secondary]}
                    style={styles.primaryBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="add-circle-outline" size={22} color={colors.neutral.white} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>
                      {isLoading ? t('partner.create.loading') : t('partner.create.cta')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                {__DEV__ ? (
                  <View style={styles.devDemoRow}>
                    <TouchableOpacity
                      style={styles.devDemoCodeBtn}
                      onPress={() => setRoomCode(DEV_SCREENSHOT_ROOM_CODE)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.devDemoCodeText}>Demo invite code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.devDemoCodeBtn}
                      onPress={() => setShowDevConnectedState(true)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.devDemoCodeText}>Connected state</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.codeLabel}>{t('partner.code.label')}</Text>
                <View style={[styles.codeDisplay, SHADOWS.card]}>
                  <Text style={styles.codeText}>{effectiveCode}</Text>
                </View>
                <Text style={styles.codeHint}>
                  {t('partner.code.hint')}
                </Text>

                <View style={[styles.qrCard, SHADOWS.card]} onLayout={onInviteQrLayout}>
                  <QRCode value={joinPayload} size={170} />
                  <Text style={styles.qrHint}>{t('partner.qr.hint')}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.shareBtn, SHADOWS.button]}
                  onPress={handleShare}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.onboarding.primary, colors.onboarding.secondary]}
                    style={styles.primaryBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="share-outline" size={22} color={colors.neutral.white} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>{t('partner.share')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipText}>{t('partner.solo')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
            )}

            {/* Join Room Panel */}
            {activeTab === 'join' && (
              <View style={styles.panel}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {t('partner.info.join')}
              </Text>
            </View>

            <View style={styles.codeInputWrapper}>
              <TextInput
                style={styles.codeInput}
                placeholder={t('partner.join.placeholder')}
                placeholderTextColor={COLORS.textMuted}
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="join"
                onSubmitEditing={handleJoinRoom}
              />
            </View>

            {/* Letter count dots */}
            <View style={styles.codeDots}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.codeDot,
                    i < normalizedJoinCode.length && styles.codeDotFilled,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                SHADOWS.button,
                !isJoinCodeComplete && { opacity: 0.6 },
              ]}
              onPress={handleJoinRoom}
              disabled={isLoading || !isJoinCodeComplete}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.swipe.like, colors.onboarding.primary]}
                style={styles.primaryBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="enter-outline" size={22} color={colors.neutral.white} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>
                  {isLoading ? t('partner.join.loading') : t('partner.join.cta')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
            )}

            {/* Skip for now */}
            {activeTab === 'create' && !effectiveCode && (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>{t('partner.skip')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
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
    backgroundColor: colors.neutral.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.onboarding.primary,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
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
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.bgSoft,
    borderRadius: RADIUS.lg,
    padding: 4,
    width: '100%',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: colors.neutral.white,
    ...SHADOWS.card,
  },
  tabText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: colors.neutral.gray,
  },
  tabTextActive: {
    color: colors.onboarding.primary,
    fontWeight: '700',
  },
  panel: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.md,
  },
  connectedCard: {
    width: '100%',
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  connectedEmoji: {
    fontSize: 56,
  },
  connectedTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: colors.onboarding.text,
    textAlign: 'center',
  },
  connectedText: {
    fontSize: FONTS.sizes.md,
    color: colors.onboarding.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: '100%',
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.onboarding.text,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  codeLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: colors.onboarding.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeDisplay: {
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  codeText: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.onboarding.text,
    letterSpacing: 10,
  },
  codeHint: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    textAlign: 'center',
  },
  shareBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  devDemoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  devDemoCodeBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: colors.neutral.bgSoft,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  devDemoCodeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: colors.onboarding.text,
  },
  qrCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  qrHint: {
    fontSize: FONTS.sizes.xs,
    color: colors.onboarding.text,
    textAlign: 'center',
  },
  codeInputWrapper: {
    width: '100%',
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.card,
  },
  codeInput: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 20,
    fontWeight: '800',
    color: colors.onboarding.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  codeDots: {
    flexDirection: 'row',
    gap: 8,
  },
  codeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral.border,
  },
  codeDotFilled: {
    backgroundColor: colors.onboarding.primary,
  },
  skipBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  skipText: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    textDecorationLine: 'underline',
  },
});
