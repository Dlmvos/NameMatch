import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { Match } from '../types';
import { colors, COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

const NOTES_STORAGE_KEY = 'namematch:match_notes';

export default function MatchesScreen() {
  const { matches } = useApp();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');

  // Load saved notes
  useEffect(() => {
    AsyncStorage.getItem(NOTES_STORAGE_KEY)
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
    if (matches.length === 0) return;
    const nameList = matches
      .slice(0, 10)
      .map((m) => `• ${m.baby_names?.name ?? ''}`)
      .join('\n');
    await Share.share({
      message: `We found ${matches.length} name matches on NameMatch! 💕\n\n${nameList}\n\nFind your baby's perfect name together!`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Matches</Text>
          <Text style={styles.headerSubtitle}>
            {matches.length > 0
              ? `${matches.length} name${matches.length > 1 ? 's' : ''} you both love`
              : 'Your shared favourites'}
          </Text>
        </View>
        {matches.length > 0 && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.match.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Note editor modal */}
      <Modal visible={!!editingMatchId} transparent animationType="slide" onRequestClose={() => setEditingMatchId(null)}>
        <TouchableOpacity style={noteStyles.backdrop} activeOpacity={1} onPress={() => setEditingMatchId(null)} />
        <View style={noteStyles.noteSheet}>
          <View style={noteStyles.noteHandle} />
          <Text style={noteStyles.noteTitle}>Add a note 📝</Text>
          <Text style={noteStyles.noteHint}>Share your thoughts on this name with your partner</Text>
          <TextInput
            style={noteStyles.noteInput}
            multiline
            placeholder="e.g. Love the meaning, reminds me of grandma..."
            placeholderTextColor={colors.neutral.gray}
            value={draftNote}
            onChangeText={setDraftNote}
            autoFocus
            maxLength={280}
          />
          <Text style={noteStyles.charCount}>{draftNote.length}/280</Text>
          <View style={noteStyles.noteActions}>
            <TouchableOpacity style={noteStyles.cancelBtn} onPress={() => setEditingMatchId(null)}>
              <Text style={noteStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={noteStyles.saveBtn} onPress={saveNote}>
              <Text style={noteStyles.saveText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {matches.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={matches}
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
            />
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Keep swiping to find more! 💕
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function MatchCard({ match, rank, note, onNotePress }: { match: Match; rank: number; note?: string; onNotePress: () => void }) {
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
  const dateStr = date.toLocaleDateString('en-US', {
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
          <Text style={styles.matchName}>{name.name}</Text>
          <Text style={styles.genderEmoji}>{genderEmoji}</Text>
        </View>
        <Text style={styles.matchOrigin}>{name.origin}</Text>
        <Text style={styles.matchMeaning} numberOfLines={2}>
          {name.meaning}
        </Text>
      </View>

      {/* Meta */}
      <View style={styles.matchMeta}>
        <Text style={styles.matchDate}>{dateStr}</Text>
        <TouchableOpacity onPress={onNotePress} style={styles.noteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={note ? 'chatbubble' : 'chatbubble-outline'}
            size={16}
            color={note ? colors.onboarding.primary : colors.neutral.gray}
          />
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

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>⭐</Text>
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Text style={styles.emptySubtitle}>
        When you and your partner both swipe right on the same name, it'll appear here as a match!
      </Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>How it works</Text>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>1</Text>
          <Text style={styles.tipText}>You both swipe names independently</Text>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>2</Text>
          <Text style={styles.tipText}>When you both swipe right — instant match! 🎉</Text>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipStep}>3</Text>
          <Text style={styles.tipText}>All your shared faves appear here</Text>
        </View>
      </View>
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
    alignItems: 'flex-start',
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
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  matchName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  genderEmoji: {
    fontSize: 16,
  },
  matchOrigin: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  matchMeaning: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  matchMeta: {
    alignItems: 'center',
    gap: 4,
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
