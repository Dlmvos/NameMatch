const http = require('node:http');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const PREMIUM_PACK = 'PREMIUM_COUPLE';
const CHECKOUT_PRODUCT = 'premium_couple';
const PORT = Number(process.env.PORT ?? 8787);
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

const requiredEnv = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'WEBSITE_SUCCESS_URL',
  'WEBSITE_CANCEL_URL',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function corsHeaders() {
  return {
    'access-control-allow-origin': process.env.CHECKOUT_ALLOWED_ORIGIN ?? '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, stripe-signature',
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    ...corsHeaders(),
    'content-type': 'application/json',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createStripeCheckoutSession(email) {
  const params = new URLSearchParams({
    mode: 'payment',
    customer_email: email,
    client_reference_id: email,
    success_url: process.env.WEBSITE_SUCCESS_URL,
    cancel_url: process.env.WEBSITE_CANCEL_URL,
    'line_items[0][price]': process.env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    'metadata[email]': email,
    'metadata[babinom_product]': CHECKOUT_PRODUCT,
  });

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Stripe checkout failed');
  }

  return payload;
}

function verifyStripeSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto
    .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
    if (user) return user;
    if (data.users.length < perPage) break;
  }

  return null;
}

async function grantPremiumByEmail(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error(`No Supabase auth user found for ${email}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, purchased_packs, room_id')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error(`No profile found for user ${user.id}`);

  const purchasedPacks = Array.from(new Set([...(profile.purchased_packs ?? []), PREMIUM_PACK]));
  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({
      purchased_packs: purchasedPacks,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
  if (updateProfileError) throw updateProfileError;

  if (profile.room_id) {
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('premium_packs')
      .eq('id', profile.room_id)
      .maybeSingle();
    if (roomError) throw roomError;

    const roomPacks = Array.from(new Set([...(room?.premium_packs ?? []), PREMIUM_PACK]));
    const { error: updateRoomError } = await supabase
      .from('rooms')
      .update({ premium_packs: roomPacks })
      .eq('id', profile.room_id);
    if (updateRoomError) throw updateRoomError;
  }

  return { userId: user.id, roomId: profile.room_id };
}

async function handleCreateCheckoutSession(req, res) {
  const body = await readBody(req);
  const { email } = JSON.parse(body.toString('utf8') || '{}');
  if (!isValidEmail(email)) {
    sendJson(res, 400, { error: 'Valid email is required' });
    return;
  }

  const session = await createStripeCheckoutSession(email.trim().toLowerCase());
  sendJson(res, 200, { url: session.url });
}

async function handleStripeWebhook(req, res) {
  const rawBody = await readBody(req);
  if (!verifyStripeSignature(rawBody, req.headers['stripe-signature'])) {
    sendJson(res, 400, { error: 'Invalid Stripe signature' });
    return;
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  if (event.type !== 'checkout.session.completed') {
    sendJson(res, 200, { received: true });
    return;
  }

  const session = event.data.object;
  if (session.metadata?.babinom_product !== CHECKOUT_PRODUCT) {
    sendJson(res, 200, { received: true, skipped: true });
    return;
  }

  if (session.payment_status !== 'paid') {
    sendJson(res, 200, { received: true, skipped: 'payment_not_paid' });
    return;
  }

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    session.metadata?.email ??
    session.client_reference_id;
  if (!isValidEmail(email)) {
    throw new Error('Checkout session did not include a valid email');
  }

  const grant = await grantPremiumByEmail(email.trim().toLowerCase());
  sendJson(res, 200, { received: true, granted: grant });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders());
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/create-checkout-session') {
      await handleCreateCheckoutSession(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/stripe-webhook') {
      await handleStripeWebhook(req, res);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('[stripe-checkout]', err);
    sendJson(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Babinom Stripe checkout server listening on ${PORT}`);
});
