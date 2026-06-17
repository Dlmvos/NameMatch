import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import type { CustomerInfo } from 'react-native-purchases';
import {
  supabase,
  supabaseStartupError,
} from '../lib/supabase';
import { Profile, PREMIUM_COUPLE_PACK_KEY } from '../types';
import { posthog } from '../analytics/posthog';
import { AnalyticsService } from '../services/AnalyticsService';
import {
  reloadFeatureFlags,
  resetFeatureFlagChangedSession,
} from '../services/featureFlags';
import { ProfileService } from '../services/ProfileService';
import { PurchaseService } from '../services/purchaseService';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
type SafeProfileUpdates = Partial<Pick<
  Profile,
  | 'display_name'
  | 'gender_preference'
  | 'region_preference'
  | 'room_id'
  | 'country_preference'
  | 'residence_country'
  | 'language_preference'
>>;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  startupError: string | null;
  retryStartup: () => void;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /**
   * Native Sign in with Apple. iOS-only. Uses ASAuthorizationAppleIDProvider
   * via expo-apple-authentication to get an identity_token from Apple, then
   * exchanges it for a Supabase session via signInWithIdToken. The token is
   * verified by Supabase using the Apple Sign In Secret Key (JWT signed by
   * the .p8 key) configured under Auth → Providers → Apple.
   * Throws on user cancel as well — callers should swallow ERR_CANCELED.
   */
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  // Safe profile updates: never include entitlement/system fields.
  updateProfile: (updates: SafeProfileUpdates) => Promise<void>;
  // Entitlements (free swipes / purchased packs) must not be mutated via updateProfile.
  consumeFreeSwipe: (count?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Writes RevenueCat premium_couple to Supabase and refreshes local profile (with optimistic fallback). */
  hydratePremiumFromRevenueCat: (customerInfoSeed?: CustomerInfo) => Promise<boolean>;
  /** Calls RevenueCat restore, then hydrate. Returns true when premium entitlement is active. */
  restorePurchases: () => Promise<boolean>;
  /** Permanently deletes the authenticated user (server-side) and clears local session. */
  deleteAccount: () => Promise<void>;
}

