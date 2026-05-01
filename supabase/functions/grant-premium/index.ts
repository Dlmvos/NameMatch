import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';

const PREMIUM_PACK = 'PREMIUM_COUPLE';
const GRANT_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'RESTORE']);
const REVOKE_EVENTS = new Set(['CANCELLATION', 'REVOCATION', 'REFUND']);

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

    const nextPacks = GRANT_EVENTS.has(eventType) ? [PREMIUM_PACK] : [];
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

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('[grant-premium] unexpected error', err);
    return new Response('Server error', { status: 500 });
  }
});
