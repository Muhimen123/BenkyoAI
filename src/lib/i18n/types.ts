/**
 * Locales BenkyoAI ships with. English is the default and the source of truth
 * for every message; every other locale is a full mirror of it.
 */
export type Locale = "en" | "bn";

export const LOCALES: Locale[] = ["en", "bn"];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Each language's own display name, always written in its own script —
 * the convention for language switchers. These never pass through `t()`.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "EN",
  bn: "বাংলা",
};
