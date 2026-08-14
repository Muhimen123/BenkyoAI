import { Sprout } from "lucide-react";
import type { GrowthCallout as Growth } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Small celebratory moment — a mistake that stopped being one. */
export function GrowthCallout({
  growth,
  className,
}: {
  growth: Growth;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pop flex items-start gap-3 rounded-xl border border-sage-100 bg-sage-50 px-4 py-3.5",
        className,
      )}
    >
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sage-100 text-sage-700">
        <Sprout className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{growth.title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{growth.detail}</p>
      </div>
    </div>
  );
}
