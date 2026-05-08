const SUPPORTED_EXTERNAL_DOC_LANGS = new Set([
  'en',
  'es',
  'pt',
  'nl',
  'de',
  'fr',
  'it',
  'zh',
  'ja',
  'ko',
  'ar',
]);

export type ExternalDocLangCode =
  | 'en'
  | 'es'
  | 'pt'
  | 'nl'
  | 'de'
  | 'fr'
  | 'it'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar';

/** Maps UI locale (e.g. `pt-BR`, `zh-CN`) to a supported website lang query param; defaults to `en`. */
export function toExternalDocLangCode(uiLanguage: string): ExternalDocLangCode {
  const base = uiLanguage.trim().toLowerCase().split(/[-_]/)[0] ?? 'en';
  return (SUPPORTED_EXTERNAL_DOC_LANGS.has(base) ? base : 'en') as ExternalDocLangCode;
}

/** Appends `lang=` using current UI language; preserves existing query strings with `&`. */
export function appendLangToExternalUrl(url: string, uiLanguage: string): string {
  const lang = toExternalDocLangCode(uiLanguage);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}lang=${lang}`;
}
