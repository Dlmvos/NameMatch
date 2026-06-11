/**
 * Edge function: delete-posthog-person
 *
 * GDPR person-deletion for PostHog. Called from `AuthContext.deleteAccount` on
 * the device after Supabase row deletion has already succeeded. Holds the
 * PostHog **personal API key** (project-scoped, secret) on the server so it
 * never ships in the client bundle.
 *
 * Auth model: the device calls this through the standard Supabase client
 * (`supabase.functions.invoke`), so the caller's JWT is forwarded by Supabase
 * automatically. We verify the JWT, then ONLY allow deletion of the caller's
 * own `distinct_id` — a user can't delete someone else's PostHog data even if
 * they spoofed the body.
 *
 * Environment variables (set via `supabase secrets set`):
 *   POSTHOG_HOST                — e.g. "https://eu.i.posthog.com" (must match
 *                                 the client `EXPO_PUBLIC_POSTHOG_HOST`)
 *   POSTHOG_PROJECT_ID          — numeric project id, NOT the publishable key
 *   POSTHOG_PERSONAL_API_KEY    — personal API key scoped to `person:write`
 *                                 only (PostHog → User → Settings → Personal
 *                                 API keys). `write` implies `read`, so don't
 *                                 add `person:read` separately. Restrict the
 *                                 key to your specific project, not "all".
 *   SUPABASE_URL                — auto-populated by Supabase Functions
 *   SUPABASE_ANON_KEY           — auto-populated, used to verify caller JWT
 *
 * PostHog REST reference:
 *   https://posthog.com/docs/api/persons
 *   DELETE /api/projects/:project_id/persons/?distinct_id=:id&delete_events=true
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';

interface InvokePayload {
  distinct_id?: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // ── Verify the caller's JWT ────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!supabaseUrl || !anonKey || !authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUserClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userResult, error: userErr } = await supabaseUserClient.auth.getUser();
  if (userErr || !userResult.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const callerId = userResult.user.id;

  // ── Validate the payload + enforce same-identity rule ─────────────────
  let payload: InvokePayload;
  try {
    payload = (await req.json()) as InvokePayload;
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  const requestedDistinctId = (payload.distinct_id ?? '').trim();
  if (!requestedDistinctId) {
    return new Response('Missing distinct_id', { status: 400 });
  }
  // The PostHog `distinct_id` we use is the Supabase auth user id (set via
  // posthog.identify() at sign-in). A caller can only delete their own id.
  if (requestedDistinctId !== callerId) {
    return new Response('Forbidden', { status: 403 });
  }

  // ── Call PostHog ──────────────────────────────────────────────────────
  const postHogHost = (Deno.env.get('POSTHOG_HOST') ?? 'https://eu.i.posthog.com').replace(/\/$/, '');
  const projectId = Deno.env.get('POSTHOG_PROJECT_ID') ?? '';
  const personalApiKey = Deno.env.get('POSTHOG_PERSONAL_API_KEY') ?? '';
  if (!projectId || !personalApiKey) {
    // 200-OK on misconfig so the client doesn't loop, but log loudly so the
    // missing secret is obvious in Supabase function logs.
    console.error('[delete-posthog-person] missing POSTHOG_PROJECT_ID / POSTHOG_PERSONAL_API_KEY');
    return new Response(
      JSON.stringify({ ok: false, skipped: true, reason: 'edge_unconfigured' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }

  const url = `${postHogHost}/api/projects/${encodeURIComponent(projectId)}/persons/?distinct_id=${encodeURIComponent(requestedDistinctId)}&delete_events=true`;
  let phResponse: Response;
  try {
    phResponse = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${personalApiKey}`,
        'content-type': 'application/json',
      },
    });
  } catch (err) {
    console.error('[delete-posthog-person] PostHog fetch threw', err);
    return new Response(
      JSON.stringify({ ok: false, reason: 'posthog_unreachable' }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  // PostHog returns 204 on success; 404 means the person was already absent
  // (which is a fine outcome for an idempotent delete).
  if (phResponse.status === 204 || phResponse.status === 404) {
    return new Response(JSON.stringify({ ok: true, status: phResponse.status }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = await phResponse.text().catch(() => '');
  console.error('[delete-posthog-person] PostHog rejected', phResponse.status, body);
  return new Response(
    JSON.stringify({ ok: false, status: phResponse.status }),
    { status: 502, headers: { 'content-type': 'application/json' } },
  );
});
