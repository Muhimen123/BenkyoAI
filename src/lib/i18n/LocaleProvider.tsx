"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { DEFAULT_LOCALE, type Locale } from "./types";
import { plural, translate, type MessageKey, type TranslateParams } from "./t";

export type TFn = (key: MessageKey | string, params?: TranslateParams) => string;
export type TpFn = (base: MessageKey | string, count: number, params?: TranslateParams) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a message key with `{param}` interpolation. */
  t: TFn;
  /** Plural-aware translate: picks `${base}_one` / `${base}_other`. */
  tp: TpFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Holds the active locale (sourced from the persisted study store) and exposes
 * `t` / `tp`. Keeps `<html lang>` in sync so screen readers and the browser see
 * the right language on every toggle.
 *
 * English is the initial state for everyone (including SSR), so there's no
 * flash for English users; Bangla users see a one-frame English pass until the
 * store hydrates — the same pattern the app already uses for the roadmap.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useStudyStore((s) => s.locale);
  const setLocale = useStudyStore((s) => s.setLocale);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
      tp: (base, count, params) => plural(locale, base, count, params),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Access the locale + translation functions. Every component that calls this
 * re-renders when the locale changes — which is exactly what flips the UI.
 */
export function useT(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // Outside the provider (shouldn't happen — it wraps the whole app) we degrade
  // to English rather than crash, so a stray useT() in a test or story still works.
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key, params) => translate(DEFAULT_LOCALE, key, params),
    tp: (base, count, params) => plural(DEFAULT_LOCALE, base, count, params),
  };
}
