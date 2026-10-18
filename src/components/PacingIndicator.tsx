"use client";

import { CalendarClock } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { Roadmap } from "@/lib/types";
import { cn, daysUntil, formatDate } from "@/lib/utils";

/** How the deadline is bending the roadmap — visible, not buried in settings. */
export function PacingIndicator({
  roadmap,
  mastery,
  className,
}: {
  roadmap: Roadmap;
  mastery: number;
  className?: string;
}) {
  const { t } = useT();
  const days = daysUntil(roadmap.deadline);

  if (days === null) {
    return (
      <p className={cn("text-[13px] leading-snug text-ink-soft", className)}>
        {t("pacing.noDeadline", { note: roadmap.pacing.note })}
      </p>
    );
  }

  const total = 60;
  const elapsed = Math.max(0, Math.min(100, ((total - days) / total) * 100));
  const behind = elapsed - mastery > 15;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label-data flex items-center gap-1.5 text-ink-soft">
          <CalendarClock className="size-3" />
          {days > 0
            ? t("pacing.daysTo", { days, date: formatDate(roadmap.deadline) })
            : t("pacing.deadlinePassed")}
        </span>
        <span
          className={cn(
            "label-data",
            behind ? "text-clay-700" : "text-sage-700",
          )}
        >
          {behind ? t("pacing.behind") : t("pacing.onPace")}
        </span>
      </div>
      <div className="relative h-1 overflow-hidden rounded-full bg-line">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            behind ? "bg-clay-500" : "bg-sage-500",
          )}
          style={{ width: `${Math.max(2, mastery)}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-ink/40"
          style={{ left: `${Math.min(99, elapsed)}%` }}
          aria-hidden
        />
      </div>
      <p className="text-[13px] leading-snug text-ink-soft">
        {t("pacing.sessionsNote", {
          perWeek: roadmap.pacing.sessionsPerWeek,
          perSession: roadmap.pacing.minutesPerSession,
          note: roadmap.pacing.note,
        })}
      </p>
    </div>
  );
}
