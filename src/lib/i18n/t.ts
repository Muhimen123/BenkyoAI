/**
 * Pure translation helpers — no React, no store. Kept separate so they can be
 * unit-tested and reused outside the provider (e.g. in plain utility code).
 */
import { en } from "./messages/en";
import { bn } from "./messages/bn";
import { DEFAULT_LOCALE, type Locale } from "./types";

/** The dictionary shape, derived from English — the source of truth. */
export type Messages = typeof en;

const DICTIONARIES: Record<Locale, Messages> = { en, bn };

export type TranslateParams = Record<string, string | number>;

/**
 * Every dot-path in the English dictionary that resolves to a string, e.g.
 * "onboarding.hero.lede". Nested objects are walked; arrays are ignored.
 */
type StringPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? Prefix extends ""
      ? K
      : `${Prefix}.${K}`
    : T[K] extends object
      ? StringPaths<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
      : never;
}[keyof T & string];

export type MessageKey = StringPaths<Messages>;

/** `"x.count_one" | "x.count_other"` → `"x.count"`, for plural lookups. */
type StripPluralSuffix<T extends string> = T extends `${infer Base}_one`
  ? Base
  : T extends `${infer Base}_other`
    ? Base
    : never;

export type PluralKey = StripPluralSuffix<MessageKey>;

/** Resolves a dot-path against a nested dictionary. */
function lookup(dictionary: Messages, key: string): string | undefined {
  let current: unknown = dictionary;
  for (const part of key.split(".")) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

/** Fills `{param}` placeholders; unknown placeholders are left untouched. */
function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Translate a message key.
 *
 * Falls back to English when the active locale is missing a key (shouldn't
 * happen once the dictionaries are complete, but keeps the UI safe mid-edit),
 * then to the raw key — so a typo never renders an empty element.
 */
export function translate(
  locale: Locale,
  key: MessageKey | string,
  params?: TranslateParams,
): string {
  const template =
    lookup(DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE], key) ??
    lookup(DICTIONARIES[DEFAULT_LOCALE], key) ??
    key;
  return interpolate(template, params);
}

/**
 * Plural-aware translate. Picks `${base}_one` for exactly one, else
 * `${base}_other`, and passes `count` plus any extra params through.
 *
 * Explicit `_one` / `_other` keys are used instead of ICU rules — simpler, and
 * enough for both English and Bangla, neither of which needs more categories.
 */
export function plural(
  locale: Locale,
  base: PluralKey | string,
  count: number,
  params?: TranslateParams,
): string {
  const suffix = count === 1 ? "_one" : "_other";
  return translate(locale, `${base}${suffix}`, { ...params, count });
}
