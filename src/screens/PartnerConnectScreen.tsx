import React, { useState, useRef, useEffect } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PartnerConnect'>;

type Tab = 'create' | 'join';

export default function PartnerConnectScreen({ navigation }: Props) {
  const { createRoom, joinRoom } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCreateRoom = async () => {
    if (roomCode) {
      // Already created — share it
      handleShare();
      return;
    }
    setIsLoading(true);
    try {
      const code = await createRoom();
      setRoomCode(code);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on NameMatch! 👶 Enter code: ${roomCode}\n\nDownload the app and let's find our baby's perfect name together! 💕`,
        title: 'Join my NameMatch room!',
      });
    } catch (_) {}
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || joinCode.length < 4) {
      Alert.alert('Oops!', 'Please enter a valid room code.');
      return;
    }
    setIsLoading(true);
    try {
      await joinRoom(joinCode.toUpperCase().trim());
      // Navigation handled by AppNavigator
    } catch (err: any) {
      Alert.alert('Could not join room', err.message ?? 'Check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Progress dots */}
        <View style={styles.progress}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <Text style={styles.emoji}>💑</Text>
          <Text style={styles.title}>Connect with{'\n'}your partner</Text>
          <Text style={styles.subtitle}>
            Create a room and share the code, or enter your partner's code to join.
          </Text>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.tabActive]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
              Create Room
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'join' && styles.tabActive]}
            onPress={() => setActiveTab('join')}
          >
            <Text style={[styles.tabText, activeTab === 'join' && styles.tabTextActive]}>
              Join Room
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Room Panel */}
        {activeTab === 'create' && (
          <View style={styles.panel}>
            {!roomCode ? (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Generate a unique 6-letter code and share it with your partner. You'll both swipe independently!
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
                      {isLoading ? 'Creating...' : 'Create My Room'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.codeLabel}>Your room code</Text>
                <View style={[styles.codeDisplay, SHADOWS.card]}>
                  <Text style={styles.codeText}>{roomCode}</Text>
                </View>
                <Text style={styles.codeHint}>
                  Share this with your partner — they'll use "Join Room" to enter it.
                </Text>

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
                    <Text style={styles.primaryBtnText}>Share Code</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => navigation.navigate('Paywall')}
                >
                  <Text style={styles.skipText}>Start swiping solo for now →</Text>
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
                Ask your partner for their room code and enter it below to join their room.
              </Text>
            </View>

            <View style={styles.codeInputWrapper}>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter 6-letter code"
                placeholderTextColor={COLORS.textMuted}
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Letter count dots */}
            <View style={styles.codeDots}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.codeDot,
                    i < joinCode.length && styles.codeDotFilled,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                SHADOWS.button,
                joinCode.length < 6 && { opacity: 0.6 },
              ]}
              onPress={handleJoinRoom}
              disabled={isLoading || joinCode.length < 6}
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
                  {isLoading ? 'Joining...' : 'Join Room'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Skip for now */}
        {activeTab === 'create' && !roomCode && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => navigation.navigate('Paywall')}
          >
            <Text style={styles.skipText}>Skip for now, I'll connect later</Text>
          </TouchableOpacity>
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
    backgroundColor: colors.onboarding.background,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.onboarding.background,
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
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.lg,
    padding: 4,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: colors.onboarding.background,
    ...SHADOWS.card,
  },
  tabText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: colors.onboarding.text,
  },
  tabTextActive: {
    color: colors.onboarding.text,
  },
  panel: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.md,
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
    fontSize: 32,
    fontWeight: '800',
    color: colors.onboarding.text,
    textAlign: 'center',
    letterSpacing: 6,
  },
  codeDots: {
    flexDirection: 'row',
    gap: 8,
  },
  codeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.onboarding.background,
  },
  codeDotFilled: {
    backgroundColor: colors.onboarding.background,
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
