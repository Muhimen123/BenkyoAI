"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/types";

/**
 * The UI language switcher: EN ↔ বাংলা.
 *
 * Each language is labelled in its own script — the convention for language
 * pickers — so these labels are deliberately not translated. The surrounding
 * accessible label is.
 *
 * Styled as a compact pill to match the header chrome (GitHub link, key
 * status) so the top bar keeps one visual weight.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useT();

  return (
    <div
      role="radiogroup"
      aria-label={t("locale.toggleLabel")}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-line bg-sunk p-0.5",
        className,
      )}
    >
      {LOCALES.map((option) => {
        const selected = option === locale;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setLocale(option)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium transition-all duration-150",
              selected
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(46,33,18,0.06)]"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {LOCALE_NAMES[option]}
          </button>
        );
      })}
    </div>
  );
}
