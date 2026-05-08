import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';

const PREMIUM_PACK = 'PREMIUM_COUPLE';
const GRANT_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'RESTORE']);
const REVOKE_EVENTS = new Set(['CANCELLATION', 'REVOCATION', 'REFUND']);

function mergePremiumPack(packs: string[] | null | undefined): string[] {
  const base = [...(packs ?? [])];
  if (base.includes(PREMIUM_PACK)) return base;
  return [...base, PREMIUM_PACK];
}

function withoutPremiumPack(packs: string[] | null | undefined): string[] {
  return (packs ?? []).filter((p) => p !== PREMIUM_PACK);
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const expectedSecret = Deno.env.get('RC_WEBHOOK_SECRET') ?? '';
  const authorization = req.headers.get('authorization') ?? '';
  const receivedSecret = authorization.replace(/^Bearer\s+/i, '');
  if (!expectedSecret || receivedSecret !== expectedSecret) {
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

    const { data: profile, error: profileReadError } = await supabase
      .from('profiles')
      .select('purchased_packs')
      .eq('id', appUserId)
      .maybeSingle();

    if (profileReadError) {
      console.error('[grant-premium] profile read error', profileReadError.message);
      return new Response('Database error', { status: 500 });
    }

    const existing = profile?.purchased_packs ?? [];
    let nextPacks: string[];
    let logSuffix: string;
    if (GRANT_EVENTS.has(eventType)) {
      nextPacks = mergePremiumPack(existing);
      logSuffix =
        nextPacks.length === existing.length ? 'grant: premium already present, skip write' : 'grant: merged premium pack';
    } else {
      nextPacks = withoutPremiumPack(existing);
      logSuffix =
        nextPacks.length === existing.length ? 'revoke: no premium pack to remove, skip write' : 'revoke: removed premium pack';
    }

    if (nextPacks.length !== existing.length || JSON.stringify(nextPacks) !== JSON.stringify(existing)) {
      const { error } = await supabase
        .from('profiles')
        .update({
          purchased_packs: nextPacks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appUserId);

      if (error) {
        console.error('[grant-premium] profile update error', error.message);
        return new Response('Database error', { status: 500 });
      }
    }
    console.log(`[grant-premium] ${logSuffix}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('[grant-premium] unexpected error', err);
    return new Response('Server error', { status: 500 });
  }
});
