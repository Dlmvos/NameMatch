/**
 * Dev-client Maestro automation deep links only (`__DEV__`). Examples:
 * - namematch://maestro/paywall
 * - com.daanvos.namenest://maestro/main
 *
 * Production builds ignore these handlers in JS; native URL schemes may still open the app but no navigation runs.
 */
import { CommonActions } from '@react-navigation/native';
import type { Profile } from '../types';
import { authenticatedRootNavigationRef } from './rootNavigationRef';

export type MaestroDevRouteName =
  | 'main'
  | 'paywall'
  | 'settings'
  | 'shop'
  | 'partner'
  | 'reset';

const ALLOWED = new Set<string>([
  'main',
  'paywall',
  'settings',
  'shop',
  'partner',
  'reset',
]);

export function parseMaestroDevRouteFromUrl(url: string): MaestroDevRouteName | null {
  if (!__DEV__) return null;
  const marker = 'maestro/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const segment = url.slice(idx + marker.length).split(/[/?#]/)[0]?.toLowerCase();
  if (!segment || !ALLOWED.has(segment)) return null;
  return segment as MaestroDevRouteName;
}

function stackRouteNames(): string[] | undefined {
  const state = authenticatedRootNavigationRef.getRootState();
  return state && 'routeNames' in state && Array.isArray((state as { routeNames?: string[] }).routeNames)
    ? (state as { routeNames: string[] }).routeNames
    : undefined;
}

function dispatchResetToBaseline(profile: Profile | null): void {
  const hasCompletedOnboarding = !!(
    profile?.gender_preference &&
    profile?.region_preference &&
    profile?.country_preference
  );
  const hasRoom = !!profile?.room_id;
  const names = stackRouteNames() ?? [];

  if (!hasCompletedOnboarding) {
    if (names.includes('Preferences')) {
      authenticatedRootNavigationRef.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Preferences' }] }),
      );
    }
    return;
  }

  if (!hasRoom) {
    if (names.includes('PartnerConnect')) {
      authenticatedRootNavigationRef.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'PartnerConnect' }] }),
      );
    }
    return;
  }

  if (names.includes('MainTabs')) {
    authenticatedRootNavigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Swipe' } }],
      }),
    );
  }
}

/**
 * Navigate inside the authenticated stack. Call only when startup hydration matches `AuthenticatedRootNavigator` gate.
 */
export function dispatchMaestroDevRoute(
  route: MaestroDevRouteName,
  profile: Profile | null,
): void {
  if (!__DEV__) return;
  if (!authenticatedRootNavigationRef.isReady()) return;

  const names = stackRouteNames() ?? [];

  switch (route) {
    case 'paywall':
      if (names.includes('Paywall')) {
        authenticatedRootNavigationRef.navigate('Paywall');
      }
      break;
    case 'partner':
      if (names.includes('PartnerConnect')) {
        authenticatedRootNavigationRef.navigate('PartnerConnect');
      }
      break;
    case 'main':
      if (names.includes('MainTabs')) {
        authenticatedRootNavigationRef.navigate('MainTabs', { screen: 'Swipe' });
      } else if (__DEV__) {
        console.warn('[MaestroDevLink] "main" skipped: MainTabs not registered on current stack');
      }
      break;
    case 'settings':
      if (names.includes('MainTabs')) {
        authenticatedRootNavigationRef.navigate('MainTabs', { screen: 'Settings' });
      } else if (__DEV__) {
        console.warn('[MaestroDevLink] "settings" skipped: MainTabs not registered on current stack');
      }
      break;
    case 'shop':
      if (names.includes('MainTabs')) {
        authenticatedRootNavigationRef.navigate('MainTabs', { screen: 'Shop' });
      } else if (__DEV__) {
        console.warn('[MaestroDevLink] "shop" skipped: MainTabs not registered on current stack');
      }
      break;
    case 'reset':
      dispatchResetToBaseline(profile);
      break;
    default:
      break;
  }
}
