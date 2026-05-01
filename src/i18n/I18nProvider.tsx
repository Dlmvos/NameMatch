import React, { createContext, useContext, useMemo } from 'react';
import { t as runtimeT } from './runtime';

type TranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

type I18nContextValue = {
  language: string;
  t: TranslateFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  language,
  children,
}: {
  language: string;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      t: (key, vars) => runtimeT(key, language, vars),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return ctx;
}
