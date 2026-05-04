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
