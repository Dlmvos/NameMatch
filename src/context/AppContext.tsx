import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useRoomState } from './RoomContext';
import { getEffectiveLanguage } from '../services/languageService';
import { RoomService } from '../services/RoomService';
import { ensureNameNestStorageMigration } from '../lib/storageBrandMigration';
import { devWarn } from '../lib/devWarn';

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
  clearDevUnlockedPacks: () => Promise<void>;
  isCountryPrefHydrated: boolean;
  isUnlockedPacksHydrated: boolean;
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
const DEBUG_PREMIUM = false;

/**
 * Maps ISO 3166-1 alpha-2 to `CountryOption.name` (`src/data/countries.ts`) so
 * residence strings match onboarding / currency `toI18nKey` lookups.
 */
const ISO_ALPHA2_TO_RESIDENCE_COUNTRY: Record<string, string> = {
  NL: 'Netherlands',
  DE: 'Germany',
  FR: 'France',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  IT: 'Italy',
  ES: 'Spain',
  PL: 'Poland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  BE: 'Belgium',
  PT: 'Portugal',
  FI: 'Finland',
  AT: 'Austria',
  CH: 'Switzerland',
  IE: 'Ireland',
  CZ: 'Czech Republic',
  HU: 'Hungary',
  RO: 'Romania',
  GR: 'Greece',
  RU: 'Russia',
  US: 'USA',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  CN: 'China',
  JP: 'Japan',
  IN: 'India',
  KR: 'South Korea',
  ID: 'Indonesia',
  PH: 'Philippines',
  VN: 'Vietnam',
  TH: 'Thailand',
  MY: 'Malaysia',
  SG: 'Singapore',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  TR: 'Turkey',
  IR: 'Iran',
  EG: 'Egypt',
  MA: 'Morocco',
  DZ: 'Algeria',
  TN: 'Tunisia',
  IL: 'Israel',
  JO: 'Jordan',
  LB: 'Lebanon',
  SA: 'Saudi Arabia',
  AE: 'UAE',
  KW: 'Kuwait',
  QA: 'Qatar',
  BH: 'Bahrain',
  OM: 'Oman',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  CO: 'Colombia',
  PE: 'Peru',
  CL: 'Chile',
  VE: 'Venezuela',
  ZA: 'South Africa',
  NG: 'Nigeria',
  KE: 'Kenya',
};

/** When `Intl.Locale.region` is missing (e.g. generic `en`), infer ISO2 from common IANA zones. */
const TIME_ZONE_CITY_TO_ALPHA2: Record<string, string> = {
  Madrid: 'ES',
  Barcelona: 'ES',
  Paris: 'FR',
  Berlin: 'DE',
  Amsterdam: 'NL',
  Brussels: 'BE',
  London: 'GB',
  Lisbon: 'PT',
  Rome: 'IT',
  Warsaw: 'PL',
  Stockholm: 'SE',
  Oslo: 'NO',
  Copenhagen: 'DK',
  Vienna: 'AT',
  Zurich: 'CH',
  Dublin: 'IE',
  Prague: 'CZ',
  New_York: 'US',
  Los_Angeles: 'US',
  Chicago: 'US',
  Detroit: 'US',
  Phoenix: 'US',
  Denver: 'US',
  Toronto: 'CA',
  Vancouver: 'CA',
  Montreal: 'CA',
  Mexico_City: 'MX',
  Tokyo: 'JP',
  Seoul: 'KR',
  Shanghai: 'CN',
  Mumbai: 'IN',
  Sydney: 'AU',
  Melbourne: 'AU',
  Auckland: 'NZ',
  Wellington: 'NZ',
  Sao_Paulo: 'BR',
  Buenos_Aires: 'AR',
  Bogota: 'CO',
  Lima: 'PE',
  Santiago: 'CL',
  Johannesburg: 'ZA',
};

function alpha2FromTimeZoneFallback(timeZone: string): string | null {
  const i = timeZone.lastIndexOf('/');
  if (i < 0 || i >= timeZone.length - 1) return null;
  const city = timeZone.slice(i + 1);
  return TIME_ZONE_CITY_TO_ALPHA2[city] ?? null;
}

/**
 * Default residence only when Supabase + AsyncStorage are both unset (fresh install /
 * migration). Explicit user picks always win via remote/cache.
 */
