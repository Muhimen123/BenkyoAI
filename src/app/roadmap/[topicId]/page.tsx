"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Flag, Sparkles } from "lucide-react";
import { AppShell, PageHead } from "@/components/shell/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Eyebrow, Skeleton } from "@/components/ui/Feedback";
import { MasteryMeter, StatusDot } from "@/components/ui/MasteryMeter";
import { DepthControl } from "@/components/DepthControl";
import { RoadmapControls } from "@/components/RoadmapControls";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useStudyStore } from "@/store/useStudyStore";

export default function TopicPage() {
  const params = useParams<{ topicId: string }>();
  const { t } = useT();
  const hydrated = useStudyStore((s) => s.hydrated);
  const roadmap = useStudyStore((s) => s.roadmap);
  const topic = roadmap?.topics.find((t) => t.id === params.topicId);

  if (!hydrated) {
    return (
      <AppShell>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-6 h-72 w-full" />
      </AppShell>
    );
  }

  if (!topic || !roadmap) {
    return (
      <AppShell>
        <EmptyState
          title={t("topic.empty.title")}
          body={t("topic.empty.body")}
          action={
            <Link href="/vault">
              <Button size="sm" variant="secondary">
                {t("topic.empty.back")}
              </Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const index = roadmap.topics.findIndex((t) => t.id === topic.id);
  const nextTopic = roadmap.topics[index + 1];

  return (
    <AppShell>
      <Link
        href="/vault"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        {t("shell.nav.vault")}
      </Link>

      <PageHead
        eyebrow={t("topic.eyebrow", {
          n: String(index + 1).padStart(2, "0"),
          m: String(roadmap.topics.length).padStart(2, "0"),
        })}
        title={topic.title}
        lede={topic.summary}
        actions={<RoadmapControls roadmap={roadmap} />}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
        <div className="space-y-4">
          {topic.isMilestone && (
            <p className="flex items-center gap-2 text-[13px] text-gold-700">
              <Flag className="size-3.5" />
              {t("topic.milestoneNote")}
            </p>
          )}

          <ul className="overflow-hidden rounded-xl border border-line bg-surface">
            {topic.subtopics.map((sub, i) => (
              <li key={sub.id} className="border-b border-line last:border-0">
                <Link
                  href={`/subtopic/${sub.id}`}
                  className="group flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-sunk sm:px-5"
                >
                  <span className="label-data w-5 shrink-0 text-ink-faint tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <StatusDot status={sub.status} />
                      <span className="text-[15px] font-medium text-ink">{sub.title}</span>
                      {sub.isWeakPoint && (
                        <Badge tone="review" icon={<Sparkles className="size-2.5" />}>
                          {t("topic.reviewBlended")}
                        </Badge>
                      )}
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-ink-soft">
                      {sub.explanationStub}
                    </span>
                  </span>
                  <span className="hidden shrink-0 sm:block">
                    <MasteryMeter value={sub.mastery} status={sub.status} showValue />
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="px-4 pb-3 sm:hidden">
                  <MasteryMeter value={sub.mastery} status={sub.status} size="sm" showValue />
                </div>
              </li>
            ))}
          </ul>

          {nextTopic && (
            <Link
              href={`/roadmap/${nextTopic.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong sm:px-5"
            >
              <span>
                <Eyebrow>{t("topic.nextTopic")}</Eyebrow>
                <span className="mt-0.5 block text-sm font-medium text-ink">
                  {nextTopic.title}
                </span>
              </span>
              <ChevronRight className="size-4 text-ink-faint" />
            </Link>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="space-y-4">
            <div>
              <Eyebrow>{t("topic.topicMastery")}</Eyebrow>
              <p className="mt-1.5 text-[28px] leading-none font-semibold tracking-tight text-ink tabular-nums">
                {topic.mastery}%
              </p>
            </div>
            <MasteryMeter value={topic.mastery} status={topic.status} />
            <p className="text-[13px] leading-snug text-ink-soft">
              {t("topic.stepsMastered", {
                done: topic.subtopics.filter((s) => s.status === "mastered").length,
                total: topic.subtopics.length,
              })}
            </p>
          </Card>

          <Card className="space-y-3">
            <DepthControl />
            <p className="border-t border-line pt-3 text-[13px] leading-snug text-ink-soft">
              {t("topic.depthNote")}
            </p>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
