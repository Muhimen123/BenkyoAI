/**
 * Pure translation helpers — no React, no store. Kept separate so they can be
 * unit-tested and reused outside the provider (e.g. in non-component utilities).
 */
import { en } from "./messages/en";
import { bn } from "./messages/bn";
import { DEFAULT_LOCALE, type Locale } from "./types";

const DICTS: Record<Locale, typeof en> = { en, bn };

/** Resolves a dot-path like "common.back" against a nested dictionary. */
function lookup(dict: typeof en, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined), dict);
  return typeof value === "string" ? value : undefined;
}

/** All dot-paths that lead to a string leaf in the English dictionary. */
type PathKeys<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : {
      [K in keyof T & string]: PathKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

export type MessageKey = PathKeys<typeof en>;

export type TranslateParams = Record<string, string | number>;

/** Fills `{param}` placeholders. */
function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.split(`{${k}}`).join(String(v)),
    template,
  );
}

/**
 * Translate a message key. Falls back to English when the Bangla dictionary is
 * missing a key (shouldn't happen post-build, but keeps the UI safe mid-edit),
 * then to the raw key — so a typo never renders empty.
 */
export function translate(
  locale: Locale,
  key: MessageKey | string,
  params?: TranslateParams,
): string {
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
  const template = lookup(dict, key) ?? lookup(en, key) ?? key;
  return interpolate(template, params);
}

/**
 * Plural-aware translate. Picks `${base}_one` for a count of 1, else
 * `${base}_other`, and passes `count` (and any extra params) through.
 *
 * Explicit `_one`/`_other` keys are used instead of ICU rules — simpler, and
 * correct for both English and Bangla's counter-word behaviour.
 */
export function plural(
  locale: Locale,
  base: MessageKey | string,
  count: number,
  params?: TranslateParams,
): string {
  const suffix = count === 1 ? "_one" : "_other";
  return translate(locale, `${base}${suffix}`, { ...params, count });
}