// ──────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ──────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  /** Guards against stale profile writes when auth changes mid-flight (deferred fetches). */
  const activeAuthUserIdRef = useRef<string | null>(null);
  /** Latest profile for stable callbacks (avoids stale reads without widening useCallback deps). */
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;
  /** Latest `refreshProfile` callback; populated below after its declaration. Lets the AppState
   * foreground listener stay mounted once (empty deps) and still call the current closure. */
  const refreshProfileRef = useRef<(() => Promise<void>) | null>(null);
  /** Avoid resetting PostHog on cold start before we know if a session exists. */
  const prevAnalyticsUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!posthog) return;
    const uid = user?.id ?? null;
    const prev = prevAnalyticsUserIdRef.current;
    prevAnalyticsUserIdRef.current = uid;
    if (uid) {
      posthog.identify(uid);
      resetFeatureFlagChangedSession();
      void reloadFeatureFlags();
    } else if (prev !== null) {
      posthog.reset();
    }
  }, [user?.id]);

  const ensureProfile = useCallback(async (authUser: User) => {
    return ProfileService.ensureProfile(
      authUser.id,
      authUser.user_metadata?.display_name ?? null,
    );
  }, []);

  const retryStartup = useCallback(() => {
    setStartupError(null);
    setIsLoading(true);
    setBootstrapAttempt((prev) => prev + 1);
  }, []);

  // Fetch profile from Supabase
  const fetchProfile = useCallback(async (authUser: User) => {
    const uid = authUser.id;
    const data = await ProfileService.fetchProfile(uid);
    if (activeAuthUserIdRef.current !== uid) {
      return null;
    }

    if (data) {
      setProfile(data as Profile);
      return data as Profile;
    }

    // No profile row found. Try to create one. If the underlying auth
    // user has been deleted server-side (e.g. via Supabase Studio, or
    // by the user's own Delete Account flow on another device), the
    // profiles.id FK to auth.users(id) will reject the insert with
    // Postgres code 23503 ("foreign_key_violation"). That's the
    // unambiguous signal that the device's session JWT outlived the
    // account — Supabase doesn't recheck user existence on signature
    // validation, so the device stays in a half-authenticated limbo
    // unless we explicitly sign out here.
    let createdProfile;
    try {
      createdProfile = await ensureProfile(authUser);
    } catch (err: any) {
      const errCode = err?.code ?? '';
      const errMessage = String(err?.message ?? err);
      const isFkViolation =
        errCode === '23503' ||
        errMessage.toLowerCase().includes('foreign key constraint');
      if (isFkViolation) {
        console.warn(
          '[AuthContext] profile insert rejected by FK to auth.users — account deleted; forcing signout',
        );
        try {
          AnalyticsService.track('signout_due_to_deleted_account', {
            user_id: uid,
          });
        } catch {}
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          if (__DEV__) {
            console.warn('[AuthContext] signOut after deleted-account detection failed:', signOutErr);
          }
        }
        activeAuthUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        // Friendly notice. Non-blocking — by the time the alert
        // shows, state is already cleared and the navigator routes
        // to Welcome/Auth.
        Alert.alert(
          'Account no longer available',
          'This account has been deleted. Please sign in to a different account or create a new one.',
        );
        return null;
      }
      // Any other error bubbles up to the caller (existing behaviour).
      throw err;
    }

    if (activeAuthUserIdRef.current !== uid) {
      return null;
    }
    setProfile(createdProfile as Profile);
    return createdProfile;
  }, [ensureProfile]);

  // Bootstrap on mount
  useEffect(() => {
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null;
    setStartupError(null);

    if (supabaseStartupError) {
      if (!__DEV__) {
        console.error('[AuthContext] startup config error:', supabaseStartupError);
      }
      activeAuthUserIdRef.current = null;
      setSession(null);
      setUser(null);
      setProfile(null);
      setStartupError(supabaseStartupError);
      setIsLoading(false);
      return;
    }

    try {
      PurchaseService.configure();
    } catch (err: any) {
      console.error('[AuthContext] purchase startup configure failed:', err?.message ?? err);
    }
    // Safety valve: if getSession() rejects or hangs (e.g. stale refresh token,
    // invalid/empty Supabase URL, network timeout), force-exit loading after 8 s
    // so the user sees WelcomeScreen instead of a frozen spinner.
    safetyTimeout = setTimeout(() => {
      const message = 'Startup took too long while restoring your session.';
      console.error('[AuthContext] startup timeout:', message);
      setStartupError(message);
      setIsLoading(false);
    }, 8000);

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        const bootUser = s?.user ?? null;
        activeAuthUserIdRef.current = bootUser?.id ?? null;
        setUser(bootUser);
        if (bootUser) {
          PurchaseService.logIn(bootUser.id).catch((err) => {
            console.error('[AuthContext] RevenueCat logIn failed after getSession:', err);
          });
          fetchProfile(bootUser)
            .catch((err) => {
              console.error('[AuthContext] fetchProfile failed after getSession:', err);
              setStartupError('Could not load your profile. Please try again.');
            })
            .finally(() => {
              if (safetyTimeout) clearTimeout(safetyTimeout);
              setIsLoading(false);
            });
        } else {
          if (safetyTimeout) clearTimeout(safetyTimeout);
          activeAuthUserIdRef.current = null;
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (safetyTimeout) clearTimeout(safetyTimeout);
        console.error('[AuthContext] getSession error:', err);
        setStartupError('Could not restore your session. Please try again.');
        activeAuthUserIdRef.current = null;
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        const nextUser = s?.user ?? null;
        const prevUserId = activeAuthUserIdRef.current;
        activeAuthUserIdRef.current = nextUser?.id ?? null;

        if (event === 'SIGNED_IN' && nextUser) {
          PurchaseService.logIn(nextUser.id).catch((err) => {
            console.error('[AuthContext] RevenueCat logIn failed:', err);
          });
        }
        if (event === 'SIGNED_OUT') {
          PurchaseService.logOut().catch((err: any) => {
            // RevenueCat throws "LogOut was called but the current user
            // is anonymous" when the user never identified with RC (e.g.
            // signed out before any purchase activity, or the deleted-
            // user FK-violation signout path). Not actionable — just
            // logging it as a warn keeps the dev console quieter.
            const msg = err?.message ?? String(err);
            if (msg.includes('current user is anonymous')) {
              if (__DEV__) console.log('[AuthContext] RevenueCat logOut skipped: anonymous user');
              return;
            }
            console.error('[AuthContext] RevenueCat logOut failed:', err);
          });
        }

        // Only show the full loading spinner when the user identity actually changes
        // (sign-in, sign-out, account switch).  TOKEN_REFRESHED / INITIAL_SESSION
        // events for the same user should NOT unmount the NavigationContainer.
        const isNewUser = nextUser?.id !== prevUserId;

        setSession(s);

        if (isNewUser) {
          // User identity changed (sign-in, sign-out, account switch).
          // Show full loading gate and fetch the profile.
          if (nextUser) {
            setIsLoading(true);
          }
          setUser(nextUser);

          if (nextUser) {
            const authUser = nextUser;
            setTimeout(() => {
              void (async () => {
                const authChangeTimeout = setTimeout(() => {
                  console.error('[AuthContext] auth state profile load timeout.');
                  setStartupError('Could not load your profile. Please try again.');
                  setIsLoading(false);
                }, 8000);
                try {
                  const loadedProfile = await fetchProfile(authUser);
                  // Link PostHog session to a stable user_id so every event
                  // from now on (and the historic anonymous events from the
                  // pre-auth session) attribute to one person. User-level
                  // properties are non-PII descriptors useful for cohorts.
                  AnalyticsService.identify(authUser.id, {
                    region: loadedProfile?.region_preference ?? null,
                    country: loadedProfile?.country_preference ?? null,
                    gender_preference: loadedProfile?.gender_preference ?? null,
                    has_partner: Boolean(loadedProfile?.room_id),
                    has_premium: Array.isArray(loadedProfile?.purchased_packs)
                      ? loadedProfile.purchased_packs.length > 0
                      : false,
                  });
                  // We can't distinguish signup vs signin at the Supabase
                  // auth state level — both fire SIGNED_IN. Emit a generic
                  // signin_completed; signup_completed is fired explicitly
                  // by the signUp() call below for the first-ever signin.
                  AnalyticsService.track('signin_completed');
                } catch (err) {
                  console.error('[AuthContext] fetchProfile failed after auth state change:', err);
                  setStartupError('Could not load your profile. Please try again.');
                } finally {
                  clearTimeout(authChangeTimeout);
                  setIsLoading(false);
                }
              })();
            }, 0);
          } else {
            setProfile(null);
            setIsLoading(false);
          }
        } else {
          // Same user (TOKEN_REFRESHED, INITIAL_SESSION repeat, etc.).
          // Only update the session — do NOT refetch the profile.
          // Refetching here races with in-flight updateProfile calls and can
          // revert optimistic state (e.g. gender_preference back to default),
          // which resets the navigator to PreferencesScreen.
        }
      },
    );

    return () => {
      if (safetyTimeout) clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [bootstrapAttempt, fetchProfile]);

  useEffect(() => {
    if (AppState.currentState === 'active') {
      void supabase.auth.startAutoRefresh();
    }

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void supabase.auth.startAutoRefresh();
        // Foreground profile refresh: triggers the server-side
        // `maybe_refill_daily_free_swipes` RPC inside `ProfileService.fetchProfile`,
        // so a user who kept the app resident across UTC midnight sees the +20
        // daily grant without needing to cold-start. Refs (not deps) keep the
        // listener mounted once. Best-effort — swallow errors so an offline
        // foreground tap never disrupts the session.
        if (profileRef.current) void refreshProfileRef.current?.().catch(() => {});
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      sub.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);

  // ── Auth actions ────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    AnalyticsService.track('signup_started');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    // signup_completed fires here on success; signin_completed will follow
    // automatically from the auth state change listener.
    AnalyticsService.track('signup_completed');
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Sign in with Apple is only available on iOS.');
    }
    // Lazy-require so non-iOS builds (Android, future web) don't try to
    // resolve the native module at boot. expo-apple-authentication ships
    // a no-op JS shim on other platforms but the require still pulls in
    // native types we'd rather skip.
    const AppleAuthentication = await import('expo-apple-authentication');

    AnalyticsService.track('signup_started', { provider: 'apple' });

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('No identity token returned from Apple.');
    }

    // Supabase verifies this token via the Apple JWKS plus the audience
    // claim (must match the Client IDs configured in Supabase Studio).
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      // `nonce` would be required if we passed one to signInAsync above;
      // omitted here because Apple only enforces it when present.
    });
    if (error) throw error;

    // Apple only returns the user's display name on FIRST sign-in. If
    // it's there, persist it onto the profile so we don't lose it.
    const fullName = credential.fullName;
    const displayName =
      [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ').trim();
    if (displayName) {
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser?.id) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', signedInUser.id);
      }
    }

    AnalyticsService.track('signup_completed', { provider: 'apple' });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Disconnect PostHog identity so the next session starts anonymous.
    // clearEvents already calls posthog.reset() and wipes the local
    // event buffer — same behaviour we want here.
    AnalyticsService.clearEvents().catch(() => {});
  };

  const updateProfile = useCallback(
    async (updates: SafeProfileUpdates) => {
      if (!user) throw new Error('Not authenticated');

      // Hard guardrail: entitlement mutations must go through dedicated methods/RPCs.
      if (
        Object.prototype.hasOwnProperty.call(updates, 'free_swipes_remaining') ||
        Object.prototype.hasOwnProperty.call(updates, 'purchased_packs')
      ) {
        throw new Error('Use entitlement mutation methods instead of updateProfile.');
      }

      // NOTE: ensureProfile removed — the handle_new_user trigger guarantees
      // the row exists after signup. Calling it here added an unnecessary
      // round-trip and could race with the real update below.

      const data = await ProfileService.updateProfile(user.id, updates);
      setProfile(data as Profile);
    },
    [user],
  );

  const consumeFreeSwipe = useCallback(
    async (count: number = 1) => {
      if (!user) throw new Error('Not authenticated');
      const safeCount = Math.max(1, Math.floor(count));

      // Optimistic local update so swipe deck gating stays correct.
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          free_swipes_remaining: Math.max(0, prev.free_swipes_remaining - safeCount),
          updated_at: new Date().toISOString(),
        };
      });

      try {
        const data = await ProfileService.consumeFreeSwipe(safeCount);

        if (typeof data === 'number') {
          setProfile((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              free_swipes_remaining: Math.max(0, data),
              updated_at: new Date().toISOString(),
            };
          });
        } else {
          // If RPC didn’t return an integer, fall back to a refresh.
          await fetchProfile(user);
        }
      } catch (err: any) {
        // Best-effort rollback: re-fetch profile; never block swipe behavior.
        console.error('[AuthContext] consumeFreeSwipe error:', err?.message ?? err);
        await fetchProfile(user);
      }
    },
    [fetchProfile, setProfile, user]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);
  refreshProfileRef.current = refreshProfile;

  const hydratePremiumFromRevenueCat = useCallback(
    async (customerInfoSeed?: CustomerInfo): Promise<boolean> => {
      if (!user) return false;
      let info: CustomerInfo | null = null;
      try {
        info = await PurchaseService.getCustomerInfo();
      } catch {
        info = customerInfoSeed ?? null;
      }
      // One-shot recovery: if the entitlement isn't visible yet (stale SDK cache, anon→
      // alias delay, or a webhook landing post-customerInfo), invalidate the cache and
      // restore once before giving up. `refreshAndRestore` is idempotent server-side.
      if (info && !PurchaseService.hasPremiumEntitlement(info)) {
        try {
          const restored = await PurchaseService.refreshAndRestore();
          if (PurchaseService.hasPremiumEntitlement(restored)) {
            info = restored;
          }
        } catch (err) {
          if (__DEV__) console.warn('[AuthContext] refreshAndRestore during hydrate:', err);
        }
      }
      if (!info || !PurchaseService.hasPremiumEntitlement(info)) return false;
      try {
        await PurchaseService.syncRevenueCatEntitlement();
      } catch (err) {
        if (__DEV__) console.warn('[AuthContext] syncRevenueCatEntitlement:', err);
      }
      const updated = await fetchProfile(user);
      if (updated && !updated.purchased_packs?.includes(PREMIUM_COUPLE_PACK_KEY)) {
        setProfile({
          ...updated,
          purchased_packs: Array.from(
            new Set([...(updated.purchased_packs ?? []), PREMIUM_COUPLE_PACK_KEY]),
          ),
        });
      }
      return true;
    },
    [user, fetchProfile],
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!user) throw new Error('Not authenticated');
    const info = await PurchaseService.restorePurchases();
    if (!PurchaseService.hasPremiumEntitlement(info)) {
      await refreshProfile();
      return false;
    }
    return hydratePremiumFromRevenueCat(info);
  }, [user, refreshProfile, hydratePremiumFromRevenueCat]);

  const deleteAccount = async () => {
    if (!user) throw new Error('Not authenticated');

    // Server-side SECURITY DEFINER RPC: deletes matches for rooms
    // where user is partner (user2), then deletes auth.users row.
    // FK cascades handle profiles → swipes, purchases, rooms (owner) → matches.
    const userIdToErase = user.id;
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw new Error(error.message ?? 'Could not delete account.');

    // GDPR: request PostHog person-deletion server-side (project API key stays
    // off-device). Best-effort — the Supabase row deletion already succeeded,
    // so a PostHog edge-function failure shouldn't block account deletion.
    // The user can re-issue via support if the edge call dropped.
    try {
      const { error: phErr } = await supabase.functions.invoke('delete-posthog-person', {
        body: { distinct_id: userIdToErase },
      });
      if (phErr && __DEV__) {
        console.warn('[AuthContext] PostHog deletion edge call failed:', phErr.message);
      }
    } catch (err) {
      if (__DEV__) console.warn('[AuthContext] PostHog deletion threw:', err);
    }

    // Clear the local PostHog identity + analytics queue so any in-flight or
    // queued events stop being associated with the deleted user.
    await AnalyticsService.clearEvents().catch(() => {
      /* best-effort */
    });

    await PurchaseService.logOut().catch(() => {
      /* best-effort */
    });
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError && __DEV__) {
      console.warn('[AuthContext] signOut after deleteAccount:', signOutError.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        startupError,
        retryStartup,
        signUp,
        signIn,
        signInWithApple,
        signOut,
        updateProfile,
        consumeFreeSwipe,
        refreshProfile,
        hydratePremiumFromRevenueCat,
        restorePurchases,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
