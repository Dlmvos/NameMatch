import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n/I18nProvider';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Set-new-password screen, reached via the password recovery deep link
 * (babinom://reset-password#access_token=...&refresh_token=...).
 *
 * The session is already installed by useDeepLinkAuth before this screen
 * mounts, so the supabase.auth.updateUser call below is authenticated.
 * On success we route the user to MainTabs (or Welcome if for some reason
 * the session didn't take).
 */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const trimmed = password.trim();
  const isValid =
    trimmed.length >= MIN_PASSWORD_LENGTH && trimmed === confirm.trim();

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: trimmed });
      if (error) {
        Alert.alert(
          t('resetPassword.errorTitle', { defaultValue: "Couldn't update password" }),
          error.message,
        );
        return;
      }
      Alert.alert(
        t('resetPassword.successTitle', { defaultValue: 'Password updated' }),
        t('resetPassword.successBody', {
          defaultValue: 'Your password has been changed. You can now use it to sign in.',
        }),
        [
          {
            text: 'OK',
            onPress: () => {
              // Land on the main app — the active session is already
              // installed, so the user lands authenticated.
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        t('resetPassword.errorTitle', { defaultValue: "Couldn't update password" }),
        err?.message ?? String(err),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isValid, navigation, t, trimmed]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={42} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>
            {t('resetPassword.title', { defaultValue: 'Set a new password' })}
          </Text>
          <Text style={styles.body}>
            {t('resetPassword.body', {
              defaultValue:
                'Choose a password at least 8 characters long. Use something different from your other accounts.',
            })}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              {t('resetPassword.newPassword', { defaultValue: 'New password' })}
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              {t('resetPassword.confirmPassword', { defaultValue: 'Confirm password' })}
            </Text>
            <TextInput
              style={[styles.input, styles.inputSolo]}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {confirm.length > 0 && trimmed !== confirm.trim() ? (
              <Text style={styles.errorText}>
                {t('resetPassword.mismatch', { defaultValue: "Passwords don't match" })}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>
              {isSubmitting
                ? t('resetPassword.submitting', { defaultValue: 'Updating…' })
                : t('resetPassword.submit', { defaultValue: 'Update password' })}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border ?? '#E5E7EB',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    paddingRight: 48,
  },
  inputSolo: {
    paddingRight: SPACING.md,
  },
  eyeBtn: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    color: '#D14D3F',
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.card,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
});
