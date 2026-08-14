"use client";

import { useState } from "react";
import { ChevronDown, Clock3, FileStack } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Feedback";
import type { Summary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SummaryCard({
  summary,
  className,
}: {
  summary: Summary;
  className?: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Card className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>From your material</Eyebrow>
          <h3 className="mt-1.5 text-[17px] leading-snug font-semibold tracking-tight text-ink">
            {summary.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Hide summary" : "Show summary"}
          className="rounded-md p-1 text-ink-faint transition-colors hover:bg-sunk hover:text-ink"
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <ul className="animate-fade space-y-2.5">
          {summary.keyPoints.map((point, i) => (
            <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span className="label-data pt-1 text-ink-faint tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-4 border-t border-line pt-3">
        <span className="label-data flex items-center gap-1.5 text-ink-faint">
          <Clock3 className="size-3" /> {summary.readingTimeMin} min read
        </span>
        <span className="label-data flex items-center gap-1.5 text-ink-faint">
          <FileStack className="size-3" /> {summary.materialIds.length} source
          {summary.materialIds.length === 1 ? "" : "s"}
        </span>
      </div>
    </Card>
  );
}
