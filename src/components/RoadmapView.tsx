"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Flag, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MasteryMeter, StatusDot } from "@/components/ui/MasteryMeter";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { Roadmap, Topic } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

export function RoadmapView({
  roadmap,
  /** Ids to open on first render — everything else starts collapsed on mobile. */
  openTopicId,
  showAdjustment = true,
  className,
}: {
  roadmap: Roadmap;
  openTopicId?: string;
  showAdjustment?: boolean;
  className?: string;
}) {
  const { t } = useT();
  const firstUnfinished =
    roadmap.topics.find((t) => t.status !== "mastered")?.id ?? roadmap.topics[0]?.id;
  const [open, setOpen] = useState<string[]>([openTopicId ?? firstUnfinished]);

  const toggle = (id: string) =>
    setOpen((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  return (
    <div className={cn("space-y-3", className)}>
      {showAdjustment && roadmap.lastAdjustment && (
        <p className="flex items-start gap-2 rounded-lg border border-gold-200 bg-gold-50 px-3.5 py-2.5 text-[13px] leading-snug text-gold-700">
          <RefreshCw className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t("roadmap.adjusted", { when: relativeTime(roadmap.lastAdjustment.at) })}{" "}
            {roadmap.lastAdjustment.reason}
          </span>
        </p>
      )}

      <ul className="overflow-hidden rounded-xl border border-line bg-surface">
        {roadmap.topics.map((topic, index) => (
          <TopicRow
            key={topic.id}
            topic={topic}
            index={index}
            expanded={open.includes(topic.id)}
            onToggle={() => toggle(topic.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function TopicRow({
  topic,
  index,
  expanded,
  onToggle,
}: {
  topic: Topic;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t, tp } = useT();
  return (
    <li className="border-b border-line last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sunk sm:px-5"
      >
        <span className="label-data w-6 shrink-0 text-ink-faint tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-medium text-ink">{topic.title}</span>
            {topic.isMilestone && (
              <Badge tone="gold" icon={<Flag className="size-2.5" />}>
                {t("roadmap.milestone")}
              </Badge>
            )}
            {topic.origin === "manual" && <Badge>{t("roadmap.yours")}</Badge>}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-ink-soft">
            {topic.summary}
          </span>
        </span>
        <MasteryMeter
          value={topic.mastery}
          status={topic.status}
          showValue
          className="hidden sm:inline-flex"
        />
        <MasteryMeter
          value={topic.mastery}
          status={topic.status}
          size="sm"
          className="sm:hidden"
        />
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-ink-faint transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </button>

      {expanded && (
        <ul className="animate-fade border-t border-line bg-sunk/40 pl-4 sm:pl-11">
          {topic.subtopics.map((sub) => (
            <li key={sub.id} className="border-b border-line/70 last:border-0">
              <Link
                href={`/subtopic/${sub.id}`}
                className="group flex items-center gap-3 py-3 pr-4 pl-1 transition-colors hover:bg-surface sm:pr-5"
              >
                <StatusDot status={sub.status} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-ink group-hover:text-ink">
                      {sub.title}
                    </span>
                    {sub.isWeakPoint && (
                      <Badge tone="review" icon={<Sparkles className="size-2.5" />}>
                        {t("roadmap.blendedReview")}
                      </Badge>
                    )}
                  </span>
                  <span className="label-data mt-0.5 block text-ink-faint">
                    {t("roadmap.minCount", { n: sub.estimatedMin })}
                    {sub.sessionIds.length > 0 &&
                      ` · ${tp("roadmap.sessionCount", sub.sessionIds.length, { count: sub.sessionIds.length })}`}
                  </span>
                </span>
                <MasteryMeter value={sub.mastery} status={sub.status} size="sm" showValue />
                <ChevronRight className="size-3.5 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
          <li className="py-2.5">
            <Link
              href={`/roadmap/${topic.id}`}
              className="text-[13px] font-medium text-gold-700 underline decoration-gold-200 underline-offset-4 hover:decoration-gold-500"
            >
              {t("roadmap.openTopic", { title: topic.title })}
            </Link>
          </li>
        </ul>
      )}
    </li>
  );
}
