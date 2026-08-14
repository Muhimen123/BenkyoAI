import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "gold" | "review" | "sage" | "clay" | "moss";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunk text-ink-soft border-line",
  gold: "bg-gold-50 text-gold-700 border-gold-200",
  review: "bg-maize-50 text-maize-700 border-maize-100",
  sage: "bg-sage-50 text-sage-700 border-sage-100",
  clay: "bg-clay-50 text-clay-700 border-clay-100",
  moss: "bg-moss-900 text-[#e8ecd8] border-moss-900",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-data inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
