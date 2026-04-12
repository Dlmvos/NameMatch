import React, { useEffect, useRef } from 'react';
import { colors } from '../theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heartScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Heartbeat loop
    Animated.loop(
      Animated.sequence([
        Animated.spring(heartScale, {
          toValue: 1.15,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(heartScale, {
          toValue: 0.9,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient
      colors={[colors.onboarding.background, colors.onboarding.accent, colors.neutral.white]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* Floating decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Hero Heart */}
        <Animated.View style={[styles.heroEmoji, { transform: [{ scale: heartScale }] }]}>
          <Text style={styles.heart}>💕</Text>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>NameMatch</Text>
        <Text style={styles.tagline}>Find your baby's perfect name,{'\n'}together.</Text>

        {/* Feature pills */}
        <View style={styles.pills}>
          <FeaturePill emoji="💌" text="Swipe together" />
          <FeaturePill emoji="✨" text="Instant matches" />
          <FeaturePill emoji="🌍" text="Global names" />
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.primaryBtn, SHADOWS.button]}
            onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.onboarding.primary, colors.onboarding.secondary]}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Get Started ✨</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Auth', { mode: 'login' })}
            activeOpacity={0.75}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>Made with 💕 for expecting parents</Text>
    </LinearGradient>
  );
}

function FeaturePill({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: RADIUS.full,
    opacity: 0.25,
  },
  circle1: {
    width: 280,
    height: 280,
    backgroundColor: colors.onboarding.background,
    top: -80,
    right: -80,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: colors.onboarding.background,
    bottom: 80,
    left: -60,
  },
  circle3: {
    width: 140,
    height: 140,
    backgroundColor: colors.onboarding.background,
    top: height * 0.35,
    right: -40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    width: '100%',
  },
  heroEmoji: {
    marginBottom: SPACING.lg,
  },
  heart: {
    fontSize: 80,
  },
  title: {
    fontSize: FONTS.sizes.huge,
    fontWeight: '800',
    color: colors.onboarding.text,
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONTS.sizes.xl,
    color: colors.onboarding.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING.xl,
  },
  pills: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    gap: 4,
    ...SHADOWS.card,
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillText: {
    fontSize: FONTS.sizes.sm,
    color: colors.onboarding.text,
    fontWeight: '600',
  },
  buttons: {
    width: '100%',
    gap: SPACING.md,
  },
  primaryBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.onboarding.text,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.onboarding.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xl,
    color: colors.onboarding.text,
    fontSize: FONTS.sizes.sm,
  },
});