function deriveDefaultResidenceCountryFromDevice(): string | null {
  try {
    const localeTag = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    const loc = new Intl.Locale(localeTag);
    const raw = typeof loc.region === 'string' ? loc.region.trim() : '';
    if (/^[a-z]{2}$/i.test(raw)) {
      const name = ISO_ALPHA2_TO_RESIDENCE_COUNTRY[raw.toUpperCase()];
      if (name) return name;
    }
  } catch {
    // Intl.Locale / region unsupported — try timeZone only below
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz !== 'string' || !tz) return null;
    const alpha2 = alpha2FromTimeZoneFallback(tz);
    if (!alpha2) return null;
    return ISO_ALPHA2_TO_RESIDENCE_COUNTRY[alpha2] ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { room } = useRoomState();

  useEffect(() => {
    if (!__DEV__ || !DEBUG_PREMIUM) return;
    console.log('[AppProvider] mounted (session present — onboarding or main)');
  }, []);

  const [countryPreference, setCountryPreferenceState] = useState<string | null>(null);
  const [residenceCountry, setResidenceCountryState] = useState<string | null>(null);
  const [languagePreference, setLanguagePreferenceState] = useState<string | null>(null);
  const [devUnlockedPacks, setDevUnlockedPacks] = useState<string[]>([]);
  const [isCountryPrefHydrated, setIsCountryPrefHydrated] = useState(false);
  const [isUnlockedPacksHydrated, setIsUnlockedPacksHydrated] = useState(false);
  const devUnlockedPacksRequestRef = useRef(0);

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
    const requestId = ++devUnlockedPacksRequestRef.current;
    setIsUnlockedPacksHydrated(false);
    if (!user?.id || !__DEV__) {
      if (requestId === devUnlockedPacksRequestRef.current) {
        setDevUnlockedPacks([]);
      }
      setIsUnlockedPacksHydrated(true);
      return;
    }
    const localPacks = await getDevUnlockedPacks();
    if (requestId === devUnlockedPacksRequestRef.current) {
      setDevUnlockedPacks(localPacks);
      setIsUnlockedPacksHydrated(true);
    }
  }, [user?.id, getDevUnlockedPacks]);

  const clearDevUnlockedPacks = useCallback(async () => {
    const requestId = ++devUnlockedPacksRequestRef.current;
    setIsUnlockedPacksHydrated(false);
    if (__DEV__) {
      await AsyncStorage.removeItem(DEV_UNLOCKED_PACKS_KEY).catch(() => {});
    }
    if (requestId === devUnlockedPacksRequestRef.current) {
      setDevUnlockedPacks([]);
      setIsUnlockedPacksHydrated(true);
    }
  }, []);

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

    // Canonical remote row already has both — avoid flipping hydration off/on (would gate SwipeDeck
    // via isCountryPrefHydrated and skip queued deck rebuilds until AsyncStorage settles).
    if (!shouldFallbackCountry && !shouldFallbackResidence) {
      setCountryPreferenceState(remoteCountry);
      setResidenceCountryState(remoteResidence);
      setIsCountryPrefHydrated(true);
      return;
    }

    setIsCountryPrefHydrated(false);

    const migrationPromise = ensureNameNestStorageMigration().catch(devWarn('AppContext: storage brand migration'));
    const countryPromise = shouldFallbackCountry
      ? migrationPromise.then(() => AsyncStorage.getItem(COUNTRY_PREF_KEY(user.id)).catch(() => null))
      : Promise.resolve(null);
    const residencePromise = shouldFallbackResidence
      ? migrationPromise.then(() => AsyncStorage.getItem(RESIDENCE_COUNTRY_KEY(user.id)).catch(() => null))
      : Promise.resolve(null);

    Promise.all([countryPromise, residencePromise])
      .then(([countryVal, residenceVal]) => {
        const finalCountry = remoteCountry ?? countryVal;
        let deviceDerivedResidence: string | null = null;
        if (remoteResidence === null && !residenceVal) {
          deviceDerivedResidence = deriveDefaultResidenceCountryFromDevice();
        }
        const finalResidence = remoteResidence ?? residenceVal ?? deviceDerivedResidence;

        setCountryPreferenceState(finalCountry ?? null);
        setResidenceCountryState(finalResidence ?? null);
        setIsCountryPrefHydrated(true);

        const update: Record<string, unknown> = {};
        if (remoteCountry === null && countryVal) update.country_preference = countryVal;
        const residenceToPersist =
          remoteResidence === null ? (residenceVal ?? deviceDerivedResidence) ?? null : null;
        if (residenceToPersist) {
          update.residence_country = residenceToPersist;
          if (!residenceVal && deviceDerivedResidence && user.id) {
            void AsyncStorage.setItem(RESIDENCE_COUNTRY_KEY(user.id), residenceToPersist).catch(devWarn('AppContext: persist residence country (hydrate)'));
          }
        }
        if (Object.keys(update).length > 0) {
          void updateProfile(update as any)
            .then(() => refreshProfile())
            .catch(devWarn('AppContext: country/residence hydrate profile write'));
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
    const prevValue = countryPreference;
    setCountryPreferenceState(country);
    if (!user?.id) return;

    // Optimistic + rollback. Set local UI immediately, write AsyncStorage
    // cache, then attempt the remote profile update. If the remote write
    // fails (network drop, RLS rejection, server error), restore the
    // previous local + cached value so the next bootstrap reads what
    // Supabase actually has. Without rollback, a failed Settings change
    // shows "saved" optimistically but reverts mysteriously after restart
    // when the profile fetch overrides local state.
    const uidAtStart = user.id;
    await AsyncStorage.setItem(COUNTRY_PREF_KEY(user.id), country)
      .catch(devWarn('AppContext: persist country pref'));
    try {
      await updateProfile({ country_preference: country });
    } catch (err) {
      // Roll back local state + AsyncStorage only if the user hasn't
      // signed out in the meantime (orphan-write avoidance).
      if (user?.id === uidAtStart) {
        setCountryPreferenceState(prevValue);
        if (prevValue) {
          await AsyncStorage.setItem(COUNTRY_PREF_KEY(uidAtStart), prevValue)
            .catch(devWarn('AppContext: rollback country pref'));
        } else {
          await AsyncStorage.removeItem(COUNTRY_PREF_KEY(uidAtStart))
            .catch(devWarn('AppContext: rollback (clear) country pref'));
        }
      }
      throw err;
    }
  };

  const setResidenceCountry = async (country: string | null) => {
    const prevValue = residenceCountry;
    setResidenceCountryState(country);
    if (!user?.id) return;

    const uidAtStart = user.id;
    if (!country) {
      await AsyncStorage.removeItem(RESIDENCE_COUNTRY_KEY(user.id))
        .catch(devWarn('AppContext: clear residence country'));
    } else {
      await AsyncStorage.setItem(RESIDENCE_COUNTRY_KEY(user.id), country)
        .catch(devWarn('AppContext: persist residence country'));
    }
    try {
      await updateProfile({ residence_country: country });
    } catch (err) {
      if (user?.id === uidAtStart) {
        setResidenceCountryState(prevValue);
        if (prevValue) {
          await AsyncStorage.setItem(RESIDENCE_COUNTRY_KEY(uidAtStart), prevValue)
            .catch(devWarn('AppContext: rollback residence country'));
        } else {
          await AsyncStorage.removeItem(RESIDENCE_COUNTRY_KEY(uidAtStart))
            .catch(devWarn('AppContext: rollback (clear) residence country'));
        }
      }
      throw err;
    }
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
          void updateProfile({ language_preference: val }).catch(devWarn('AppContext: language pref profile write (hydrate)'));
        }
      })
      .catch(devWarn('AppContext: language pref hydrate chain'));
  }, [user?.id, profile?.language_preference, updateProfile]);

  const setLanguagePreference = async (language: string | null) => {
    const prevValue = languagePreference;
    setLanguagePreferenceState(language);
    if (!user?.id) return;
    const uidAtStart = user.id;
    if (!language) {
      await AsyncStorage.removeItem(LANGUAGE_PREF_KEY(user.id))
        .catch(devWarn('AppContext: clear language pref'));
    } else {
      await AsyncStorage.setItem(LANGUAGE_PREF_KEY(user.id), language)
        .catch(devWarn('AppContext: persist language pref'));
    }
    try {
      await updateProfile({ language_preference: language });
    } catch (err) {
      // Same optimistic-rollback as country/residence above. Restore
      // the prior value so UI + cache stay aligned with what's on
      // Supabase if the write failed.
      if (user?.id === uidAtStart) {
        setLanguagePreferenceState(prevValue);
        if (prevValue) {
          await AsyncStorage.setItem(LANGUAGE_PREF_KEY(uidAtStart), prevValue)
            .catch(devWarn('AppContext: rollback language pref'));
        } else {
          await AsyncStorage.removeItem(LANGUAGE_PREF_KEY(uidAtStart))
            .catch(devWarn('AppContext: rollback (clear) language pref'));
        }
      }
      throw err;
    }
  };

  const deviceLanguage =
    Intl.DateTimeFormat().resolvedOptions().locale?.split(/[-_]/)[0] ?? 'en';
  const effectiveLanguage = getEffectiveLanguage(languagePreference, deviceLanguage);
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

  useEffect(() => {
    if (!__DEV__ || !DEBUG_PREMIUM) return;
    console.log('[PremiumDebug] profile:', profile?.purchased_packs ?? []);
    console.log('[PremiumDebug] room:', room?.premium_packs ?? []);
    console.log('[PremiumDebug] dev:', devUnlockedPacks);
    console.log('[PremiumDebug] effective:', effectiveUnlockedPacks);
  }, [profile?.purchased_packs, room?.premium_packs, devUnlockedPacks, effectiveUnlockedPacks]);

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
        clearDevUnlockedPacks,
        isCountryPrefHydrated,
        isUnlockedPacksHydrated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
