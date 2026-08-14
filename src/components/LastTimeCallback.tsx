"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SessionSummary } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

/**
 * The moment a new session opens by referring to the last one.
 * Deliberately phrased as a question, not a status line.
 */
export function LastTimeCallback({
  summary,
  className,
}: {
  summary: SessionSummary;
  className?: string;
}) {
  if (!summary.carryOver) return null;

  return (
    <section
      className={cn(
        "animate-rise rounded-xl border border-maize-100 bg-maize-50 p-5",
        className,
      )}
    >
      <p className="label-data flex items-center gap-1.5 text-maize-700">
        <History className="size-3" />
        Picking up from {relativeTime(summary.endedAt)}
      </p>
      <p className="mt-2.5 text-[17px] leading-snug font-medium text-ink">
        {summary.carryOver.question}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/subtopic/${summary.carryOver.subtopicId}?mode=recall`}>
          <Button size="sm">Check if it stuck</Button>
        </Link>
        <Link href={`/subtopic/${summary.carryOver.subtopicId}`}>
          <Button size="sm" variant="ghost">
            Re-read it first
          </Button>
        </Link>
      </div>
    </section>
  );
}
