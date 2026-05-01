import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';

const ENTITLEMENT_ID = 'premium_couple';
const PREMIUM_PACK = 'PREMIUM_COUPLE';

function isEntitlementActive(entitlement: any): boolean {
  if (!entitlement) return false;
  const expiresDate = entitlement.expires_date ?? null;
  return expiresDate === null || new Date(expiresDate).getTime() > Date.now();
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authorization = req.headers.get('authorization') ?? '';
  if (!authorization) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const revenueCatSecretKey = Deno.env.get('RC_SECRET_API_KEY') ?? '';

  try {
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = userData.user.id;
    const rcResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${revenueCatSecretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!rcResponse.ok) {
      console.error('[sync-revenuecat-entitlement] RevenueCat error', rcResponse.status);
      return new Response('RevenueCat verification failed', { status: 500 });
    }

    const revenueCatPayload = await rcResponse.json();
    const entitlement = revenueCatPayload.subscriber?.entitlements?.[ENTITLEMENT_ID];
    if (!isEntitlementActive(entitlement)) {
      return new Response(JSON.stringify({ ok: true, active: false }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await serviceClient
      .from('profiles')
      .update({
        purchased_packs: [PREMIUM_PACK],
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[sync-revenuecat-entitlement] profile update error', error.message);
      return new Response('Database error', { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, active: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('[sync-revenuecat-entitlement] unexpected error', err);
    return new Response('Server error', { status: 500 });
  }
});
