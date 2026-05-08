import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import type { CustomerInfo } from 'react-native-purchases';
import {
  supabase,
  supabaseStartupError,
} from '../lib/supabase';
import { Profile, PREMIUM_COUPLE_PACK_KEY } from '../types';
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

    const createdProfile = await ensureProfile(authUser);
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
          PurchaseService.logOut().catch((err) => {
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
                  await fetchProfile(authUser);
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

  // ── Auth actions ────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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

  const hydratePremiumFromRevenueCat = useCallback(
    async (customerInfoSeed?: CustomerInfo): Promise<boolean> => {
      if (!user) return false;
      let info: CustomerInfo | null = null;
      try {
        info = await PurchaseService.getCustomerInfo();
      } catch {
        info = customerInfoSeed ?? null;
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
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw new Error(error.message ?? 'Could not delete account.');

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
