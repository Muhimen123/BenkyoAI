"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import { useStudyStore } from "@/store/useStudyStore";
import { DEFAULT_LOCALE, type Locale } from "./types";
import {
  plural,
  translate,
  type MessageKey,
  type PluralKey,
  type TranslateParams,
} from "./t";

export type TFn = (key: MessageKey, params?: TranslateParams) => string;
export type TpFn = (base: PluralKey, count: number, params?: TranslateParams) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a message key, filling `{param}` placeholders. */
  t: TFn;
  /** Plural-aware translate: picks `${base}_one` / `${base}_other`. */
  tp: TpFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Holds the active locale (read from the persisted study store) and exposes
 * `t` / `tp` to every client component below it.
 *
 * Mounted once in the root layout, so every screen shares one language state
 * and the choice survives reloads. `<html lang>` is kept in sync so screen
 * readers and the browser know which language is actually on screen.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useStudyStore((s) => s.locale);
  const setLocaleState = useStudyStore((s) => s.setLocale);

  // Keep the document language in step with the UI. Server-rendered HTML
  // starts as `lang="en"`; after hydration a stored Bangla preference flips it.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => setLocaleState(next),
    [setLocaleState],
  );

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
 * Access the active locale and its translate functions. Any component that
 * calls this re-renders when the language changes — that is what flips the UI.
 */
export function useT(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context) return context;

  // Outside the provider (only possible in a stray test or story) fall back to
  // English instead of crashing.
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key, params) => translate(DEFAULT_LOCALE, key, params),
    tp: (base, count, params) => plural(DEFAULT_LOCALE, base, count, params),
  };
}
