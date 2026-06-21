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

    // Internal retry: when the client just completed a purchase, RC's
    // SERVER may not have processed the receipt yet (Apple → RC
    // notifications can lag 2–60s in sandbox, a few seconds in
    // production). The client SDK has the receipt locally so it
    // believes the user has premium, but the Edge Function's REST
    // call returns `entitlements: {}` until propagation completes.
    // Without retry we'd return {active: false} → no Supabase write →
    // user loses purchase on cold restart. Retry up to 45s (well
    // under the 60s Edge Function timeout) with exponential backoff.
    // Each call is cheap and idempotent.
    const RC_RETRY_DELAYS_MS = [0, 2000, 4000, 8000, 12000, 18000]; // total ~44s
    let entitlement: unknown = null;
    let rcRequestFailed = false;
    for (let attempt = 0; attempt < RC_RETRY_DELAYS_MS.length; attempt++) {
      if (RC_RETRY_DELAYS_MS[attempt] > 0) {
        await new Promise((resolve) => setTimeout(resolve, RC_RETRY_DELAYS_MS[attempt]));
      }
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
        console.error(
          `[sync-revenuecat-entitlement] RC HTTP ${rcResponse.status} on attempt ${attempt + 1}`,
        );
        rcRequestFailed = true;
        continue; // retry on HTTP failure too — transient 5xx common
      }
      rcRequestFailed = false;
      const payload = await rcResponse.json();
      entitlement = payload.subscriber?.entitlements?.[ENTITLEMENT_ID];
      if (isEntitlementActive(entitlement)) {
        break; // propagation complete
      }
      console.log(
        `[sync-revenuecat-entitlement] attempt ${attempt + 1}: entitlement not yet active, will retry`,
      );
    }

    // If RC never returned OK, surface failure so client can retry.
    if (rcRequestFailed && !isEntitlementActive(entitlement)) {
      return new Response('RevenueCat verification failed after retries', { status: 502 });
    }

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
