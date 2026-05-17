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

/** Row returned by `create_custom_name` RPC (matches `baby_names`). */
interface CreateCustomNameRpcRow {
  id: string;
  name: string;
  meaning: string | null;
  origin: string | null;
  gender: string;
  country: string | null;
  region: string;
  is_worldwide: boolean;
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

    const rpcArgs = {
      p_name: trimmedName,
      p_gender: gender,
      p_room_id: roomId,
      p_region: region,
      p_country: country ?? null,
    };

    const { data: sessionWrap } = await supabase.auth.getSession();
    const activeSession = sessionWrap.session;
    if (!activeSession?.access_token) {
      throw new Error('Failed to create custom name: No active session. Please sign in again.');
    }

    if (__DEV__) {
      const { data: authData, error: authGetErr } = await supabase.auth.getUser();
      const authUser = authData?.user ?? null;
      const sessionUser = activeSession.user ?? null;
      console.log('[CustomNameDebug] auth before insert', {
        authUserId: authUser?.id ?? null,
        sessionUserId: sessionUser?.id ?? null,
        paramUserId: userId,
        sessionMatchesParam:
          !!sessionUser?.id && !!userId ? sessionUser.id === userId : null,
        hasAccessToken: !!activeSession.access_token,
        email: authUser?.email ?? null,
        authError: authGetErr?.message ?? null,
      });
      console.log('[CustomNameDebug] create_custom_name RPC args', rpcArgs);
    }

    // 1. Insert via SECURITY DEFINER RPC (RLS-safe; validates room membership server-side).
    const { data: inserted, error: insertErr } = await supabase.rpc('create_custom_name', rpcArgs);

    if (insertErr || !inserted) {
      const message = supabaseErrorMessage(insertErr);
      if (__DEV__) {
        console.log('[CustomNameDebug] create_custom_name RPC failed', {
          code: insertErr?.code ?? null,
          message: insertErr?.message ?? null,
          details: insertErr?.details ?? null,
          hint: insertErr?.hint ?? null,
          rpcArgs,
        });
      }
      throw new Error(`Failed to create custom name: ${message}`);
    }

    const row = inserted as CreateCustomNameRpcRow;
    if (__DEV__) console.log('[CustomNameDebug] create_custom_name RPC ok', { id: row.id });

    const babyName: BabyName = {
      id: row.id,
      name: row.name,
      meaning: row.meaning ?? '',
      origin: row.origin ?? 'Custom',
      gender: row.gender as Gender,
      country: row.country ?? undefined,
      region: row.region as Region,
      is_worldwide: row.is_worldwide ?? false,
      source: 'custom',
    };

    // 2. Record right-swipe for the creator (via SwipeService so `liked` stays in sync)
    try {
      await SwipeService.upsertSwipe({
        userId,
        roomId,
        nameId: row.id,
        direction: 'right',
      });
      if (__DEV__) {
        console.log('[CustomNameDebug] swipe upsert ok', { roomId, nameId: row.id });
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
        p_name_id: row.id,
        p_user_id: userId,
      });
      if (rpcErr) {
        if (__DEV__) console.log('[CustomNameDebug] match RPC error', { message: rpcErr.message });
      } else {
        isMatch = data === true;
        if (__DEV__) console.log('[CustomNameDebug] match RPC result', { isMatch, nameId: row.id });
      }
    } catch (e: any) {
      if (__DEV__) console.log('[CustomNameDebug] match RPC threw', { message: e?.message ?? String(e) });
    }

    return { babyName, isMatch };
  },
};
