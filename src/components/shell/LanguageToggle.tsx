"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/types";

/**
 * The UI language toggle: EN ↔ বাংলা. Each locale is labelled in its own
 * script (the convention for language switchers), so the labels are static —
 * they never pass through `t()`.
 *
 * Styled to match the header's pill chrome (rounded-full, sunk track) so it
 * sits beside GitHubLink and KeyStatus without a weight mismatch.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useT();

  return (
    <div
      role="radiogroup"
      aria-label={t("locale.toggleLabel")}
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-sunk p-0.5",
        className,
      )}
    >
      {LOCALES.map((loc: Locale) => {
        const selected = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setLocale(loc)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium transition-all duration-150",
              selected
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(46,33,18,0.06)]"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {LOCALE_NAMES[loc]}
          </button>
        );
      })}
    </div>
  );
}
