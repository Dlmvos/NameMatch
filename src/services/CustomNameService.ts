import { supabase } from '../lib/supabase';
import type { BabyName, Gender, Region } from '../types';

export interface AddCustomNameParams {
  name: string;
  gender: Gender;
  userId: string;
  roomId: string;
  /** Region from user profile; custom names inherit it for deck compatibility. */
  region: Region;
  country?: string;
}

export interface AddCustomNameResult {
  babyName: BabyName;
  isMatch: boolean;
}

function supabaseErrorMessage(error: { message?: string; code?: string; details?: string; hint?: string } | null): string {
  if (!error) return 'Unknown Supabase error';
  return [error.message, error.code, error.details, error.hint].filter(Boolean).join(' | ');
}

function randomHex(length: number): string {
  let out = '';
  while (out.length < length) {
    out += Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, '0');
  }
  return out.slice(0, length);
}

function generateCustomNameUuid(): string {
  const chars = randomHex(32).split('');
  const timeHex = Date.now().toString(16).padStart(12, '0').slice(-12);
  for (let i = 0; i < timeHex.length; i++) {
    chars[i] = timeHex[i];
  }
  chars[12] = '4';
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  return `${chars.slice(0, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}-${chars.slice(16, 20).join('')}-${chars.slice(20, 32).join('')}`;
}

/**
 * Inserts a user-created name into `baby_names`, swipes right on it for the
 * current user, and checks whether the partner also liked it (unlikely for
 * brand-new customs, but keeps the match contract consistent).
 */
export const CustomNameService = {
  async addCustomName(params: AddCustomNameParams): Promise<AddCustomNameResult> {
    const { name, gender, userId, roomId, region, country } = params;
    const trimmedName = name.trim();
    const customNameId = generateCustomNameUuid();

    if (__DEV__) {
      console.log('[CustomNameService] addCustomName start', {
        id: customNameId,
        name: trimmedName,
        gender,
        userId,
        roomId,
        region,
        country: country ?? null,
      });
    }

    // 1. Insert into baby_names
    const { data: inserted, error: insertErr } = await supabase
      .from('baby_names')
      .insert({
        id: customNameId,
        name: trimmedName,
        meaning: '',
        origin: 'Custom',
        gender,
        country: country ?? null,
        region,
        is_worldwide: false,
        is_premium: false,
      })
      .select('id,name,meaning,origin,gender,country,region,is_worldwide')
      .single();

    if (insertErr || !inserted) {
      const message = supabaseErrorMessage(insertErr);
      console.error('[CustomNameService] baby_names insert error:', message);
      throw new Error(`Failed to create custom name: ${message}`);
    }

    if (__DEV__) {
      console.log('[CustomNameService] baby_names insert success', { id: inserted.id });
    }

    const babyName: BabyName = {
      id: inserted.id,
      name: inserted.name,
      meaning: inserted.meaning ?? '',
      origin: inserted.origin ?? 'Custom',
      gender: inserted.gender as Gender,
      country: inserted.country ?? undefined,
      region: inserted.region as Region,
      is_worldwide: inserted.is_worldwide ?? false,
      source: 'custom',
    };

    // 2. Record right-swipe for the creator
    const { error: swipeErr } = await supabase.from('swipes').upsert({
      user_id: userId,
      room_id: roomId,
      name_id: inserted.id,
      direction: 'right',
    });
    if (swipeErr) {
      const message = supabaseErrorMessage(swipeErr);
      console.error('[CustomNameService] swipe insert error:', message);
      throw new Error(`Custom name was created, but saving the like failed: ${message}`);
    }

    if (__DEV__) {
      console.log('[CustomNameService] swipe upsert success', {
        userId,
        roomId,
        nameId: inserted.id,
      });
    }

    // 3. Check for match (partner may have somehow swiped this name already — very unlikely but consistent)
    let isMatch = false;
    try {
      const { data } = await supabase.rpc('check_and_create_match', {
        p_room_id: roomId,
        p_name_id: inserted.id,
        p_user_id: userId,
      });
      isMatch = data === true;
    } catch {
      // Non-fatal
    }

    return { babyName, isMatch };
  },
};
