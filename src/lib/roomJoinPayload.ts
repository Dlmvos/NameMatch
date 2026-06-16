const ROOM_JOIN_PAYLOAD_TYPES = new Set(['namematch_join', 'namenest_join']);

/** Public Babinom partner join landing page — QR and share encode this URL. */
export const PARTNER_JOIN_BASE_URL = 'https://babinom.com/join';

/** Room codes: six chars from [A-HJ-NP-Z2-9] (no I, O; digits 2–9). */
const ROOM_CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

function normalizeRoomCode(fragment: string): string {
  return fragment.trim().toUpperCase().replace(/\s+/g, '');
}

function parseCodeFromKnownJoinUrls(raw: string): string | null {
  const trimmed = raw.trim();
  const candidates = new Set<string>([trimmed]);

  const embedded = trimmed.match(/https?:\/\/[^\s"'<>]+\bbabinom\.com\/join[^\s"'<>]*/gi);
  if (embedded) {
    for (const fragment of embedded) {
      candidates.add(fragment);
    }
  }

  if (/^babinom\.com\/join\b/i.test(trimmed)) {
    candidates.add(`https://${trimmed}`);
  }

  for (const candidate of candidates) {
    let href = candidate;
    if (/^babinom\.com/i.test(href)) {
      href = `https://${href}`;
    }

    try {
      const u = new URL(href);

      const host = u.hostname.toLowerCase();
      if (!host.endsWith('babinom.com')) continue;

      const pathNorm = u.pathname.replace(/\/+$/, '') || '/';
      if (pathNorm !== '/join') continue;

      const param = u.searchParams.get('code');
      if (!param) continue;
      const normalized = normalizeRoomCode(param);
      if (ROOM_CODE_RE.test(normalized)) return normalized;
    } catch {
      // Ignore invalid URL shapes.
    }
  }

  return null;
}

/**
 * Invite payload encoded in QR and share links.
 * Prefer this URL shape so phone cameras suggest opening the Babinom join page.
 */
export function createRoomJoinPayload(roomCode: string): string {
  const normalized = normalizeRoomCode(roomCode);
  return `${PARTNER_JOIN_BASE_URL}?code=${encodeURIComponent(normalized)}`;
}

/**
 * Best-effort room code extraction for paste / deep-link parity (join field, future scanners).
 * Accepts legacy JSON payloads, `{base}/join?code=…`, and a bare six-character room code.
 */
export function parseRoomJoinPayload(payload: string): string | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as { type?: unknown; roomCode?: unknown };
    if (
      typeof parsed.type === 'string' &&
      ROOM_JOIN_PAYLOAD_TYPES.has(parsed.type) &&
      typeof parsed.roomCode === 'string'
    ) {
      // Validate via ROOM_CODE_RE here too — the URL and bare-code branches
      // below both validate, so the JSON branch needs the same gate (audit S1,
      // 2026-06-15). Without this, a malformed roomCode in a legacy JSON
      // payload would pass through unvalidated and prefill the join field.
      const normalized = normalizeRoomCode(parsed.roomCode);
      if (ROOM_CODE_RE.test(normalized)) return normalized;
    }
  } catch {
    // Not a JSON join payload.
  }

  const urlCode = parseCodeFromKnownJoinUrls(trimmed);
  if (urlCode) return urlCode;

  const only = normalizeRoomCode(trimmed);
  if (ROOM_CODE_RE.test(only)) return only;

  return null;
}
