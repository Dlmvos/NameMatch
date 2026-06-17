import React, { useState, useRef } from 'react';
import { colors } from '../theme';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';
import { RootStackParamList } from '../types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation, route }: Props) {
  const { signUp, signIn, signInWithApple } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup'>(route.params.mode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    if (!email || !password) {
      shake();
      Alert.alert(t('auth.alert.oops'), t('auth.alert.fillFields'));
      return;
    }

    if (mode === 'signup' && !displayName) {
      shake();
      Alert.alert(t('auth.alert.oops'), t('auth.alert.enterName'));
      return;
    }

    if (password.length < 6) {
      shake();
      Alert.alert(t('auth.alert.oops'), t('auth.alert.passwordLength'));
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, displayName.trim());

        Alert.alert(
          t('auth.alert.checkEmail'),
          t('auth.alert.verifyEmail'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                setMode('login');
                setPassword('');
              },
            },
          ]
        );
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: any) {
      shake();
      Alert.alert(
        mode === 'signup' ? t('auth.alert.signupFailed') : t('auth.alert.loginFailed'),
        err?.message ?? t('auth.alert.genericError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    if (isLoading) return;
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[colors.onboarding.background, colors.neutral.white]} style={StyleSheet.absoluteFill} />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.emoji}>{mode === 'signup' ? '👶' : '💕'}</Text>
        <Text style={styles.title}>
          {mode === 'signup' ? t('auth.title.signup') : t('auth.title.login')}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'signup'
            ? t('auth.subtitle.signup')
            : t('auth.subtitle.login')}
        </Text>

        <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
          {mode === 'signup' && (
            <InputField
              icon="person-outline"
              placeholder={t('auth.placeholder.name')}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}

          <InputField
            icon="mail-outline"
            placeholder={t('auth.placeholder.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordWrapper}>
            <InputField
              icon="lock-closed-outline"
              placeholder={t('auth.placeholder.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[styles.submitBtn, SHADOWS.button, isLoading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.onboarding.primary, colors.onboarding.secondary]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitText}>
              {isLoading ? t('auth.button.loading') : mode === 'signup' ? t('auth.button.signup') : t('auth.button.login')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign in with Apple — iOS only.
         * Apple requires the official AppleAuthenticationButton component
         * for visual compliance (HIG enforced at App Review). Hidden on
         * Android / web, since the underlying ASAuthorizationAppleIDProvider
         * doesn't exist there.
         */}
        {Platform.OS === 'ios' ? (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.divider.or', { defaultValue: 'or' })}</Text>
              <View style={styles.dividerLine} />
            </View>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                mode === 'signup'
                  ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                  : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={28}
              style={styles.appleBtn}
              onPress={async () => {
                if (isLoading) return;
                setIsLoading(true);
                try {
                  await signInWithApple();
                  // Auth state listener takes over from here — RootNavigator
                  // routes to Preferences (onboarding) or MainTabs based on
                  // profile state. No explicit navigation needed.
                } catch (err: any) {
                  // Apple's `signInAsync` rejects with ERR_CANCELED when the
                  // user dismisses the sheet. That's not an error worth
                  // alerting on — silently swallow.
                  const code = err?.code ?? '';
                  if (code === 'ERR_CANCELED' || code === 'ERR_REQUEST_CANCELED') {
                    return;
                  }
                  shake();
                  Alert.alert(
                    t('auth.alert.oops'),
                    err?.message ?? t('auth.alert.signinFailed', { defaultValue: 'Sign in failed. Please try again.' }),
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          </>
        ) : null}

        <TouchableOpacity style={styles.toggleBtn} onPress={toggleMode} disabled={isLoading}>
          <Text style={styles.toggleText}>
            {mode === 'signup' ? t('auth.toggle.hasAccount') : t('auth.toggle.noAccount')}
            <Text style={styles.toggleLink}>
              {mode === 'signup' ? t('auth.toggle.login') : t('auth.toggle.signup')}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboarding.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 100,
    paddingBottom: SPACING.xxl,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: SPACING.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.onboarding.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: colors.onboarding.text,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: colors.onboarding.text,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.onboarding.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: FONTS.sizes.md,
    color: colors.onboarding.text,
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  submitBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  submitText: {
    color: colors.onboarding.text,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(37, 49, 59, 0.18)',
  },
  dividerText: {
    color: 'rgba(37, 49, 59, 0.55)',
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  appleBtn: {
    width: '100%',
    height: 56,
  },
  toggleBtn: {
    paddingVertical: SPACING.sm,
  },
  toggleText: {
    fontSize: FONTS.sizes.md,
    color: colors.onboarding.text,
  },
  toggleLink: {
    color: colors.onboarding.text,
    fontWeight: '700',
  },
});
