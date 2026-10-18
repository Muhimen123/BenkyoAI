/** Locales BenkyoAI ships with. English is the default and source of truth. */
export type Locale = "en" | "bn";

export const LOCALES: Locale[] = ["en", "bn"];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Each locale's own display name, always shown in its own script regardless of
 * which locale is active — the standard way to label a language toggle.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "EN",
  bn: "বাংলা",
};
