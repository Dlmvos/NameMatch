import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { supabase } from '../lib/supabase';

export const ENTITLEMENT_ID = 'premium_couple';
export const PREMIUM_ENTITLEMENT_DISPLAY_NAME = 'NameNest Pro';
export const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? '';
export const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? '';
export const RC_TEST_STORE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY?.trim() ?? '';

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
    Purchases.configure({ apiKey });
    didConfigure = true;
    purchasesDisabledReason = null;
  },

  async logIn(userId: string): Promise<void> {
    if (!canUsePurchases('logIn')) return;
    await Purchases.logIn(userId);
  },

  async logOut(): Promise<void> {
    if (!canUsePurchases('logOut')) return;
    await Purchases.logOut();
  },

  async purchasePremium(): Promise<PurchaseSuccess | PurchaseCancelled> {
    if (!canUsePurchases('purchasePremium')) {
      if (!__DEV__) throw purchasesUnavailableError('purchasePremium');
      return { success: false, cancelled: true };
    }
    const premiumPackage = await this.getPremiumPackage();
    try {
      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
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

  async checkEntitlement(): Promise<boolean> {
    if (!canUsePurchases('checkEntitlement')) return false;
    const customerInfo = await Purchases.getCustomerInfo();
    return hasPremiumEntitlement(customerInfo);
  },

  async getLocalizedPrice(): Promise<string> {
    if (!canUsePurchases('getLocalizedPrice')) {
      throw purchasesUnavailableError('getLocalizedPrice');
    }
    const premiumPackage = await this.getPremiumPackage();
    return premiumPackage.product.priceString;
  },

  async syncRevenueCatEntitlement(): Promise<void> {
    const { error } = await supabase.functions.invoke('sync-revenuecat-entitlement', {
      method: 'POST',
    });
    if (error) throw error;
  },

  hasPremiumEntitlement,
  isEntitlementActive: hasPremiumEntitlement,

  async getPremiumPackage(): Promise<PurchasesPackage> {
    if (!canUsePurchases('getPremiumPackage')) {
      throw purchasesUnavailableError('getPremiumPackage');
    }
    const offerings = await Purchases.getOfferings();
    const availablePackages = Object.values(offerings.all).flatMap(
      (offering) => offering.availablePackages,
    );
    const premiumPackage =
      offerings.current?.availablePackages.find(
        (pkg) => pkg.identifier === ENTITLEMENT_ID || pkg.product.identifier === ENTITLEMENT_ID,
      ) ??
      offerings.current?.lifetime ??
      availablePackages.find(
        (pkg) => pkg.identifier === ENTITLEMENT_ID || pkg.product.identifier === ENTITLEMENT_ID,
      );

    if (!premiumPackage) {
      throw new Error('Premium Couple package is not configured in RevenueCat.');
    }

    return premiumPackage;
  },
};
