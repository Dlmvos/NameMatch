import { useEffect, useRef } from 'react';
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
  // Track in-flight poll intervals so we can clear them on unmount AND
  // when a newer deep link arrives. The `activeInvocation` counter rises
  // on each handleUrl call; any poll keyed to a stale invocation aborts
  // itself instead of dispatching navigate against a session that may
  // belong to a different (newer) reset link.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const invocationCounterRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !isMounted) return;

      // Cancel any in-flight poll from a previous invocation. A second
      // deep link tapped in quick succession (resent email, double-tap)
      // would otherwise leave the previous setSession + poll racing the
      // new flow — older poll's navigate could land after the newer
      // session was installed.
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      invocationCounterRef.current += 1;
      const thisInvocation = invocationCounterRef.current;

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
        //
        // Cold-launch race: when the app is launched FROM the email
        // link (process not running), `Linking.getInitialURL()` resolves
        // before NavigationContainer mounts → navigationRef.isReady()
        // is false → the dispatch is dropped silently. Retry with a
        // bounded poll so the navigate lands once navigation is ready.
        // Caps at ~5s; if NavigationContainer never mounts (unlikely),
        // we give up rather than spin forever.
        const navigateToReset = () => {
          // Defense: bail if a newer invocation has superseded this one
          // (user tapped a second link mid-poll). Without this, the
          // first poll could dispatch against the second invocation's
          // (different) session.
          if (invocationCounterRef.current !== thisInvocation) return;
          navigationRef.dispatch(
            CommonActions.navigate({ name: 'ResetPassword' }),
          );
        };
        if (navigationRef.isReady()) {
          navigateToReset();
        } else {
          let attempts = 0;
          // Store on the ref so unmount cleanup and the
          // next-invocation cancel both have access to clear it.
          pollIntervalRef.current = setInterval(() => {
            // Abort if a newer invocation has started — that invocation
            // either cleared the old interval already (in the new
            // handleUrl), or this stale tick should self-terminate.
            if (invocationCounterRef.current !== thisInvocation) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              return;
            }
            attempts += 1;
            if (navigationRef.isReady()) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              navigateToReset();
            } else if (attempts >= 50) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              if (__DEV__) {
                console.warn(
                  '[useDeepLinkAuth] navigationRef never became ready; reset-password navigate dropped',
                );
              }
            }
          }, 100);
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
      // Clear any in-flight poll so the interval doesn't outlive the
      // component (was a small leak + could fire navigate after the
      // root provider unmounted).
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);
}
