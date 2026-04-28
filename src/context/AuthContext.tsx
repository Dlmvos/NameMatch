import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
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
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Safe profile updates: never include entitlement/system fields.
  updateProfile: (updates: SafeProfileUpdates) => Promise<void>;
  // Entitlements (free swipes / purchased packs) must not be mutated via updateProfile.
  consumeFreeSwipe: (count?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  restorePurchases: () => Promise<void>;
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
  /** Guards against stale profile writes when auth changes mid-flight (deferred fetches). */
  const activeAuthUserIdRef = useRef<string | null>(null);

  const ensureProfile = useCallback(async (authUser: User) => {
    return ProfileService.ensureProfile(
      authUser.id,
      authUser.user_metadata?.display_name ?? null,
    );
  }, []);

  // Fetch profile from Supabase
  const fetchProfile = useCallback(async (authUser: User) => {
    const uid = authUser.id;
    const data = await ProfileService.fetchProfile(uid);
    if (activeAuthUserIdRef.current !== uid) {
      return null;
    }

    if (data) {
      if (__DEV__) {
        console.log('[AuthContext] profile found', { userId: uid });
      }
      setProfile(data as Profile);
      return data as Profile;
    }

    if (__DEV__) {
      console.warn('[AuthContext] profile missing, ensuring row exists', { userId: uid });
    }
    const createdProfile = await ensureProfile(authUser);
    if (activeAuthUserIdRef.current !== uid) {
      return null;
    }
    if (__DEV__) {
      console.log('[AuthContext] profile created successfully', { userId: uid });
    }
    setProfile(createdProfile as Profile);
    return createdProfile;
  }, [ensureProfile]);

  // Bootstrap on mount
  useEffect(() => {
    PurchaseService.configure();
    if (__DEV__) {
      console.log('[AuthContext] bootstrap: start getSession + 8s safety timer');
    }

    // Safety valve: if getSession() rejects or hangs (e.g. stale refresh token,
    // invalid/empty Supabase URL, network timeout), force-exit loading after 8 s
    // so the user sees WelcomeScreen instead of a frozen spinner.
    const safetyTimeout = setTimeout(() => {
      console.warn(
        '[AuthContext] branch: safety-timeout (8s) — forcing isLoading false',
      );
      setIsLoading(false);
    }, 8000);

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        clearTimeout(safetyTimeout);
        if (__DEV__) {
          console.log('[AuthContext] branch: getSession resolved', {
            hasSession: !!s,
            hasUser: !!s?.user,
          });
        }
        setSession(s);
        const bootUser = s?.user ?? null;
        activeAuthUserIdRef.current = bootUser?.id ?? null;
        setUser(bootUser);
        if (bootUser) {
          PurchaseService.logIn(bootUser.id).catch((err) => {
            console.error('[AuthContext] RevenueCat logIn failed after getSession:', err);
          });
          if (__DEV__) {
            console.log(
              '[AuthContext] branch: fetchProfile for user — isLoading clears in fetchProfile.finally',
            );
          }
          fetchProfile(bootUser)
            .catch((err) => {
              console.error('[AuthContext] fetchProfile failed after getSession:', err);
            })
            .finally(() => {
              if (__DEV__) {
                console.log(
                  '[AuthContext] fetchProfile settled — isLoading -> false',
                );
              }
              setIsLoading(false);
            });
        } else {
          if (__DEV__) {
            console.log(
              '[AuthContext] branch: no session user — isLoading -> false (immediate)',
            );
          }
          activeAuthUserIdRef.current = null;
          setIsLoading(false);
        }
      })
      .catch((err) => {
        clearTimeout(safetyTimeout);
        if (__DEV__) {
          console.log('[AuthContext] branch: getSession catch', err);
        }
        console.error('[AuthContext] getSession error:', err);
        activeAuthUserIdRef.current = null;
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        const nextUser = s?.user ?? null;
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

        if (nextUser) {
          setIsLoading(true);
        }
        setSession(s);
        setUser(nextUser);

        if (nextUser) {
          const authUser = nextUser;
          // Never await other Supabase calls inside this callback — it deadlocks auth-js
          // (profile fetch never completes, isLoading stays true). Defer to next macrotask.
          setTimeout(() => {
            void (async () => {
              try {
                await fetchProfile(authUser);
              } catch (err) {
                console.error('[AuthContext] fetchProfile failed after auth state change:', err);
              } finally {
                setIsLoading(false);
              }
            })();
          }, 0);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      },
    );

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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

  const updateProfile = async (updates: SafeProfileUpdates) => {
    if (!user) throw new Error('Not authenticated');

    // Hard guardrail: entitlement mutations must go through dedicated methods/RPCs.
    if (
      Object.prototype.hasOwnProperty.call(updates, 'free_swipes_remaining') ||
      Object.prototype.hasOwnProperty.call(updates, 'purchased_packs')
    ) {
      throw new Error('Use entitlement mutation methods instead of updateProfile.');
    }

    await ensureProfile(user);

    const displayName = profile?.display_name ?? user.user_metadata?.display_name ?? null;
    const data = await ProfileService.updateProfile(user.id, displayName, updates);
    setProfile(data as Profile);
  };

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

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const restorePurchases = async () => {
    if (!user) throw new Error('Not authenticated');
    const customerInfo = await PurchaseService.restorePurchases();
    await refreshProfile();
    if (PurchaseService.hasPremiumEntitlement(customerInfo)) {
      await PurchaseService.syncRevenueCatEntitlement();
      await refreshProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        consumeFreeSwipe,
        refreshProfile,
        restorePurchases,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
