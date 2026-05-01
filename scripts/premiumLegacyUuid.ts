/**
 * Single source for deterministic premium `baby_names.id` / `premium_meaning_translations.name_content_id`
 * derived from legacy zero-padded ids in `premiumBundledLegacy.names.ts`.
 *
 * Must stay in sync with `scripts/seedPremiumBabyNames.ts` / `scripts/seedPremiumMeaningTranslations.ts`.
 */
import { v5 as uuidv5 } from 'uuid';

export const PREMIUM_LEGACY_NAMESPACE_UUID = 'c3e8f2a1-7b4d-5e9f-8c2a-1d0e3f4a5b6c';

export function legacyPremiumIdToUuid(legacyId: string): string {
  return uuidv5(`namematch-legacy:${legacyId}`, PREMIUM_LEGACY_NAMESPACE_UUID);
}
