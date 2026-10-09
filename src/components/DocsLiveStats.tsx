"use client";

import { useEffect, useState } from "react";
import { useStudyStore, dueReviews, weakPoints } from "@/store/useStudyStore";
import { allChunks } from "@/lib/rag/store";
import { formatCost, totals } from "@/lib/pricing";

/**
 * Live numbers from the viewer's own vault. Read in this browser only — the
 * docs page has no server data to show, by design.
 */
export function DocsLiveStats() {
  const hydrated = useStudyStore((s) => s.hydrated);
  const roadmaps = useStudyStore((s) => s.roadmaps);
  const summaries = useStudyStore((s) => s.summaries);
  const usage = useStudyStore((s) => s.usage);
  const [passages, setPassages] = useState<number | null>(null);

  useEffect(() => {
    allChunks()
      .then((c) => setPassages(c.length))
      .catch(() => setPassages(0));
  }, []);

  if (!hydrated) return null;

  const subtopics = roadmaps.flatMap((r) => r.topics.flatMap((t) => t.subtopics));
  const edges = subtopics.reduce((n, s) => n + (s.prerequisiteIds?.length ?? 0), 0);
  const weak = roadmaps.reduce((n, r) => n + weakPoints(r).length, 0);
  const due = roadmaps.reduce((n, r) => n + dueReviews(r).length, 0);
  const spend = totals(usage);

  const stats = [
    ["Roadmaps", roadmaps.length],
    ["Subtopics", subtopics.length],
    ["Prerequisite links", edges],
    ["Weak points tracked", weak],
    ["FSRS reviews due", due],
    ["Sessions summarised", summaries.length],
    ["Material passages indexed", passages ?? "…"],
    ["AI calls on your key", `${spend.calls} (${formatCost(spend.cost)} est.)`],
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
      {stats.map(([label, value]) => (
        <div key={label} className="bg-surface p-4">
          <dt className="text-[12px] text-ink-faint">{label}</dt>
          <dd className="mt-1 text-[18px] font-semibold tracking-tight text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
