import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export type SafeProfileUpdates = Partial<
  Pick<
    Profile,
    | 'display_name'
    | 'gender_preference'
    | 'region_preference'
    | 'room_id'
    | 'country_preference'
    | 'residence_country'
    | 'language_preference'
  >
>;

const nowIso = () => new Date().toISOString();

export const ProfileService = {
  async ensureProfile(userId: string, displayName: string | null): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          display_name: displayName ?? null,
          updated_at: nowIso(),
        },
        { onConflict: 'id' },
      )
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[ProfileService] ensureProfile error:', error.message);
      throw error;
    }
    if (!data) throw new Error('Profile bootstrap failed: row missing after ensureProfile.');

    return data as Profile;
  },

  async fetchProfile(userId: string): Promise<Profile | null> {
    try {
      const { error: refillErr } = await supabase.rpc('maybe_refill_daily_free_swipes');
      if (refillErr && __DEV__) {
        console.warn('[ProfileService] maybe_refill_daily_free_swipes:', refillErr.message);
      }
    } catch {
      // Offline / transient errors — proceed with stale-safe fetch.
    }

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      console.error('[ProfileService] fetchProfile error:', error.message);
      throw error;
    }
    return (data as Profile | null) ?? null;
  },

  async updateProfile(userId: string, updates: SafeProfileUpdates): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          ...updates,
          updated_at: nowIso(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      console.error('[ProfileService] updateProfile returned null data', {
        userId,
        updateKeys: Object.keys(updates),
      });
      throw new Error('Profile update failed: profile row missing or not returned.');
    }

    return data as Profile;
  },

  async consumeFreeSwipe(count: number): Promise<number | null> {
    const safeCount = Math.max(1, Math.floor(count));
    const { data, error } = await supabase.rpc('consume_free_swipe', { p_amount: safeCount });
    if (error) throw error;
    if (typeof data === 'number') return data;
    return null;
  },
};

