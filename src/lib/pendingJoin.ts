/**
 * Holds a room code captured from a partner-invite deep link
 * (https://babinom.com/join?code=XXXXXX or babinom://join?code=XXXXXX)
 * until PartnerConnectScreen is mounted and can act on it.
 *
 * The code can be captured before the user is authenticated or has finished
 * onboarding (a cold start straight from the invite link), so it lives at
 * module scope and survives navigation between the unauthenticated and
 * authenticated stacks. PartnerConnectScreen consumes it on focus.
 */
let pendingJoinCode: string | null = null;

export function setPendingJoinCode(code: string): void {
  pendingJoinCode = code;
}

export function peekPendingJoinCode(): string | null {
  return pendingJoinCode;
}

/** Returns the stashed code (if any) and clears it. */
export function consumePendingJoinCode(): string | null {
  const code = pendingJoinCode;
  pendingJoinCode = null;
  return code;
}
