import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';

const PREMIUM_PACK = 'PREMIUM_COUPLE';
const GRANT_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'RESTORE']);
// EXPIRATION fires when a renewable subscription naturally lapses at
// period end (user cancelled before renewal, payment failed at renewal,
// etc.). Without it, a monthly subscriber who lets their sub expire
// would keep premium forever — server only revokes on the explicit
// CANCELLATION/REVOCATION/REFUND events, which don't cover natural
// non-renewal. BILLING_ISSUE covers payment failures still in grace
// period; treat as revoke too to be safe (RC will fire RENEWAL again
// when payment recovers).
const REVOKE_EVENTS = new Set([
  'CANCELLATION',
  'REVOCATION',
  'REFUND',
  'EXPIRATION',
  'BILLING_ISSUE',
]);

/**
 * Constant-time secret comparison via SHA-256 digest equality. Hashing both
 * sides normalises the length so the byte-wise compare can run in fixed time
 * regardless of input length, and the digest equality check uses a XOR loop
 * that touches every byte before returning (no early-exit). Audit S2,
 * 2026-06-12: `!==` on the webhook secret was theoretically timing-attackable.
 */
async function timingSafeEqualStrings(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [hA, hB] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const av = new Uint8Array(hA);
  const bv = new Uint8Array(hB);
  let diff = av.length ^ bv.length;
  const len = Math.min(av.length, bv.length);
  for (let i = 0; i < len; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const expectedSecret = Deno.env.get('RC_WEBHOOK_SECRET') ?? '';
  const authorization = req.headers.get('authorization') ?? '';
  const receivedSecret = authorization.replace(/^Bearer\s+/i, '');
  if (!expectedSecret || !(await timingSafeEqualStrings(receivedSecret, expectedSecret))) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await req.json();
    const event = payload.event ?? payload;
    const eventType = String(event.type ?? '');
    const appUserId = event.app_user_id ?? payload.app_user_id;

    if (!appUserId || (!GRANT_EVENTS.has(eventType) && !REVOKE_EVENTS.has(eventType))) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const nextPacks = GRANT_EVENTS.has(eventType) ? [PREMIUM_PACK] : [];
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        purchased_packs: nextPacks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appUserId);

    if (profileErr) {
      console.error('[grant-premium] profile update error', profileErr.message);
      return new Response('Database error', { status: 500 });
    }

    // Mirror the grant/revoke to the user's room if they're paired.
    // Without this, only the BUYER (profile.purchased_packs) gets
    // entitlement; their partner — who reads from room.premium_packs —
    // stays free forever even after pairing. AppContext was doing this
    // client-side as fire-and-forget, but if the buyer force-quits or
    // is offline immediately after purchase, the partner write never
    // lands. Doing it server-side from the webhook makes it durable
    // (RC retries the webhook on 5xx) and partner-independent.
    //
    // Two-step lookup: find the room the user is in, then update its
    // premium_packs. Room may be null (solo user) — that's fine, we
    // just skip the room write. If user is user1 they're the owner;
    // either way the membership check below covers them.
    const { data: roomRows, error: roomLookupErr } = await supabase
      .from('rooms')
      .select('id, premium_packs')
      .or(`user1_id.eq.${appUserId},user2_id.eq.${appUserId}`)
      .limit(1);

    if (roomLookupErr) {
      console.error('[grant-premium] room lookup error', roomLookupErr.message);
      // Don't fail the whole webhook — profile write already succeeded.
      // The next webhook event or a manual restore will re-attempt.
    } else if (roomRows && roomRows.length > 0) {
      const room = roomRows[0] as { id: string; premium_packs: string[] | null };
      const currentPacks: string[] = Array.isArray(room.premium_packs) ? room.premium_packs : [];
      const nextRoomPacks = GRANT_EVENTS.has(eventType)
        ? Array.from(new Set([...currentPacks, PREMIUM_PACK]))
        : currentPacks.filter((p) => p !== PREMIUM_PACK);

      // Only write if the packs actually changed — avoid useless
      // updated_at churn and realtime echo.
      const changed =
        nextRoomPacks.length !== currentPacks.length ||
        nextRoomPacks.some((p, i) => p !== currentPacks[i]);
      if (changed) {
        const { error: roomUpdateErr } = await supabase
          .from('rooms')
          .update({
            premium_packs: nextRoomPacks,
          })
          .eq('id', room.id);
        if (roomUpdateErr) {
          console.error('[grant-premium] room update error', roomUpdateErr.message);
          // Same: don't fail the whole webhook.
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('[grant-premium] unexpected error', err);
    return new Response('Server error', { status: 500 });
  }
});
