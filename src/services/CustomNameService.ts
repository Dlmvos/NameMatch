import { CORE_BUNDLED_NAMES } from '../data/names';
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

export type InheritedMeaningForCustom = {
  meaning: string;
  origin: string;
  meaning_source: string | null;
  meaning_confidence: number | null;
  meaning_verified: boolean;
  meaning_language: string | null;
};

function supabaseErrorMessage(error: { message?: string; code?: string; details?: string; hint?: string } | null): string {
  if (!error) return 'Unknown Supabase error';
  return [error.message, error.code, error.details, error.hint].filter(Boolean).join(' | ');
}

/** Match key: normalize(name) ≡ lower(trim(name)) */
function normalizedNameLookupKey(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Find catalog/bundled meaning metadata to seed a Custom row (does not inspect gender flags).
 */
export async function findExistingMeaningForName(
  name: string,
): Promise<(InheritedMeaningForCustom & { source: 'bundled' | 'db' }) | null> {
  const key = normalizedNameLookupKey(name);
  if (!key) return null;

  for (const n of CORE_BUNDLED_NAMES) {
    if (normalizedNameLookupKey(n.name) !== key) continue;
    const originTrim = (n.origin ?? '').trim();
    const origin =
      originTrim !== '' && originTrim.toLowerCase() !== 'custom' ? originTrim : 'Custom';
    return {
      meaning: n.meaning ?? '',
      origin,
      meaning_source: 'bundled',
      meaning_confidence: null,
      meaning_verified: false,
      meaning_language: null,
      source: 'bundled',
    };
  }

  const { data, error } = await supabase.rpc('peek_baby_name_meaning_template', {
    p_name: name.trim(),
  });

  if (error) {
    return null;
  }

  const rowRaw = Array.isArray(data) ? data[0] : data;
  if (!rowRaw || typeof rowRaw !== 'object') return null;

  const row = rowRaw as {
    meaning: string | null;
    origin: string | null;
    meaning_source: string | null;
    meaning_confidence: number | null;
    meaning_verified: boolean | null;
    meaning_language: string | null;
  };

  const o = (row.origin ?? '').trim();
  const origin = o !== '' && o.toLowerCase() !== 'custom' ? o : 'Custom';

  return {
    meaning: row.meaning?.trim() ?? '',
    origin,
    meaning_source: row.meaning_source ?? null,
    meaning_confidence: row.meaning_confidence ?? null,
    meaning_verified: !!row.meaning_verified,
    meaning_language: row.meaning_language ?? null,
    source: 'db',
  };
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

    const { data: sessionWrap } = await supabase.auth.getSession();
    const activeSession = sessionWrap.session;
    if (!activeSession?.access_token) {
      throw new Error('Failed to create custom name: No active session. Please sign in again.');
    }

    const inherited = await findExistingMeaningForName(trimmedName);

    const inheritedRpcFields = inherited
      ? {
          p_meaning: inherited.meaning,
          p_origin: inherited.origin,
          p_meaning_source: inherited.meaning_source,
          p_meaning_confidence: inherited.meaning_confidence,
          p_meaning_verified: inherited.meaning_verified,
          p_meaning_language: inherited.meaning_language,
        }
      : {
          p_meaning: '',
          p_origin: 'Custom',
          p_meaning_source: null,
          p_meaning_confidence: null,
          p_meaning_verified: false,
          p_meaning_language: null,
        };

    const rpcArgs = {
      p_name: trimmedName,
      p_gender: gender,
      p_room_id: roomId,
      p_region: region,
      p_country: country ?? null,
      ...inheritedRpcFields,
    };

    // Insert via SECURITY DEFINER RPC (RLS-safe; validates room membership server-side).
    const { data: inserted, error: insertErr } = await supabase.rpc('create_custom_name', rpcArgs);

    if (insertErr || !inserted) {
      const message = supabaseErrorMessage(insertErr);
      throw new Error(`Failed to create custom name: ${message}`);
    }

    const row = inserted as CreateCustomNameRpcRow;

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

    try {
      await SwipeService.upsertSwipe({
        userId,
        roomId,
        nameId: row.id,
        direction: 'right',
      });
    } catch (swipeErr: any) {
      const message =
        swipeErr?.message ?? supabaseErrorMessage(swipeErr?.error ?? swipeErr ?? null);
      throw new Error(`Custom name was created, but saving the like failed: ${message}`);
    }

    SwipeService.notifyPartnerCustomSurfaceHint(roomId);

    let isMatch = false;
    try {
      const { data, error: rpcErr } = await supabase.rpc('check_and_create_match', {
        p_room_id: roomId,
        p_name_id: row.id,
        p_user_id: userId,
      });
      if (!rpcErr) {
        isMatch = data === true;
      }
    } catch {
      // Match check is best-effort after creating the swipe.
    }

    return { babyName, isMatch };
  },
};
