import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { supabase } from '../lib/supabase';

export const ENTITLEMENT_ID = 'premium_couple';
export const PREMIUM_ENTITLEMENT_DISPLAY_NAME = 'Babinom Premium';
export const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? '';
export const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? '';
// Dev/Expo Go only. Gated by __DEV__ so the env var is dead-code-eliminated from
// production bundles (Metro replaces __DEV__ with false, the minifier drops the branch),
// guaranteeing EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY is never inlined into release JS.
export const RC_TEST_STORE_API_KEY = __DEV__
  ? (process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY?.trim() ?? '')
  : '';

export type PremiumOfferingPackages = {
  lifetime: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
  /** When current offering lacks lifetime/monthly presets, entitlement-matched SKU (legacy setups). */
  legacy: PurchasesPackage | null;
};

export type PurchasePremiumResult =
  | { success: true; customerInfo: CustomerInfo }
  | { success: false; cancelled: true }
  | { success: false; unavailable: true; reason: string };

let didConfigure = false;
let purchasesDisabledReason: string | null = null;
/**
 * Tracks the userId we last logged into RC with. Used by `purchasePremium` to assert RC is
 * logged in as the expected (Supabase) user *before* the purchase fires, so the transaction
 * attribution and webhook payload land under the right subscriber from the start — closes
 * the anonymous-purchase → aliased-subscriber race that hides entitlements later.
 */
let expectedAppUserId: string | null = null;
const warnedDisabledMethods = new Set<string>();

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function isValidRevenueCatKey(apiKey: string, prefix: 'test_' | 'appl_' | 'goog_'): boolean {
  return apiKey.startsWith(prefix) && apiKey.length > prefix.length && !apiKey.includes('REVENUECAT_');
}

function isValidTestStoreKey(apiKey: string): boolean {
  return isValidRevenueCatKey(apiKey, 'test_');
}

function isValidPlatformKey(apiKey: string): boolean {
  if (Platform.OS === 'ios') return isValidRevenueCatKey(apiKey, 'appl_');
  if (Platform.OS === 'android') return isValidRevenueCatKey(apiKey, 'goog_');
  return false;
}

/** First chars only — never log full API keys. */
function maskKeyPrefix(apiKey: string): string {
  const t = apiKey.trim();
  if (!t) return '(none)';
  const head = t.slice(0, 8);
  return t.length > 8 ? `${head}…` : head;
}

function getPlatformApiKey(): string {
  return Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
}

function resolveRevenueCatApiKey(): { apiKey: string | null; reason?: string } {
  // Expo Go only runs the dev bundle, so __DEV__ is always true here; gating with
  // __DEV__ lets the minifier strip this test-store branch from production builds.
  if (__DEV__ && isExpoGo()) {
    return isValidTestStoreKey(RC_TEST_STORE_API_KEY)
      ? { apiKey: RC_TEST_STORE_API_KEY }
      : { apiKey: null, reason: 'RevenueCat Test Store key is missing or invalid in Expo Go.' };
  }

  const platformApiKey = getPlatformApiKey();
  if (isValidPlatformKey(platformApiKey)) {
    return { apiKey: platformApiKey };
  }

  if (__DEV__ && isValidTestStoreKey(RC_TEST_STORE_API_KEY)) {
    return { apiKey: RC_TEST_STORE_API_KEY };
  }

  return {
    apiKey: null,
    reason: __DEV__
      ? 'RevenueCat platform key is missing/invalid, and no valid Test Store key is configured.'
      : 'RevenueCat platform key is missing or invalid.',
  };
}

function setDevLogLevel(): void {
  if (!__DEV__) return;
  const purchasesWithLogLevel = Purchases as typeof Purchases & {
    setLogLevel?: (level: LOG_LEVEL) => void;
  };
  try {
    purchasesWithLogLevel.setLogLevel?.(LOG_LEVEL.DEBUG);
  } catch {
    // Logging configuration should never block app startup.
  }
}

function warnPurchasesUnavailable(method: string): void {
  if (warnedDisabledMethods.has(method)) return;
  warnedDisabledMethods.add(method);
  const reason = purchasesDisabledReason ?? 'RevenueCat has not been configured.';
  const message = `[PurchaseService] ${method} skipped: ${reason}`;
  // __DEV__-gated so the help text naming the test-store env var is stripped from release builds.
  if (__DEV__ && isExpoGo()) {
    console.warn(
      `${message} ` +
        'Use a native development build, production build, or set EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY.',
    );
    return;
  }
  if (__DEV__) {
    console.warn(message);
    return;
  }
  console.error(message);
}

function purchasesUnavailableError(method: string): Error {
  const reason = purchasesDisabledReason ?? 'RevenueCat has not been configured.';
  return new Error(`${method} is unavailable: ${reason}`);
}

