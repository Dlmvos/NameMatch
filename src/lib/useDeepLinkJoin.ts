import { useEffect } from 'react';
import * as Linking from 'expo-linking';

import { parseRoomJoinPayload } from './roomJoinPayload';
import { setPendingJoinCode } from './pendingJoin';
import { navigationRef } from './navigationRef';

/**
 * Extract a room code from an incoming deep-link URL.
 * Handles the https universal/app link (`https://babinom.com/join?code=…`)
 * via parseRoomJoinPayload, and the custom scheme (`babinom://join?code=…`)
 * via expo-linking's query parsing as a fallback.
 */
function extractCode(url: string): string | null {
  const direct = parseRoomJoinPayload(url);
  if (direct) return direct;

  try {
    const { queryParams } = Linking.parse(url);
    const code = queryParams?.code;
    if (typeof code === 'string') {
      // parseRoomJoinPayload validates a bare 6-char code too.
      return parseRoomJoinPayload(code);
    }
  } catch {
    // Not a parseable URL — ignore.
  }
  return null;
}

/**
 * Captures partner-invite deep links and routes the user toward the
 * PartnerConnect screen with the room code prefilled.
 *
 * Covers both entry points:
 *   - cold start (app launched by the link)  -> Linking.getInitialURL()
 *   - warm start (link tapped while running) -> 'url' event
 *
 * The code is stashed first (so it survives auth/onboarding), then we make a
 * best-effort jump to PartnerConnect. If that screen isn't in the current
 * navigator (unauthenticated / onboarding stacks), the stash persists and
 * PartnerConnectScreen consumes it once it mounts.
 *
 * Call once, unconditionally, at the navigation root.
 */
export function useDeepLinkJoin(): void {
  useEffect(() => {
    let isMounted = true;

    const handleUrl = (url: string | null) => {
      if (!url || !isMounted) return;
      const code = extractCode(url);
      if (!code) return;

      setPendingJoinCode(code);
      try {
        if (navigationRef.isReady()) {
          navigationRef.navigate('PartnerConnect');
        }
      } catch {
        // PartnerConnect not reachable in the current stack yet;
        // it will pick up the stashed code on mount.
      }
    };

    Linking.getInitialURL()
      .then(handleUrl)
      .catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}
