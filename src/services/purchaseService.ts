import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
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
export const RC_TEST_STORE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY?.trim() ?? '';

export type PremiumOfferingPackages = {
  lifetime: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
  /** When current offering lacks lifetime/monthly presets, entitlement-matched SKU (legacy setups). */
  legacy: PurchasesPackage | null;
};

type PurchaseSuccess = { success: true; customerInfo: CustomerInfo };
type PurchaseCancelled = { success: false; cancelled: true };
let didConfigure = false;
let purchasesDisabledReason: string | null = null;
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

function getPlatformApiKey(): string {
  return Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
}

function resolveRevenueCatApiKey(): { apiKey: string | null; reason?: string } {
  if (isExpoGo()) {
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
  if (isExpoGo()) {
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

export function hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
}

/** RevenueCat entitlement can lag purchase/restore responses; re-fetch after 1s / 2s / 3s. */
async function resolveCustomerInfoWithPremiumBackoff(
  label: string,
  initialCustomerInfo: CustomerInfo,
): Promise<CustomerInfo> {
  if (hasPremiumEntitlement(initialCustomerInfo)) {
    if (__DEV__) console.log(`[PurchaseService] ${label} → entitlement active immediately`);
    return initialCustomerInfo;
  }
  console.warn(`[PurchaseService] ${label} → entitlement NOT active on initial customerInfo, retrying…`);
  const delays = [1000, 2000, 3000];
  for (const ms of delays) {
    await new Promise((r) => setTimeout(r, ms));
    try {
      const fresh = await Purchases.getCustomerInfo();
      if (hasPremiumEntitlement(fresh)) {
        if (__DEV__) console.log(`[PurchaseService] ${label} → entitlement active after ${ms}ms retry`);
        return fresh;
      }
    } catch {
      // Transient fetch failure — continue retrying.
    }
  }
  // Final fallback: server-side reconciliation. The edge function queries
  // RevenueCat's REST API authoritatively and writes the entitlement to
  // Supabase. After it returns we re-fetch local customerInfo, which now
  // reflects the canonical state. This recovers from RC propagation lag
  // that exceeds the local 6s budget (common in sandbox/TestFlight).
  try {
    const { error } = await supabase.functions.invoke('sync-revenuecat-entitlement', {
      method: 'POST',
    });
    if (!error) {
      const fresh = await Purchases.getCustomerInfo();
      if (hasPremiumEntitlement(fresh)) {
        if (__DEV__) console.log(`[PurchaseService] ${label} → entitlement active after server sync`);
        return fresh;
      }
    }
  } catch {
    // Best-effort — fall through to original "still missing" behaviour.
  }
  console.warn(`[PurchaseService] ${label} → entitlement still missing after retries + server sync, returning original customerInfo`);
  return initialCustomerInfo;
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

function logPkg(label: string, pkg: PurchasesPackage | null): void {
  if (!__DEV__) return;
  if (!pkg) {
    console.log(`[PurchaseService] ${label}: null`);
    return;
  }
  console.log(
    `[PurchaseService] ${label}: id=${pkg.identifier} type=${pkg.packageType} ` +
      `product=${pkg.product.identifier} title=${pkg.product.title} price=${pkg.product.priceString}`,
  );
}

function logPurchaseError(method: string, err: unknown): void {
  const e = err as Record<string, unknown> | undefined;
  console.error(
    `[PurchaseService] ${method} error:`,
    JSON.stringify({
      code: e?.code,
      message: e?.message,
      underlyingErrorMessage: e?.underlyingErrorMessage,
      userCancelled: e?.userCancelled,
      readableErrorCode: e?.readableErrorCode,
    }),
  );
}

/**
 * Maps a RevenueCat error to a user-safe i18n key.
 * Returns `null` for cancellations (caller handles those) or unknown codes
 * (falls back to generic `shop.purchaseError`).
 */
export function classifyPurchaseError(err: unknown): string | null {
  const e = err as { code?: string } | undefined;
  switch (e?.code) {
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return 'shop.purchaseErrorProductUnavailable';
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return 'shop.purchaseErrorStoreProblem';
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return 'shop.purchaseErrorNotAllowed';
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return 'shop.purchaseErrorAlreadyOwned';
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return 'shop.purchaseErrorNetwork';
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return 'shop.purchaseErrorPending';
    default:
      return null;
  }
}

function isPurchaseCancelled(err: unknown): boolean {
  const maybeError = err as { code?: string; userCancelled?: boolean | null };
  return (
    maybeError.userCancelled === true ||
    maybeError.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

export const PurchaseService = {
  configure(): void {
    if (didConfigure) return;
    const { apiKey, reason } = resolveRevenueCatApiKey();
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
  },

  async logOut(): Promise<void> {
    if (!canUsePurchases('logOut')) return;
    try {
      await Purchases.logOut();
    } catch {
      // Still invalidate so a failed handoff does not leave the next session with cached entitlements.
    }
    try {
      await Purchases.invalidateCustomerInfoCache();
    } catch {
      // Best-effort; never blocks sign-out.
    }
  },

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!canUsePurchases('getCustomerInfo')) {
      throw purchasesUnavailableError('getCustomerInfo');
    }
    return await Purchases.getCustomerInfo();
  },

  /** Single fetch plus 1s/2s/3s getCustomerInfo retries when premium_couple is not yet active (same as purchase/restore). */
  async getCustomerInfoWithPremiumPropagation(): Promise<CustomerInfo> {
    if (!canUsePurchases('getCustomerInfo')) {
      throw purchasesUnavailableError('getCustomerInfo');
    }
    const initial = await Purchases.getCustomerInfo();
    return resolveCustomerInfoWithPremiumBackoff('getCustomerInfo', initial);
  },

  async purchasePremium(selectedPackage?: PurchasesPackage): Promise<PurchaseSuccess | PurchaseCancelled> {
    if (!canUsePurchases('purchasePremium')) {
      if (!__DEV__) throw purchasesUnavailableError('purchasePremium');
      return { success: false, cancelled: true };
    }
    const premiumPackage =
      selectedPackage ??
      (await this.getPremiumPackage());
    logPkg('purchasePremium → package to purchase', premiumPackage);
    if (__DEV__) {
      console.log(
        `[PurchaseService] purchasePremium → selectedPackage was ${selectedPackage ? 'provided' : 'resolved via getPremiumPackage()'}`,
      );
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
      if (__DEV__) console.log('[PurchaseService] purchasePremium → success');
      const resolved = await resolveCustomerInfoWithPremiumBackoff('purchasePremium', customerInfo);
      return { success: true, customerInfo: resolved };
    } catch (err) {
      logPurchaseError('purchasePremium', err);
      if (isPurchaseCancelled(err)) {
        if (__DEV__) console.log('[PurchaseService] purchasePremium → cancelled by user');
        return { success: false, cancelled: true };
      }
      throw err;
    }
  },

  async restorePurchases(): Promise<CustomerInfo> {
    if (!canUsePurchases('restorePurchases')) {
      throw purchasesUnavailableError('restorePurchases');
    }
    const customerInfo = await Purchases.restorePurchases();
    return await resolveCustomerInfoWithPremiumBackoff('restorePurchases', customerInfo);
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
    if (__DEV__) {
      console.log(
        `[PurchaseService] getPremiumOfferingPackages → current offering: ${offerings.current?.identifier ?? 'null'}, ` +
          `total offerings: ${Object.keys(offerings.all).length}`,
      );
      for (const [key, off] of Object.entries(offerings.all)) {
        console.log(`[PurchaseService]   offering "${key}": ${off.availablePackages.length} packages`);
        for (const pkg of off.availablePackages) {
          logPkg(`    pkg`, pkg);
        }
      }
    }
    const { lifetime, monthly } = resolvePremiumSlots(offerings);
    logPkg('resolved lifetime', lifetime);
    logPkg('resolved monthly', monthly);

    let legacy: PurchasesPackage | null = null;
    if (!lifetime && !monthly) {
      legacy = resolveLegacyPremiumPackage(offerings);
      logPkg('resolved legacy (fallback)', legacy);
    }

    return { lifetime, monthly, legacy };
  },

  async getPremiumPackage(): Promise<PurchasesPackage> {
    if (!canUsePurchases('getPremiumPackage')) {
      throw purchasesUnavailableError('getPremiumPackage');
    }
    const offerings = await Purchases.getOfferings();
    const { lifetime, monthly } = resolvePremiumSlots(offerings);
    const typed = lifetime ?? monthly;
    if (typed) return typed;

    const legacy = resolveLegacyPremiumPackage(offerings);
    if (legacy) return legacy;

    throw new Error('Premium Couple package is not configured in RevenueCat.');
  },
};
