import type { AppLanguage, BabyName, Gender, Region } from './index';

/**
 * Future Supabase (or edge) row for premium name records.
 * Kept separate from `BabyName` so server payloads can evolve without churning the UI type.
 */
export interface PremiumNameContentRow {
  id: string;
  name: string;
  meaning: string;
  origin: string;
  gender: Gender;
  country?: string | null;
  region: Region;
  is_worldwide: boolean;
}

/** One localized premium meaning; intended to be fetched by `locale` only. */
export interface PremiumMeaningTranslationRow {
  nameContentId: string;
  locale: AppLanguage;
  meaning: string;
}
