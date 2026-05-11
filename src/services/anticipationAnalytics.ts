/**
 * V1 anticipation analytics helpers (deterministic sampling, whisper scaffolding).
 *
 * Whisper telemetry (`whisper_fired`, `whisper_dismissed`): no whisper hook exists yet — wire flat payloads here once a whisper surface ships (see AnalyticsService event union).
 */
import { stableHash } from '../lib/stableHash';

/** Deterministic ~10% daily sample per user (same UTC-day bucket). Used for `swipe_partner_room_session_*` — not dual-device presence. */
export function copresenceSampleEligible(userId: string, nowMs = Date.now()): boolean {
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const utcDayKey = `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const h = stableHash(`${userId}:${utcDayKey}`);
  return h % 100 < 10;
}
