import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { secureStoreAdapter } from './secureStoreAdapter';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseStartupError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Missing required Supabase env vars: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    : null;

if (supabaseStartupError) {
  const message = `[NameNest] ${supabaseStartupError}`;
  if (__DEV__) {
    console.warn(`${message} Supabase client calls will fail until local env is configured.`);
  } else {
    console.error(message);
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://missing-supabase-url.supabase.co',
  supabaseAnonKey || 'missing-supabase-anon-key',
  {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  },
);

// One-shot startup diagnostic: log the host the app actually connects to.
// Compared against the host the service-role report ran against, this is the
// fastest way to detect a "wrong project" misconfiguration (the symptom is
// the app seeing single-digit row counts while the DB has ~55k baby_names).
// Anon key prefix is logged so two keys against the same host can also be
// distinguished. No secrets are leaked — only the public host + key prefix.
{
  let host = '(unparseable)';
  try {
    host = new URL(supabaseUrl || 'https://missing-supabase-url.supabase.co').host;
  } catch {
    /* keep fallback */
  }
  const anonPrefix = supabaseAnonKey ? `${supabaseAnonKey.slice(0, 8)}…` : '(missing)';
  console.log(`[supabase] connecting host=${host} anonKeyPrefix=${anonPrefix}`);
}
