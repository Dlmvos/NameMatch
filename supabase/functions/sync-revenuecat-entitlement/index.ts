import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';

const ENTITLEMENT_ID = 'premium_couple';
const PREMIUM_PACK = 'PREMIUM_COUPLE';

function isEntitlementActive(entitlement: any): boolean {
  if (!entitlement) return false;
  const expiresDate = entitlement.expires_date ?? null;
  return expiresDate === null || new Date(expiresDate).getTime() > Date.now();
}

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
    const active = isEntitlementActive(entitlement);

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileReadError } = await serviceClient
      .from('profiles')
      .select('purchased_packs')
      .eq('id', userId)
      .maybeSingle();

    if (profileReadError) {
      console.error('[sync-revenuecat-entitlement] profile read error', profileReadError.message);
      return new Response('Database error', { status: 500 });
    }

    const existing = profile?.purchased_packs ?? [];

    if (!active) {
      const next = withoutPremiumPack(existing);
      if (next.length === existing.length) {
        console.log('[sync-revenuecat-entitlement] inactive: no premium pack to remove, skip write');
        return new Response(JSON.stringify({ ok: true, active: false }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      const { error } = await serviceClient
        .from('profiles')
        .update({
          purchased_packs: next,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (error) {
        console.error('[sync-revenuecat-entitlement] profile update error', error.message);
        return new Response('Database error', { status: 500 });
      }
      console.log('[sync-revenuecat-entitlement] inactive: removed premium pack, preserved other packs');
      return new Response(JSON.stringify({ ok: true, active: false }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const next = mergePremiumPack(existing);
    if (next.length === existing.length) {
      console.log('[sync-revenuecat-entitlement] active: premium pack already present, skip write');
      return new Response(JSON.stringify({ ok: true, active: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const { error } = await serviceClient
      .from('profiles')
      .update({
        purchased_packs: next,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[sync-revenuecat-entitlement] profile update error', error.message);
      return new Response('Database error', { status: 500 });
    }

    console.log('[sync-revenuecat-entitlement] active: merged premium pack into purchased_packs');
    return new Response(JSON.stringify({ ok: true, active: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('[sync-revenuecat-entitlement] unexpected error', err);
    return new Response('Server error', { status: 500 });
  }
});
