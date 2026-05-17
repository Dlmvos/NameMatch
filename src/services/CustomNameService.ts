import { supabase } from '../lib/supabase';
import type { BabyName, Gender, Region } from '../types';
import { SwipeService } from './SwipeService';

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

    const insertPayload = {
      id: customNameId,
      name: trimmedName,
      meaning: '',
      origin: 'Custom' as const,
      gender,
      country: country ?? null,
      region,
      is_worldwide: false as const,
      is_premium: false as const,
      meaning_verified: false as const,
    };

    if (__DEV__) {
      const { data: authData, error: authGetErr } = await supabase.auth.getUser();
      const user = authData?.user ?? null;
      console.log('[CustomNameDebug] auth before insert', {
        userId: user?.id ?? null,
        email: user?.email ?? null,
        authError: authGetErr?.message ?? null,
      });
      console.log('[CustomNameDebug] insert payload', insertPayload);
    }

    // 1. Insert into baby_names
    const { data: inserted, error: insertErr } = await supabase
      .from('baby_names')
      .insert(insertPayload)
      .select('id,name,meaning,origin,gender,country,region,is_worldwide')
      .single();

    if (insertErr || !inserted) {
      const message = supabaseErrorMessage(insertErr);
      if (__DEV__) {
        console.log('[CustomNameDebug] baby_names insert failed', {
          code: insertErr?.code ?? null,
          message: insertErr?.message ?? null,
          details: insertErr?.details ?? null,
          hint: insertErr?.hint ?? null,
          payload: insertPayload,
        });
      }
      throw new Error(`Failed to create custom name: ${message}`);
    }
    if (__DEV__) console.log('[CustomNameDebug] baby_names insert ok', { id: inserted.id });

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

    // 2. Record right-swipe for the creator (via SwipeService so `liked` stays in sync)
    try {
      await SwipeService.upsertSwipe({
        userId,
        roomId,
        nameId: inserted.id,
        direction: 'right',
      });
      if (__DEV__) {
        console.log('[CustomNameDebug] swipe upsert ok', { roomId, nameId: inserted.id });
      }
    } catch (swipeErr: any) {
      const message =
        swipeErr?.message ??
        supabaseErrorMessage(swipeErr?.error ?? swipeErr ?? null);
      if (__DEV__) console.log('[CustomNameDebug] swipe upsert failed', { message });
      throw new Error(`Custom name was created, but saving the like failed: ${message}`);
    }

    SwipeService.notifyPartnerCustomSurfaceHint(roomId);

    // 3. Check for match (partner may have somehow swiped this name already — very unlikely but consistent)
    let isMatch = false;
    try {
      const { data, error: rpcErr } = await supabase.rpc('check_and_create_match', {
        p_room_id: roomId,
        p_name_id: inserted.id,
        p_user_id: userId,
      });
      if (rpcErr) {
        if (__DEV__) console.log('[CustomNameDebug] match RPC error', { message: rpcErr.message });
      } else {
        isMatch = data === true;
        if (__DEV__) console.log('[CustomNameDebug] match RPC result', { isMatch, nameId: inserted.id });
      }
    } catch (e: any) {
      if (__DEV__) console.log('[CustomNameDebug] match RPC threw', { message: e?.message ?? String(e) });
    }

    return { babyName, isMatch };
  },
};
