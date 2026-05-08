import { t as runtimeT } from './runtime';

/** Language tag when I18nProvider is not mounted (startup gate, error boundary). */
export function getDeviceLanguageTag(): string {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
    return tag.split(/[-_]/)[0]?.toLowerCase() ?? 'en';
  } catch {
    return 'en';
  }
}

export function trStatic(key: string, vars?: Record<string, string | number>): string {
  return runtimeT(key, getDeviceLanguageTag(), vars);
}
