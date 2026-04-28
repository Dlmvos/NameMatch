import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMatchState } from '../context/RoomContext';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';
import { getLocalizedNameMeaning, cleanOriginForDisplay } from '../i18n/nameMeaningDisplay';
import { CustomNameService } from '../services/CustomNameService';
import { SwipeService, LikedName } from '../services/SwipeService';
import NameDetailModal from '../components/NameDetailModal';
import { ensureNameNestStorageMigration } from '../lib/storageBrandMigration';
import { Match, BabyName, Gender, Region } from '../types';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type ScreenTab = 'matches' | 'likes';

async function shareSingleMatch(
  match: Match,
  t: (key: string, vars?: Record<string, string | number>) => string,
  language: string,
): Promise<void> {
  const name = match.baby_names;
  if (!name) return;
  const localizedMeaning = getLocalizedNameMeaning(name, language);
  try {
    await Share.share({
      message: t('match.share.message', {
        name: name.name,
        origin: name.origin ?? '',
        meaning: localizedMeaning,
      }),
      title: t('match.share.title', { name: name.name }),
    });
  } catch (_) {}
}

const NOTES_STORAGE_KEY = 'namenest:match_notes';
// Replaced by shared cleanOriginForDisplay from nameMeaningDisplay

const DEV_SAMPLE_MATCHES: Match[] = [
  {
    id: 'dev-match-1',
    room_id: 'dev-room',
    name_id: 'dev-name-1',
    created_at: new Date().toISOString(),
    baby_names: {
      id: 'dev-name-1',
      name: 'Mila',
      meaning: 'Gracious; dear',
      meaningTranslations: {
        nl: 'Genadig; dierbaar',
        de: 'Anmutig; lieb',
      },
      origin: 'Slavic',
      gender: 'girl',
      country: 'Netherlands',
      region: 'EU',
      is_worldwide: true,
      popularity_rank: 12,
      trend: 'rising',
    },
  },
  {
    id: 'dev-match-2',
    room_id: 'dev-room',
    name_id: 'dev-name-2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    baby_names: {
      id: 'dev-name-2',
      name: 'Adam',
      meaning: 'Earth; man',
      meaningTranslations: {
        fr: 'Terre; homme',
        es: 'Tierra; hombre',
      },
      origin: 'Hebrew',
      gender: 'boy',
      country: 'Belgium',
      region: 'EU',
      is_worldwide: true,
      popularity_rank: 33,
      trend: 'classic',
    },
  },
  {
    id: 'dev-match-3',
    room_id: 'dev-room',
    name_id: 'dev-name-3',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    baby_names: {
      id: 'dev-name-3',
      name: 'Noah',
      meaning: 'Rest; comfort',
      origin: 'Hebrew',
      gender: 'boy',
      country: 'Germany',
      region: 'EU',
      is_worldwide: true,
      popularity_rank: 5,
      trend: 'stable',
    },
  },
  {
    id: 'dev-match-4',
    room_id: 'dev-room',
    name_id: 'dev-name-4',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    baby_names: {
      id: 'dev-name-4',
      name: 'Luna',
      meaning: 'Moon',
      origin: 'Latin',
      gender: 'girl',
      country: 'France',
      region: 'EU',
      is_worldwide: true,
      popularity_rank: 18,
      trend: 'rising',
    },
  },
];

