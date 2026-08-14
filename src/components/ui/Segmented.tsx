"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  full,
  className,
  ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  full?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-lg border border-line bg-sunk p-0.5",
        full && "w-full",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-[7px] font-medium transition-all duration-150",
              size === "sm" ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-1.5 text-sm",
              selected
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(46,33,18,0.06)]"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
