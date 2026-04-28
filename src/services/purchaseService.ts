import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { supabase } from '../lib/supabase';

export const ENTITLEMENT_ID = 'premium_couple';
export const RC_API_KEY_IOS =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? 'appl_REVENUECAT_IOS_API_KEY';
export const RC_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? 'goog_REVENUECAT_ANDROID_API_KEY';
export const RC_TEST_STORE_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY ?? '';

type PurchaseSuccess = { success: true; customerInfo: CustomerInfo };
type PurchaseCancelled = { success: false; cancelled: true };
let didConfigure = false;
let didSkipExpoGoConfigure = false;

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function isConfiguredTestStoreKey(apiKey: string): boolean {
  return apiKey.trim().startsWith('test_');
}

function getRevenueCatApiKey(): string | null {
  if (isExpoGo()) {
    return isConfiguredTestStoreKey(RC_TEST_STORE_API_KEY) ? RC_TEST_STORE_API_KEY : null;
  }
  return Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
}

function warnExpoGoUnavailable(method: string): void {
  if (__DEV__) {
    console.warn(
      `[PurchaseService] ${method} skipped: RevenueCat native store is unavailable in Expo Go. ` +
        'Use a native development build, production build, or set EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY.',
    );
  }
}

function canUsePurchases(method: string): boolean {
  if (didConfigure) return true;
  if (didSkipExpoGoConfigure || isExpoGo()) {
    warnExpoGoUnavailable(method);
    return false;
  }
  return true;
}

function isEntitlementActive(customerInfo: CustomerInfo): boolean {
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
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      didSkipExpoGoConfigure = true;
      warnExpoGoUnavailable('configure');
      return;
    }
    Purchases.configure({ apiKey });
    didConfigure = true;
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
      throw new Error('Purchases are only available in a native build or RevenueCat Test Store mode.');
    }
    return Purchases.restorePurchases();
  },

  async checkEntitlement(): Promise<boolean> {
    if (!canUsePurchases('checkEntitlement')) return false;
    const customerInfo = await Purchases.getCustomerInfo();
    return isEntitlementActive(customerInfo);
  },

  async getLocalizedPrice(): Promise<string> {
    if (!canUsePurchases('getLocalizedPrice')) {
      throw new Error('RevenueCat price lookup is unavailable in Expo Go.');
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

  isEntitlementActive,

  async getPremiumPackage(): Promise<PurchasesPackage> {
    if (!canUsePurchases('getPremiumPackage')) {
      throw new Error('RevenueCat offerings are unavailable in Expo Go.');
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
