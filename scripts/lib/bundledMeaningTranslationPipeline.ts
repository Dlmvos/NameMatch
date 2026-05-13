/**
 * Shared rules for bundled core meaning translation export / merge / check.
 * Locales match `src/data/coreMeaningTranslations.json` (non-English UI strings).
 */
export const BUNDLE_MEANING_LOCALES = ['nl', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'] as const;
export type BundleMeaningLocale = (typeof BUNDLE_MEANING_LOCALES)[number];

const LOCALE_TAG = /\s*\[(?:nl|de|fr|es|it|pt|zh|ja|ko|ar)\]\s*$/i;

const LATIN_SCRIPT_LOCALES = new Set<string>(['nl', 'de', 'fr', 'es', 'it', 'pt']);

export function isBlankOrUnknownMeaning(s: string | undefined): boolean {
  if (s == null) return true;
  const t = s.trim();
  if (t.length === 0) return true;
  if (/^unknown$/i.test(t)) return true;
  if (/^n\/?a$/i.test(t)) return true;
  if (/^-+$/.test(t)) return true;
  if (/^\.+$/.test(t)) return true;
  return false;
}

/** True when value ends with a fake `[xx]` locale tag (any supported tag). */
export function endsWithAnyLocaleTag(s: string): boolean {
  return LOCALE_TAG.test(s.trim());
}

/** True when value ends with `[locale]` for this locale. */
export function endsWithLocaleTag(s: string, locale: string): boolean {
  const re = new RegExp(`\\s*\\[${locale}\\]\\s*$`, 'i');
  return re.test(s.trim());
}

export function meaningEqualsEnglish(value: string, enMeaning: string, locale: string): boolean {
  const v = value.trim();
  const e = enMeaning.trim();
  if (!v || !e) return false;
  if (v === e) return true;
  if (LATIN_SCRIPT_LOCALES.has(locale) && v.toLowerCase() === e.toLowerCase()) return true;
  return false;
}

/**
 * True when this id+locale should be sent for (re)translation — export and merge-overwrite use the same rule.
 */
export function shouldQueueTranslationJob(
  current: string | undefined,
  locale: string,
  enMeaning: string,
): boolean {
  if (!(BUNDLE_MEANING_LOCALES as readonly string[]).includes(locale)) return false;
  if (current === undefined || isBlankOrUnknownMeaning(current)) return true;
  const c = current.trim();
  if (endsWithLocaleTag(c, locale) || endsWithAnyLocaleTag(c)) return true;
  if (meaningEqualsEnglish(c, enMeaning, locale)) return true;
  return false;
}

const LATIN_FOR_EN_DUP_COUNT = new Set(['nl', 'de', 'fr', 'es', 'it', 'pt']);

/** Validation after GPT: block `[locale]` or any `[xx]` locale tag anywhere in the string. */
export function meaningHasBlockedLocaleTag(meaning: string, locale: string): boolean {
  const t = meaning.trim();
  if (new RegExp(`\\[${locale}\\]`, 'i').test(t)) return true;
  if (/\[(?:nl|de|fr|es|it|pt|zh|ja|ko|ar)\]/i.test(t)) return true;
  return false;
}

export function validateGeneratedMeaning(
  meaning: string,
  locale: string,
  enMeaning: string,
): { ok: true } | { ok: false; reason: string } {
  const m = meaning?.trim() ?? '';
  if (!m) return { ok: false, reason: 'empty' };
  if (meaningHasBlockedLocaleTag(m, locale)) return { ok: false, reason: 'locale_tag' };
  if (isBlankOrUnknownMeaning(m)) return { ok: false, reason: 'placeholder' };
  if (LATIN_FOR_EN_DUP_COUNT.has(locale) && m.toLowerCase() === enMeaning.trim().toLowerCase()) {
    return { ok: false, reason: 'identical_to_english' };
  }
  return { ok: true };
}

export function sortMeaningRecordKeys(
  record: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const loc of BUNDLE_MEANING_LOCALES) {
    if (record[loc] !== undefined) out[loc] = record[loc];
  }
  return out;
}

export function sortCoreMeaningJson(
  raw: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const ids = Object.keys(raw).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const out: Record<string, Record<string, string>> = {};
  for (const id of ids) {
    out[id] = sortMeaningRecordKeys(raw[id] ?? {});
  }
  return out;
}