function canUsePurchases(method: string): boolean {
  if (didConfigure) return true;
  warnPurchasesUnavailable(method);
  return false;
}

/**
 * Product identifiers that grant premium access. Used as a defensive fallback in
 * `hasPremiumEntitlement` so a single entitlement-key rename on the RC dashboard
 * (or an "Unattached"-style display state) can't silently lock paying users out.
 */
export const PREMIUM_PRODUCT_IDS = ['premium_couple', 'premium_monthly'] as const;

export function hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
  if (customerInfo.entitlements.active[ENTITLEMENT_ID]) return true;
  // Fallback: any active entitlement whose backing product is one of ours counts as premium.
  for (const entitlement of Object.values(customerInfo.entitlements.active)) {
    const pid = entitlement?.productIdentifier;
    if (pid && (PREMIUM_PRODUCT_IDS as readonly string[]).includes(pid)) {
      return true;
    }
  }
  return false;
}

function pickLifetimeFromOffering(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) return null;
  return (
    offering.lifetime ??
    offering.availablePackages.find((pkg) => pkg.packageType === PACKAGE_TYPE.LIFETIME) ??
    null
  );
}

function pickMonthlyFromOffering(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) return null;
  return (
    offering.monthly ??
    offering.availablePackages.find((pkg) => pkg.packageType === PACKAGE_TYPE.MONTHLY) ??
    null
  );
}

function scanOfferingsForPackageType(
  offerings: PurchasesOfferings,
  packageType: PACKAGE_TYPE,
): PurchasesPackage | null {
  for (const offering of Object.values(offerings.all)) {
    const preset =
      packageType === PACKAGE_TYPE.LIFETIME
        ? offering.lifetime
        : packageType === PACKAGE_TYPE.MONTHLY
          ? offering.monthly
          : null;
    if (preset) return preset;
    const fromAvailable = offering.availablePackages.find((p) => p.packageType === packageType);
    if (fromAvailable) return fromAvailable;
  }
  return null;
}

function resolvePremiumSlots(offerings: PurchasesOfferings): {
  lifetime: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
} {
  const lifetime =
    pickLifetimeFromOffering(offerings.current) ??
    scanOfferingsForPackageType(offerings, PACKAGE_TYPE.LIFETIME);
  const monthly =
    pickMonthlyFromOffering(offerings.current) ??
    scanOfferingsForPackageType(offerings, PACKAGE_TYPE.MONTHLY);
  return { lifetime, monthly };
}

function resolveLegacyPremiumPackage(offerings: PurchasesOfferings): PurchasesPackage | null {
  const flat = Object.values(offerings.all).flatMap((offering) => offering.availablePackages);
  return (
    offerings.current?.availablePackages.find(
      (pkg) => pkg.identifier === ENTITLEMENT_ID || pkg.product.identifier === ENTITLEMENT_ID,
    ) ??
    offerings.current?.lifetime ??
    flat.find((pkg) => pkg.identifier === ENTITLEMENT_ID || pkg.product.identifier === ENTITLEMENT_ID) ??
    null
  );
}

