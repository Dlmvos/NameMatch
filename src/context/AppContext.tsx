import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useRoomState } from './RoomContext';
import { getEffectiveLanguage } from '../services/languageService';
import { RoomService } from '../services/RoomService';
import { ensureNameNestStorageMigration } from '../lib/storageBrandMigration';

// ─────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────
interface AppContextValue {
  // Preferences (Supabase canonical; AsyncStorage used as cache/fallback)
  countryPreference: string | null;
  setCountryPreference: (country: string) => Promise<void>;
  residenceCountry: string | null;
  setResidenceCountry: (country: string | null) => Promise<void>;
  languagePreference: string | null;
  setLanguagePreference: (language: string | null) => Promise<void>;
  effectiveLanguage: string;
  effectiveUnlockedPacks: string[];
  refreshUnlockedPacks: () => Promise<void>;
  isCountryPrefHydrated: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

const COUNTRY_PREF_KEY = (uid: string) => `namenest:country_pref:${uid}`;
const RESIDENCE_COUNTRY_KEY = (uid: string) => `namenest:residence_country:${uid}`;
const LANGUAGE_PREF_KEY = (uid: string) => `namenest:language_pref:${uid}`;
const DEV_UNLOCKED_PACKS_KEY = 'NAMEMATCH_DEV_UNLOCKED_PACKS';

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { room } = useRoomState();

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[AppProvider] mounted (session present — onboarding or main)');
  }, []);

  const [countryPreference, setCountryPreferenceState] = useState<string | null>(null);
  const [residenceCountry, setResidenceCountryState] = useState<string | null>(null);
  const [languagePreference, setLanguagePreferenceState] = useState<string | null>(null);
  const [devUnlockedPacks, setDevUnlockedPacks] = useState<string[]>([]);
  const [isCountryPrefHydrated, setIsCountryPrefHydrated] = useState(false);

  const getDevUnlockedPacks = useCallback(async (): Promise<string[]> => {
    if (!__DEV__) return [];
    const raw = await AsyncStorage.getItem(DEV_UNLOCKED_PACKS_KEY).catch(() => null);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const refreshUnlockedPacks = useCallback(async () => {
    if (!user?.id || !__DEV__) {
      setDevUnlockedPacks([]);
      return;
    }
    const localPacks = await getDevUnlockedPacks();
    setDevUnlockedPacks(localPacks);
  }, [user?.id, getDevUnlockedPacks]);

  // ── Hydrate country/residence preferences (Supabase primary) ───────────────────────
  useEffect(() => {
    if (!user?.id) {
      setCountryPreferenceState(null);
      setResidenceCountryState(null);
      setIsCountryPrefHydrated(true);
      return;
    }
    const remoteCountry = profile?.country_preference ?? null;
    const remoteResidence = profile?.residence_country ?? null;

    const shouldFallbackCountry = remoteCountry === null;
    const shouldFallbackResidence = remoteResidence === null;

    setIsCountryPrefHydrated(false);

    const migrationPromise = ensureNameNestStorageMigration().catch(() => {});
    const countryPromise = shouldFallbackCountry
      ? migrationPromise.then(() => AsyncStorage.getItem(COUNTRY_PREF_KEY(user.id)).catch(() => null))
      : Promise.resolve(null);
    const residencePromise = shouldFallbackResidence
      ? migrationPromise.then(() => AsyncStorage.getItem(RESIDENCE_COUNTRY_KEY(user.id)).catch(() => null))
      : Promise.resolve(null);

    Promise.all([countryPromise, residencePromise])
      .then(([countryVal, residenceVal]) => {
        const finalCountry = remoteCountry ?? countryVal;
        const finalResidence = remoteResidence ?? residenceVal;

        setCountryPreferenceState(finalCountry ?? null);
        setResidenceCountryState(finalResidence ?? null);
        setIsCountryPrefHydrated(true);

        // If we had to fall back, persist those values to Supabase so remote becomes canonical.
        const update: Record<string, unknown> = {};
        if (remoteCountry === null && countryVal) update.country_preference = countryVal;
        if (remoteResidence === null && residenceVal) update.residence_country = residenceVal;
        if (Object.keys(update).length > 0) {
          void updateProfile(update as any)
            .then(() => refreshProfile())
            .catch(() => {});
        }
      })
      .catch(() => {
        // Worst-case unblock deck generation.
        setIsCountryPrefHydrated(true);
      });
  }, [
    user?.id,
    profile?.country_preference,
    profile?.residence_country,
    updateProfile,
    refreshProfile,
  ]);

  useEffect(() => {
    void refreshUnlockedPacks();
  }, [refreshUnlockedPacks]);

  useEffect(() => {
    const roomId = room?.id ?? profile?.room_id ?? null;
    const localEntitlements = [...new Set([...(profile?.purchased_packs ?? []), ...devUnlockedPacks])];
    if (!roomId || localEntitlements.length === 0) return;
    const missing = localEntitlements.filter((pack) => !(room?.premium_packs ?? []).includes(pack));
    if (missing.length === 0) return;
    RoomService.grantRoomPremiumPacks(roomId, missing).catch((err) => {
      if (__DEV__) {
        console.error('[AppProvider] room premium sync failed:', err?.message ?? err);
      }
    });
  }, [devUnlockedPacks, profile?.purchased_packs, profile?.room_id, room?.id, room?.premium_packs]);

  const setCountryPreference = async (country: string) => {
    setCountryPreferenceState(country);
    if (!user?.id) return;

    try {
      // Supabase becomes canonical; AsyncStorage is kept as local cache.
      await updateProfile({ country_preference: country });
    } catch {
      // best-effort; never block UX
    }

    await AsyncStorage.setItem(COUNTRY_PREF_KEY(user.id), country).catch(() => {});
  };

  const setResidenceCountry = async (country: string | null) => {
    setResidenceCountryState(country);
    if (!user?.id) return;

    try {
      await updateProfile({ residence_country: country });
    } catch {
      // best-effort; never block UX
    }

    if (!country) {
      await AsyncStorage.removeItem(RESIDENCE_COUNTRY_KEY(user.id)).catch(() => {});
      return;
    }

    await AsyncStorage.setItem(RESIDENCE_COUNTRY_KEY(user.id), country).catch(() => {});
  };

  useEffect(() => {
    if (!user?.id) {
      setLanguagePreferenceState(null);
      return;
    }

    const remoteLanguage = profile?.language_preference ?? null;
    if (remoteLanguage !== null) {
      setLanguagePreferenceState(remoteLanguage);
      return;
    }

    // Remote missing: fallback to local cache and persist to Supabase.
    setLanguagePreferenceState(null);
    ensureNameNestStorageMigration()
      .then(() => AsyncStorage.getItem(LANGUAGE_PREF_KEY(user.id)))
      .then((val) => {
        const finalVal = val ?? null;
        setLanguagePreferenceState(finalVal);
        if (val) {
          void updateProfile({ language_preference: val }).catch(() => {});
        }
      })
      .catch(() => {});
  }, [user?.id, profile?.language_preference, updateProfile]);

  const setLanguagePreference = async (language: string | null) => {
    setLanguagePreferenceState(language);
    if (!user?.id) return;
    try {
      await updateProfile({ language_preference: language });
    } catch {
      // best-effort; never block UX
    }

    if (!language) {
      await AsyncStorage.removeItem(LANGUAGE_PREF_KEY(user.id)).catch(() => {});
      return;
    }

    await AsyncStorage.setItem(LANGUAGE_PREF_KEY(user.id), language).catch(() => {});
  };

  const deviceLanguage =
    Intl.DateTimeFormat().resolvedOptions().locale?.split(/[-_]/)[0] ?? 'en';
  const effectiveLanguage = getEffectiveLanguage(
    languagePreference,
    countryPreference ?? undefined,
    deviceLanguage,
  );
  const effectiveUnlockedPacks = useMemo(
    () => [
      ...new Set([
        ...(profile?.purchased_packs ?? []),
        ...(room?.premium_packs ?? []),
        ...devUnlockedPacks,
      ]),
    ],
    [profile?.purchased_packs, room?.premium_packs, devUnlockedPacks],
  );

  return (
    <AppContext.Provider
      value={{
        countryPreference,
        setCountryPreference,
        residenceCountry,
        setResidenceCountry,
        languagePreference,
        setLanguagePreference,
        effectiveLanguage,
        effectiveUnlockedPacks,
        refreshUnlockedPacks,
        isCountryPrefHydrated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
