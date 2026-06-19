import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { supabase } from './supabase';
import { navigationRef } from './navigationRef';

/**
 * Handles auth-related deep links delivered to the app:
 *
 *   - babinom://email-confirmed
 *       Sent by the Supabase confirmation email Site URL fallback +
 *       the website's /confirmed/ landing page. Just acknowledges the
 *       confirmation with a brief Alert and leaves navigation alone —
 *       the user lands wherever AuthContext routes them (typically
 *       home or onboarding).
 *
 *   - babinom://reset-password#access_token=…&refresh_token=…&type=recovery
 *       Sent by the Supabase password-recovery email. Extracts the
 *       Supabase session tokens from the URL fragment (or query string,
 *       depending on flow type), installs them as the active session,
 *       and routes the user to ResetPasswordScreen so they can set a
 *       new password.
 *
 * Mirrors the shape of useDeepLinkJoin (partner invites). Call once
 * at the navigation root, alongside useDeepLinkJoin.
 */
export function useDeepLinkAuth(): void {
  useEffect(() => {
    let isMounted = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !isMounted) return;

      const parsed = Linking.parse(url);
      const path = (parsed.path ?? '').toLowerCase();

      // ── Email confirmation ──────────────────────────────────────
      if (path === 'email-confirmed' || path === 'confirmed') {
        Alert.alert(
          'Email confirmed',
          "You're all set — welcome to Babinom 💜",
        );
        return;
      }

      // ── Password recovery ───────────────────────────────────────
      if (path === 'reset-password') {
        // Supabase delivers recovery tokens in the URL FRAGMENT
        // (after `#`) by default; expo-linking's `parse()` only sees
        // the query string. Hand-parse the fragment so we don't lose
        // them. Some flows deliver them as query params instead, so
        // we fall back to whatever Linking found.
        const fragmentString = url.split('#')[1] ?? '';
        const fragment = new URLSearchParams(fragmentString);

        const accessToken =
          fragment.get('access_token') ??
          (typeof parsed.queryParams?.access_token === 'string'
            ? parsed.queryParams.access_token
            : null);
        const refreshToken =
          fragment.get('refresh_token') ??
          (typeof parsed.queryParams?.refresh_token === 'string'
            ? parsed.queryParams.refresh_token
            : null);
        const flowType =
          fragment.get('type') ??
          (typeof parsed.queryParams?.type === 'string'
            ? parsed.queryParams.type
            : null);

        // ── Hard precondition: must carry a *recovery* session. ──
        // Without this guard, a bare `babinom://reset-password` link
        // (no fragment) would still navigate to ResetPasswordScreen,
        // where a currently-signed-in user could be tricked into
        // changing the active account's password. Reject anything
        // without all three signals: both tokens AND type=recovery.
        //
        // Surface a user-visible alert when this happens. Previously we
        // silently returned and the user saw the app launch and then
        // nothing — confusing when they're trying to recover their
        // password. Most common cause: tapping an already-consumed link
        // (Supabase recovery tokens are single-use).
        if (!accessToken || !refreshToken || flowType !== 'recovery') {
          if (__DEV__) {
            console.warn(
              '[useDeepLinkAuth] reset-password link missing tokens or type=recovery',
            );
          }
          Alert.alert(
            'Reset link invalid',
            "This password reset link is incomplete or has already been used. Request a new reset email from the sign-in screen.",
          );
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('[useDeepLinkAuth] setSession failed:', error.message);
          Alert.alert(
            'Reset link expired',
            "This password reset link has expired or been used already. Please request a new one from the sign-in screen.",
          );
          return;
        }

        // Only navigate AFTER the recovery session is successfully
        // installed. Pairs with ResetPasswordScreen's own session
        // precondition (defense in depth).
        if (navigationRef.isReady()) {
          navigationRef.dispatch(
            CommonActions.navigate({ name: 'ResetPassword' }),
          );
        }
        return;
      }
    };

    Linking.getInitialURL()
      .then(handleUrl)
      .catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}
