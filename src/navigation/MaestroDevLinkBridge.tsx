/**
 * Subscribes to Maestro deep links (see `maestroDevDeepLink.ts`). Dev-only — omitted from tree when `__DEV__` is false at compile time for behavior; parent still gates rendering.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import type { Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { authenticatedRootNavigationRef } from './rootNavigationRef';
import {
  dispatchMaestroDevRoute,
  parseMaestroDevRouteFromUrl,
  type MaestroDevRouteName,
} from './maestroDevDeepLink';

type Props = {
  isStartupReady: boolean;
  navigationReady: boolean;
};

export function MaestroDevLinkBridge({ isStartupReady, navigationReady }: Props) {
  const { profile } = useAuth();
  const pending = useRef<MaestroDevRouteName | null>(null);
  const profileRef = useRef<Profile | null>(profile);
  profileRef.current = profile;

  const flush = useCallback(() => {
    if (!__DEV__) return;
    if (!isStartupReady || !navigationReady) return;
    if (!authenticatedRootNavigationRef.isReady()) return;
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    dispatchMaestroDevRoute(next, profileRef.current);
  }, [isStartupReady, navigationReady]);

  useEffect(() => {
    if (!__DEV__) return;
    let cancelled = false;
    void Linking.getInitialURL().then((url) => {
      if (cancelled) return;
      const r = url ? parseMaestroDevRouteFromUrl(url) : null;
      if (r) pending.current = r;
      flush();
    });
    return () => {
      cancelled = true;
    };
  }, [flush]);

  useEffect(() => {
    if (!__DEV__) return;
    const sub = Linking.addEventListener('url', ({ url }) => {
      const r = parseMaestroDevRouteFromUrl(url);
      if (r) {
        pending.current = r;
        flush();
      }
    });
    return () => sub.remove();
  }, [flush]);

  useEffect(() => {
    flush();
  }, [flush]);

  return null;
}
