import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useRoomActions, useRoomState } from '../context/RoomContext';
import { useTranslation } from '../i18n/I18nProvider';
import { createRoomJoinPayload } from '../lib/roomJoinPayload';
import { COMPATIBILITY_MIN_CODETERMINED, type CompatibilityMetrics } from '../lib/compatibilityScore';
import { fetchRoomCompatibilityMetrics } from '../services/compatibilitySwipeService';
import { AnalyticsService } from '../services/AnalyticsService';
import { RootStackParamList } from '../types';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomManagement'>;

export default function RoomManagementScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { room } = useRoomState();
  const { leaveRoom } = useRoomActions();
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [compatibility, setCompatibility] = useState<CompatibilityMetrics | null>(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const roomQrViewLoggedForId = useRef<string | null>(null);

  useEffect(() => {
    roomQrViewLoggedForId.current = null;
  }, [room?.id]);

  useEffect(() => {
    if (!copiedFeedback) return;
    const timer = setTimeout(() => setCopiedFeedback(false), 1800);
    return () => clearTimeout(timer);
  }, [copiedFeedback]);

  const handleShare = async () => {
    if (!room?.code) return;
    AnalyticsService.track('invite_share_tap', { room_code_length: room.code.length });
    try {
      await Share.share({
        message: t('partner.share.message', {
          code: room.code,
          url: createRoomJoinPayload(room.code),
        }),
        title: t('partner.share.title'),
      });
    } catch (err) {
      // Share.share rejects on user cancel as well as on real errors; log in
      // dev so genuine failures (no share targets, OS misconfigured) surface.
      if (__DEV__) console.warn('[RoomManagementScreen] share failed', err);
    }
  };

  const handleCopy = async () => {
    if (!room?.code) return;
    await Clipboard.setStringAsync(room.code);
    setCopiedFeedback(true);
  };

  const handleLeave = () => {
    Alert.alert(
      t('settings.leaveRoom'),
      t('settings.leaveRoomConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.leaveRoom'),
          style: 'destructive',
          onPress: async () => {
            await leaveRoom();
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (!room?.user2_id) {
      setCompatibility(null);
      setCompatibilityLoading(false);
      return;
    }
    let cancelled = false;
    setCompatibilityLoading(true);
    void (async () => {
      try {
        const partnerId = room.user2_id;
        if (!partnerId) return;
        const metrics = await fetchRoomCompatibilityMetrics(room.id, room.user1_id, partnerId);
        if (!cancelled) setCompatibility(metrics);
      } finally {
        if (!cancelled) setCompatibilityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [room?.id, room?.user1_id, room?.user2_id]);

  if (!room) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('room.emptyTitle')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('PartnerConnect')}>
            <Text style={styles.primaryBtnText}>{t('settings.connectPartner')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const joinPayload = createRoomJoinPayload(room.code);

  const onRoomQrLayout = useCallback(() => {
    if (!room?.code || !room.id) return;
    if (roomQrViewLoggedForId.current === room.id) return;
    roomQrViewLoggedForId.current = room.id;
    AnalyticsService.track('invite_qr_view', { room_code_length: room.code.length });
  }, [room?.id, room?.code]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={18} color={colors.onboarding.text} />
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
          {copiedFeedback ? <Text style={styles.copiedText}>{t('room.copied')}</Text> : <View style={styles.copiedSpacer} />}
        </View>

        <Text style={styles.title}>{t('room.title')}</Text>

        <View style={[styles.codeCard, SHADOWS.card]}>
          <Text style={styles.codeLabel}>{t('settings.roomCode')}</Text>
          <Text style={styles.codeValue}>{room.code}</Text>
        </View>

        <View style={[styles.qrCard, SHADOWS.card]} onLayout={onRoomQrLayout}>
          <QRCode value={joinPayload} size={190} />
          <Text style={styles.qrHint}>{t('partner.qr.hint')}</Text>
        </View>

        {room.user2_id ? (
          <View style={[styles.compatibilityCard, SHADOWS.card]}>
            <Text style={styles.compatibilityTitle}>{t('room.compatibility.title')}</Text>
            {compatibilityLoading ? (
              <ActivityIndicator size="small" color={colors.swipe.secondary} style={styles.compatibilitySpinner} />
            ) : compatibility === null ? (
              <Text style={styles.compatibilityPlaceholder}>{t('room.compatibility.placeholder')}</Text>
            ) : compatibility.codeterminedCount < COMPATIBILITY_MIN_CODETERMINED ? (
              <Text style={styles.compatibilityPlaceholder}>{t('room.compatibility.placeholder')}</Text>
            ) : (
              <>
                <Text style={styles.compatibilityScore}>
                  {t('room.compatibility.score', { score: compatibility.compatibility })}
                </Text>
                <Text style={styles.compatibilitySub}>
                  {t('room.compatibility.sharedLikes', { count: compatibility.sharedLikes })}
                </Text>
              </>
            )}
          </View>
        ) : null}

        <View style={styles.actions}>
          <ActionRow icon="share-outline" label={t('room.share')} onPress={handleShare} />
          <ActionRow icon="copy-outline" label={t('room.copy')} onPress={handleCopy} />
          <ActionRow icon="exit-outline" label={t('settings.leaveRoom')} onPress={handleLeave} destructive />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.actionLeft}>
        <Ionicons name={icon} size={18} color={destructive ? COLORS.skip : colors.shortlist.primary} />
        <Text style={[styles.actionLabel, destructive && styles.actionLabelDestructive]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  backText: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    fontWeight: '600',
  },
  copiedText: {
    fontSize: FONTS.sizes.sm,
    color: colors.shortlist.primary,
    fontWeight: '700',
  },
  copiedSpacer: {
    width: 1,
    height: 1,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: colors.onboarding.text,
  },
  codeCard: {
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: FONTS.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.onboarding.text,
    marginBottom: 6,
  },
  codeValue: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 8,
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
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
  },
  compatibilityCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.22)',
  },
  compatibilityTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.swipe.secondary,
  },
  compatibilitySpinner: {
    marginVertical: SPACING.xs,
  },
  compatibilityScore: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.onboarding.text,
    letterSpacing: -0.5,
  },
  compatibilitySub: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    opacity: 0.72,
    textAlign: 'center',
  },
  compatibilityPlaceholder: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    opacity: 0.65,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },
  actions: {
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONTS.sizes.md,
    color: colors.onboarding.text,
    fontWeight: '500',
  },
  actionLabelDestructive: {
    color: colors.onboarding.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: colors.onboarding.text,
  },
  primaryBtn: {
    backgroundColor: colors.onboarding.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  primaryBtnText: {
    color: colors.neutral.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
});