export default function MatchesScreen() {
  const { t, language } = useTranslation();
  const { matches } = useMatchState();
  const { room } = useRoom();
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [showDevSampleMatches, setShowDevSampleMatches] = useState(false);
  const displayedMatches =
    __DEV__ && matches.length === 0 && showDevSampleMatches ? DEV_SAMPLE_MATCHES : matches;

  // ── Custom name modal state ──
  const [showCustomNameModal, setShowCustomNameModal] = useState(false);
  const [customNameText, setCustomNameText] = useState('');
  const [customGender, setCustomGender] = useState<Gender>('neutral');
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const resetCustomModal = useCallback(() => {
    setShowCustomNameModal(false);
    setCustomNameText('');
    setCustomGender('neutral');
    setIsSavingCustom(false);
  }, []);

  const handleSaveCustomName = useCallback(async () => {
    const trimmed = customNameText.trim();
    if (!trimmed) {
      Alert.alert('', t('matches.customName.empty'));
      return;
    }
    const roomId = room?.id ?? profile?.room_id;
    if (!user?.id || !roomId) {
      Alert.alert('', __DEV__ ? 'Cannot add a custom name without a signed-in user and active room.' : t('matches.customName.error'));
      return;
    }

    setIsSavingCustom(true);
    try {
      if (__DEV__) {
        console.log('[MatchesScreen] saving custom name', {
          name: trimmed,
          gender: customGender,
          userId: user.id,
          roomId,
          region: profile?.region_preference ?? 'WORLDWIDE',
          country: profile?.country_preference ?? null,
        });
      }
      const { babyName } = await CustomNameService.addCustomName({
        name: trimmed,
        gender: customGender,
        userId: user.id,
        roomId,
        region: (profile?.region_preference as Region) ?? 'WORLDWIDE',
        country: profile?.country_preference ?? undefined,
      });
      resetCustomModal();
      Alert.alert('', t('matches.customName.success', { name: babyName.name }));
    } catch (err: any) {
      console.error('[MatchesScreen] custom name error:', err?.message ?? err);
      Alert.alert('', __DEV__ && err?.message ? `${t('matches.customName.error')}\n\n${err.message}` : t('matches.customName.error'));
      setIsSavingCustom(false);
    }
  }, [customNameText, customGender, user?.id, room?.id, profile?.room_id, profile?.region_preference, profile?.country_preference, resetCustomModal, t]);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<ScreenTab>('matches');

  // ── Liked names state ──
  const [likedNames, setLikedNames] = useState<LikedName[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);

  // ── Name detail modal state ──
  const [detailName, setDetailName] = useState<BabyName | null>(null);

  const roomId = room?.id ?? profile?.room_id ?? null;

  const fetchLikedNames = useCallback(async () => {
    if (!user?.id || !roomId) return;
    setIsLoadingLikes(true);
    try {
      const liked = await SwipeService.getLikedNames(user.id, roomId);
      setLikedNames(liked);
    } catch (err: any) {
      console.error('[MatchesScreen] fetchLikedNames error:', err?.message ?? err);
    } finally {
      setIsLoadingLikes(false);
    }
  }, [user?.id, roomId]);

  // Fetch liked names when tab becomes active
  useEffect(() => {
    if (activeTab === 'likes') {
      fetchLikedNames();
    }
  }, [activeTab, fetchLikedNames]);

  const handleUnlike = useCallback(async (likedName: LikedName) => {
    if (!user?.id || !roomId) return;
    Alert.alert(
      t('matches.likes.unlikeConfirm', { name: likedName.name.name }),
      t('matches.likes.unlikeConfirmBody'),
      [
        { text: t('matches.likes.unlikeNo'), style: 'cancel' },
        {
          text: t('matches.likes.unlikeYes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await SwipeService.unlikeName({
                userId: user.id,
                roomId,
                nameId: likedName.name.id,
              });
              // Optimistic removal from local state
              setLikedNames((prev) => prev.filter((l) => l.swipeId !== likedName.swipeId));
            } catch (err: any) {
              console.error('[MatchesScreen] unlikeName error:', err?.message ?? err);
            }
          },
        },
      ],
    );
  }, [user?.id, roomId, t]);

  // Load saved notes
  useEffect(() => {
    ensureNameNestStorageMigration()
      .then(() => AsyncStorage.getItem(NOTES_STORAGE_KEY))
      .then((raw) => { if (raw) setNotes(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  const saveNote = async () => {
    if (!editingMatchId) return;
    const updated = { ...notes, [editingMatchId]: draftNote };
    setNotes(updated);
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
    setEditingMatchId(null);
  };

  const openNote = (matchId: string) => {
    setDraftNote(notes[matchId] ?? '');
    setEditingMatchId(matchId);
  };

  const handleShare = async () => {
    if (displayedMatches.length === 0) return;
    const nameList = displayedMatches
      .slice(0, 10)
      .map((m) => `• ${m.baby_names?.name ?? ''}`)
      .join('\n');
    await Share.share({
      message: t('matches.share.message', { count: displayedMatches.length, names: nameList }),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('matches.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {displayedMatches.length > 0
              ? displayedMatches.length === 1
                ? t('matches.subtitle.single', { count: displayedMatches.length })
                : t('matches.subtitle.plural', { count: displayedMatches.length })
              : t('matches.subtitle.empty')}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {user?.id && (room?.id || profile?.room_id) ? (
            <TouchableOpacity
              style={styles.addCustomBtn}
              onPress={() => setShowCustomNameModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.onboarding.primary} />
            </TouchableOpacity>
          ) : null}
          {displayedMatches.length > 0 && (
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={colors.match.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Note editor modal */}
      <Modal visible={!!editingMatchId} transparent animationType="slide" onRequestClose={() => setEditingMatchId(null)}>
        <TouchableOpacity style={noteStyles.backdrop} activeOpacity={1} onPress={() => setEditingMatchId(null)} />
        <View style={noteStyles.noteSheet}>
          <View style={noteStyles.noteHandle} />
          <Text style={noteStyles.noteTitle}>{t('matches.addNote')}</Text>
          <Text style={noteStyles.noteHint}>{t('matches.addNoteHint')}</Text>
          <TextInput
            style={noteStyles.noteInput}
            multiline
            placeholder={t('matches.notePlaceholder')}
            placeholderTextColor={colors.neutral.gray}
            value={draftNote}
            onChangeText={setDraftNote}
            autoFocus
            maxLength={280}
          />
          <Text style={noteStyles.charCount}>{draftNote.length}/280</Text>
          <View style={noteStyles.noteActions}>
            <TouchableOpacity style={noteStyles.cancelBtn} onPress={() => setEditingMatchId(null)}>
              <Text style={noteStyles.cancelText}>{t('matches.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={noteStyles.saveBtn} onPress={saveNote}>
              <Text style={noteStyles.saveText}>{t('matches.saveNote')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom name modal */}
      <Modal visible={showCustomNameModal} transparent animationType="slide" onRequestClose={resetCustomModal}>
        <TouchableOpacity style={noteStyles.backdrop} activeOpacity={1} onPress={resetCustomModal} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <View style={noteStyles.noteSheet}>
            <View style={noteStyles.noteHandle} />
            <Text style={noteStyles.noteTitle}>{t('matches.customName.title')}</Text>
            <Text style={noteStyles.noteHint}>{t('matches.customName.hint')}</Text>
            <TextInput
              style={customStyles.nameInput}
              placeholder={t('matches.customName.placeholder')}
              placeholderTextColor={colors.neutral.gray}
              value={customNameText}
              onChangeText={setCustomNameText}
              autoFocus
              maxLength={40}
              autoCapitalize="words"
            />
            <Text style={customStyles.genderLabel}>{t('matches.customName.gender')}</Text>
            <View style={customStyles.genderRow}>
              {(['boy', 'girl', 'neutral'] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    customStyles.genderOption,
                    customGender === g && customStyles.genderOptionActive,
                  ]}
                  onPress={() => setCustomGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    customStyles.genderOptionText,
                    customGender === g && customStyles.genderOptionTextActive,
                  ]}>
                    {g === 'boy' ? '💙 ' : g === 'girl' ? '💗 ' : '💜 '}
                    {t(`matches.customName.${g}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={noteStyles.noteActions}>
              <TouchableOpacity style={noteStyles.cancelBtn} onPress={resetCustomModal}>
                <Text style={noteStyles.cancelText}>{t('matches.customName.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[noteStyles.saveBtn, isSavingCustom && { opacity: 0.6 }]}
                onPress={handleSaveCustomName}
                disabled={isSavingCustom}
              >
                <Text style={noteStyles.saveText}>{t('matches.customName.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Tab switcher ── */}
      <View style={tabStyles.tabRow}>
        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'matches' && tabStyles.tabActive]}
          onPress={() => setActiveTab('matches')}
          activeOpacity={0.8}
        >
          <Text style={[tabStyles.tabText, activeTab === 'matches' && tabStyles.tabTextActive]}>
            {t('matches.tab.matches')}
            {displayedMatches.length > 0 ? ` (${displayedMatches.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'likes' && tabStyles.tabActive]}
          onPress={() => setActiveTab('likes')}
          activeOpacity={0.8}
        >
          <Text style={[tabStyles.tabText, activeTab === 'likes' && tabStyles.tabTextActive]}>
            {t('matches.tab.myLikes')}
            {likedNames.length > 0 ? ` (${likedNames.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Matches tab ── */}
      {activeTab === 'matches' && (
        displayedMatches.length === 0 ? (
          <EmptyState
            onLoadDevSamples={
              __DEV__ && matches.length === 0
                ? () => setShowDevSampleMatches(true)
                : undefined
            }
          />
        ) : (
          <FlatList
            data={displayedMatches}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
            renderItem={({ item, index }) => (
              <MatchCard
                match={item}
                rank={index + 1}
                note={notes[item.id]}
                onNotePress={() => openNote(item.id)}
                onShareMatch={() => shareSingleMatch(item, t, language)}
              />
            )}
            ListFooterComponent={
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {t('matches.keepSwiping')}
                </Text>
              </View>
            }
          />
        )
      )}

      {/* ── My Likes tab ── */}
      {activeTab === 'likes' && (
        likedNames.length === 0 && !isLoadingLikes ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💕</Text>
            <Text style={styles.emptyTitle}>{t('matches.likes.empty')}</Text>
          </View>
        ) : (
          <FlatList
            data={likedNames}
            keyExtractor={(item) => item.swipeId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
            renderItem={({ item }) => (
              <LikedNameCard
                likedName={item}
                onUnlike={() => handleUnlike(item)}
                onPress={() => setDetailName(item.name)}
              />
            )}
          />
        )
      )}

      {/* Name detail bottom sheet */}
      <NameDetailModal
        name={detailName}
        visible={detailName !== null}
        onClose={() => setDetailName(null)}
      />
    </SafeAreaView>
  );
}

function MatchCard({
  match,
  rank,
  note,
  onNotePress,
  onShareMatch,
}: {
  match: Match;
  rank: number;
  note?: string;
  onNotePress: () => void;
  onShareMatch: () => void;
}) {
  const { language, t } = useTranslation();
  const name = match.baby_names;
  if (!name) return null;

  const genderColor =
    name.gender === 'boy'
      ? COLORS.boy
      : name.gender === 'girl'
      ? COLORS.girl
      : COLORS.neutral;

  const genderEmoji =
    name.gender === 'boy' ? '💙' : name.gender === 'girl' ? '💗' : '💜';

  const date = new Date(match.created_at);
  const dateStr = date.toLocaleDateString(language, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.matchCard, SHADOWS.card]}>
      {/* Rank */}
      <View style={[styles.rankBadge, { backgroundColor: genderColor + '22' }]}>
        <Text style={[styles.rankText, { color: genderColor }]}>#{rank}</Text>
      </View>

      {/* Name info */}
      <View style={styles.matchInfo}>
        <View style={styles.matchNameRow}>
          <Text
            style={styles.matchName}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {name.name}
          </Text>
          <Text style={styles.genderEmoji}>{genderEmoji}</Text>
        </View>
        <View style={styles.originRow}>
          <Text style={styles.matchOrigin} numberOfLines={1}>
            {cleanOriginForDisplay(name.origin)}
          </Text>
          {(name.source === 'custom' || name.origin === 'Custom') ? (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>{t('matches.customName.badge')}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.matchMeaning} numberOfLines={2}>
          {getLocalizedNameMeaning(name, language)}
        </Text>
        {!note ? (
          <TouchableOpacity onPress={onNotePress} hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }} style={styles.addNoteLinkWrap}>
            <Text style={styles.addNoteLink}>{t('matches.addNote')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Meta */}
      <View style={styles.matchMeta}>
        <Text style={styles.matchDate}>{dateStr}</Text>
        <TouchableOpacity onPress={onShareMatch} style={styles.noteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="share-outline" size={18} color={colors.match.primary} />
        </TouchableOpacity>
      </View>
      {note ? (
        <TouchableOpacity onPress={onNotePress} style={styles.notePreview}>
          <Text style={styles.noteText} numberOfLines={2}>{note}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function LikedNameCard({
  likedName,
  onUnlike,
  onPress,
}: {
  likedName: LikedName;
  onUnlike: () => void;
  onPress: () => void;
}) {
  const { language, t } = useTranslation();
  const name = likedName.name;

  const genderColor =
    name.gender === 'boy'
      ? COLORS.boy
      : name.gender === 'girl'
      ? COLORS.girl
      : COLORS.neutral;

  const genderEmoji =
    name.gender === 'boy' ? '💙' : name.gender === 'girl' ? '💗' : '💜';
  const isCustom = name.source === 'custom' || name.origin === 'Custom';
  const localizedMeaning = getLocalizedNameMeaning(name, language);
  const likedSubtitle = localizedMeaning || (isCustom ? '' : cleanOriginForDisplay(name.origin));

  const date = new Date(likedName.swipedAt);
  const dateStr = date.toLocaleDateString(language, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity style={[styles.matchCard, SHADOWS.card]} activeOpacity={0.7} onPress={onPress}>
      {/* Gender badge */}
      <View style={[styles.rankBadge, { backgroundColor: genderColor + '22' }]}>
        <Text style={{ fontSize: 20 }}>{genderEmoji}</Text>
      </View>

      {/* Name info */}
      <View style={styles.matchInfo}>
        <View style={styles.matchNameRow}>
          <Text
            style={styles.matchName}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {name.name}
          </Text>
        </View>
        {isCustom ? (
          <View style={styles.originRow}>
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>{t('matches.customName.badge')}</Text>
            </View>
          </View>
        ) : null}
        {likedSubtitle ? (
          <Text style={styles.matchMeaning} numberOfLines={2}>
            {likedSubtitle}
          </Text>
        ) : null}
      </View>

      {/* Meta + unlike */}
      <View style={styles.matchMeta}>
        <Text style={styles.matchDate}>{dateStr}</Text>
        <TouchableOpacity onPress={onUnlike} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="heart-dislike-outline" size={18} color={colors.neutral.gray} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ onLoadDevSamples }: { onLoadDevSamples?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>⭐</Text>
      <Text style={styles.emptyTitle}>{t('matches.empty.title')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('matches.empty.subtitle')}
      </Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>{t('matches.howItWorks')}</Text>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>1</Text>
          <Text style={styles.tipText}>{t('matches.tip.one')}</Text>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>2</Text>
          <Text style={styles.tipText}>{t('matches.tip.two')}</Text>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>3</Text>
          <Text style={styles.tipText}>{t('matches.tip.three')}</Text>
        </View>
      </View>
      {onLoadDevSamples ? (
        <TouchableOpacity style={styles.devLoadBtn} onPress={onLoadDevSamples} activeOpacity={0.85}>
          <Text style={styles.devLoadBtnText}>Load Sample Matches (DEV)</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addCustomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  matchCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  matchInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 30,
    width: '100%',
  },
  matchName: {
    fontSize: FONTS.sizes.xl,
    lineHeight: FONTS.sizes.xl + 4,
    fontWeight: '800',
    color: COLORS.text,
    flexShrink: 1,
    includeFontPadding: false,
  },
  genderEmoji: {
    fontSize: 16,
    lineHeight: 20,
    includeFontPadding: false,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  matchOrigin: {
    fontSize: FONTS.sizes.sm,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    flexShrink: 1,
    includeFontPadding: false,
  },
  customBadge: {
    backgroundColor: colors.onboarding.primary + '18',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onboarding.primary,
  },
  matchMeaning: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  addNoteLinkWrap: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  addNoteLink: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: colors.match.primary,
  },
  matchMeta: {
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  matchDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  heartIcon: {},
  noteBtn: {},
  notePreview: {
    width: '100%',
    backgroundColor: colors.neutral.bgSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: 2,
  },
  noteText: {
    fontSize: FONTS.sizes.xs,
    color: colors.neutral.textBody,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tipBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    ...SHADOWS.card,
  },
  tipTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  tipStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.match.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: colors.match.primary,
  },
  tipText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  devLoadBtn: {
    marginTop: SPACING.sm,
    backgroundColor: colors.neutral.bgSoft,
    borderColor: colors.neutral.border,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  devLoadBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: colors.neutral.darkGray,
  },
});

const noteStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  noteSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: SPACING.xl + 16,
    ...SHADOWS.card,
  },
  noteHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  noteTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: colors.neutral.textDark,
    marginBottom: 4,
  },
  noteHint: {
    fontSize: FONTS.sizes.sm,
    color: colors.neutral.gray,
    marginBottom: SPACING.md,
  },
  noteInput: {
    backgroundColor: colors.neutral.bgSoft,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: colors.neutral.textDark,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONTS.sizes.xs,
    color: colors.neutral.gray,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  noteActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.neutral.bgSoft,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: colors.neutral.darkGray,
  },
  saveBtn: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.onboarding.primary,
    alignItems: 'center',
  },
  saveText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: colors.neutral.white,
  },
});

const customStyles = StyleSheet.create({
  nameInput: {
    backgroundColor: colors.neutral.bgSoft,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    padding: SPACING.md,
    fontSize: FONTS.sizes.lg,
    color: colors.neutral.textDark,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  genderLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: colors.neutral.textDark,
    marginBottom: SPACING.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  genderOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    backgroundColor: colors.neutral.bgSoft,
  },
  genderOptionActive: {
    borderColor: colors.onboarding.primary,
    backgroundColor: colors.onboarding.primary + '12',
  },
  genderOptionText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: colors.neutral.gray,
  },
  genderOptionTextActive: {
    color: colors.onboarding.primary,
    fontWeight: '800',
  },
});

const tabStyles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    backgroundColor: colors.neutral.bgSoft,
    borderRadius: RADIUS.lg,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.neutral.white,
    ...SHADOWS.card,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: colors.neutral.gray,
  },
  tabTextActive: {
    color: colors.onboarding.primary,
    fontWeight: '800',
  },
});