function isPurchaseCancelled(err: unknown): boolean {
  const maybeError = err as { code?: string; userCancelled?: boolean | null };
  return (
    maybeError.userCancelled === true ||
    maybeError.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

/** Dev and release device logs (TestFlight / App Store connect) — never surfaces in UI. */
function shouldLogPurchaseFailureDiagnostics(): boolean {
  if (__DEV__) return true;
  return (
    Constants.executionEnvironment === 'standalone' ||
    Constants.executionEnvironment === 'bare'
  );
}

export type PurchaseFailureDiagnosticContext = {
  selectedPackage?: PurchasesPackage | null;
  offeringsLoadedCount?: number;
  customerInfo?: CustomerInfo | null;
  /** e.g. paywall_purchase, missing_entitlement */
  phase?: string;
};

function readRevenueCatErrorFields(err: unknown): {
  code: string | number | null;
  message: string | null;
  userCancelled: boolean | null;
  underlyingErrorMessage: string | null;
  readableErrorCode: string | null;
} {
  const e = err as {
    code?: string | number;
    message?: string;
    userCancelled?: boolean | null;
    underlyingErrorMessage?: string;
    readableErrorCode?: string;
  };
  return {
    code: e?.code ?? null,
    message: typeof e?.message === 'string' ? e.message : null,
    userCancelled: e?.userCancelled ?? null,
    underlyingErrorMessage:
      typeof e?.underlyingErrorMessage === 'string' ? e.underlyingErrorMessage : null,
    readableErrorCode: typeof e?.readableErrorCode === 'string' ? e.readableErrorCode : null,
  };
}

function summarizeCustomerInfoEntitlements(customerInfo: CustomerInfo | null | undefined): {
  customerInfoLoaded: boolean;
  premiumEntitlementActive: boolean;
  activeEntitlementKeys: string[];
  premiumExpirationDate: string | null;
  premiumWillRenew: boolean | null;
} {
  if (!customerInfo) {
    return {
      customerInfoLoaded: false,
      premiumEntitlementActive: false,
      activeEntitlementKeys: [],
      premiumExpirationDate: null,
      premiumWillRenew: null,
    };
  }
  const premium = customerInfo.entitlements.active[ENTITLEMENT_ID];
  return {
    customerInfoLoaded: true,
    premiumEntitlementActive: Boolean(premium),
    activeEntitlementKeys: Object.keys(customerInfo.entitlements.active),
    premiumExpirationDate: premium?.expirationDate ?? null,
    premiumWillRenew: premium?.willRenew ?? null,
  };
}

/** Structured purchase-failure snapshot for __DEV__ / TestFlight device console. */
export function logPurchaseFailureDiagnostics(
  err: unknown,
  context: PurchaseFailureDiagnosticContext = {},
): void {
  if (!shouldLogPurchaseFailureDiagnostics()) return;

  const rc = readRevenueCatErrorFields(err);
  const pkg = context.selectedPackage ?? null;

  console.warn('[PurchaseService] purchase failure diagnostics', {
    phase: context.phase ?? 'purchase',
    code: rc.code,
    message: rc.message,
    userCancelled: rc.userCancelled,
    underlyingErrorMessage: rc.underlyingErrorMessage,
    readableErrorCode: rc.readableErrorCode,
    packageIdentifier: pkg?.identifier ?? null,
    productIdentifier: pkg?.product.identifier ?? null,
    selectedPackageType: pkg?.packageType ?? null,
    offeringsLoadedCount: context.offeringsLoadedCount ?? null,
    ...summarizeCustomerInfoEntitlements(context.customerInfo),
  });
}

function logDevConfigureAttempt(resolved: { apiKey: string | null }): void {
  if (!__DEV__) return;
  const usedTestStore = Boolean(resolved.apiKey && isValidTestStoreKey(resolved.apiKey));
  console.log('[PurchaseService] configure attempt', {
    platform: Platform.OS,
    isExpoGo: isExpoGo(),
    hasIosKey: isValidRevenueCatKey(RC_API_KEY_IOS, 'appl_'),
    hasAndroidKey: isValidRevenueCatKey(RC_API_KEY_ANDROID, 'goog_'),
    hasTestStoreKey: isValidTestStoreKey(RC_TEST_STORE_API_KEY),
    usedTestStore,
    iosKeyPrefix: maskKeyPrefix(RC_API_KEY_IOS),
    androidKeyPrefix: maskKeyPrefix(RC_API_KEY_ANDROID),
    testStoreKeyPrefix: maskKeyPrefix(RC_TEST_STORE_API_KEY),
    resolved: resolved.apiKey ? 'configured' : 'no_key',
  });
}

function logDevPremiumOfferingResolution(
  source: 'getPremiumOfferingPackages' | 'getPremiumPackage',
  offerings: PurchasesOfferings,
  lifetime: PurchasesPackage | null,
  monthly: PurchasesPackage | null,
  legacy: PurchasesPackage | null,
): void {
  if (!__DEV__) return;
  console.log(`[PurchaseService] ${source}`, {
    currentOfferingId: offerings.current?.identifier ?? null,
    hasLifetime: Boolean(lifetime),
    hasMonthly: Boolean(monthly),
    hasLegacy: Boolean(legacy),
  });
}

export const PurchaseService = {
  configure(): void {
    if (didConfigure) return;
    const { apiKey, reason } = resolveRevenueCatApiKey();
    logDevConfigureAttempt({ apiKey });
    if (!apiKey) {
      purchasesDisabledReason = reason ?? 'RevenueCat API key is missing or invalid.';
      warnPurchasesUnavailable('configure');
      return;
    }
    setDevLogLevel();
    try {
      Purchases.configure({ apiKey });
      didConfigure = true;
      purchasesDisabledReason = null;
    } catch (err: any) {
      purchasesDisabledReason = err?.message ?? 'RevenueCat configure failed.';
      console.error('[PurchaseService] configure failed:', purchasesDisabledReason);
    }
  },

  async logIn(userId: string): Promise<void> {
    if (!canUsePurchases('logIn')) return;
    await Purchases.logIn(userId);
    expectedAppUserId = userId;
  },

  async logOut(): Promise<void> {
    if (!canUsePurchases('logOut')) return;
    await Purchases.logOut();
    expectedAppUserId = null;
  },

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!canUsePurchases('getCustomerInfo')) {
      throw purchasesUnavailableError('getCustomerInfo');
    }
    return await Purchases.getCustomerInfo();
  },

  async purchasePremium(selectedPackage?: PurchasesPackage): Promise<PurchasePremiumResult> {
    if (!canUsePurchases('purchasePremium')) {
      const reason = purchasesDisabledReason ?? 'RevenueCat has not been configured.';
      if (!__DEV__) throw purchasesUnavailableError('purchasePremium');
      return { success: false, unavailable: true, reason };
    }
    // Defense: ensure RC is logged in as the expected (Supabase) user *before* purchasePackage.
    // Without this, a paywall tap that lands before the AuthContext-side `logIn(uid)` resolves
    // attributes the purchase to the anonymous appUserID. The transaction still records, but
    // the entitlement later reads under a different subscriber and silently appears empty.
    if (expectedAppUserId) {
      try {
        const currentId = await Purchases.getAppUserID();
        if (currentId !== expectedAppUserId) {
          await Purchases.logIn(expectedAppUserId);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[PurchaseService] pre-purchase logIn check failed:', err);
        }
        // Non-fatal — fall through and let RC process the purchase under whichever id it has.
      }
    }
    const premiumPackage =
      selectedPackage ??
      (await this.getPremiumPackage());
    if (__DEV__) {
      console.log('[PurchaseService] purchasePremium', {
        didConfigure,
        packageIdentifier: premiumPackage.identifier,
        productIdentifier: premiumPackage.product.identifier,
      });
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
      if (__DEV__) {
        console.log('[PurchaseService] purchasePremium complete', {
          activeEntitlementKeys: Object.keys(customerInfo.entitlements.active),
        });
      }
      return { success: true, customerInfo };
    } catch (err) {
      if (isPurchaseCancelled(err)) {
        return { success: false, cancelled: true };
      }
      throw err;
    }
  },

  async restorePurchases(): Promise<CustomerInfo> {
    if (!canUsePurchases('restorePurchases')) {
      throw purchasesUnavailableError('restorePurchases');
    }
    return Purchases.restorePurchases();
  },

  /**
   * Forces a server-side refresh: invalidates the SDK's local customerInfo cache and
   * runs a restore. Used by the post-purchase hydration backoff to break stale caches
   * and re-credit the current Apple-ID's transactions onto the current RC appUserID.
   * Safe to call repeatedly; idempotent on the server.
   */
  async refreshAndRestore(): Promise<CustomerInfo> {
    if (!canUsePurchases('refreshAndRestore')) {
      throw purchasesUnavailableError('refreshAndRestore');
    }
    try {
      await Purchases.invalidateCustomerInfoCache();
    } catch {
      // Cache invalidation failures are non-fatal — restore still asks the server fresh.
    }
    return Purchases.restorePurchases();
  },

  async checkEntitlement(): Promise<boolean> {
    if (!canUsePurchases('checkEntitlement')) return false;
    const customerInfo = await Purchases.getCustomerInfo();
    return hasPremiumEntitlement(customerInfo);
  },

  async syncRevenueCatEntitlement(): Promise<void> {
    const { error } = await supabase.functions.invoke('sync-revenuecat-entitlement', {
      method: 'POST',
    });
    if (error) throw error;
  },

  hasPremiumEntitlement,
  isEntitlementActive: hasPremiumEntitlement,

  async getPremiumOfferingPackages(): Promise<PremiumOfferingPackages> {
    if (!canUsePurchases('getPremiumOfferingPackages')) {
      throw purchasesUnavailableError('getPremiumOfferingPackages');
    }
    const offerings = await Purchases.getOfferings();
    const { lifetime, monthly } = resolvePremiumSlots(offerings);

    let legacy: PurchasesPackage | null = null;
    if (!lifetime && !monthly) {
      legacy = resolveLegacyPremiumPackage(offerings);
    }

    logDevPremiumOfferingResolution('getPremiumOfferingPackages', offerings, lifetime, monthly, legacy);

    return { lifetime, monthly, legacy };
  },

  async getPremiumPackage(): Promise<PurchasesPackage> {
    if (!canUsePurchases('getPremiumPackage')) {
      throw purchasesUnavailableError('getPremiumPackage');
    }
    const offerings = await Purchases.getOfferings();
    const { lifetime, monthly } = resolvePremiumSlots(offerings);
    const typed = lifetime ?? monthly;
    if (typed) {
      logDevPremiumOfferingResolution('getPremiumPackage', offerings, lifetime, monthly, null);
      return typed;
    }

    const legacy = resolveLegacyPremiumPackage(offerings);
    logDevPremiumOfferingResolution('getPremiumPackage', offerings, lifetime, monthly, legacy);
    if (legacy) return legacy;

    throw new Error('Premium Couple package is not configured in RevenueCat.');
  },
};
