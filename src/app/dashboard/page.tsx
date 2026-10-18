"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Flag,
  Moon,
  PartyPopper,
  Plus,
  PlayCircle,
  Repeat2,
  Sparkles,
} from "lucide-react";
import { AppShell, PageHead } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Eyebrow, Skeleton } from "@/components/ui/Feedback";
import { MasteryMeter } from "@/components/ui/MasteryMeter";
import { RoadmapView } from "@/components/RoadmapView";
import { LastTimeCallback } from "@/components/LastTimeCallback";
import { GrowthCallout } from "@/components/GrowthCallout";
import { PacingIndicator } from "@/components/PacingIndicator";
import { UsageMeter } from "@/components/UsageMeter";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  activeSession,
  dueReviews,
  nextSubtopic,
  roadmapProgress,
  sessionsFor,
  summariesFor,
  useStudyStore,
  weakPoints,
} from "@/store/useStudyStore";
import type { Purpose } from "@/lib/types";

const PURPOSE_LABEL_KEY: Record<Purpose, string> = {
  exam: "dashboard.purpose.exam",
  project: "dashboard.purpose.project",
  job: "dashboard.purpose.job",
  curiosity: "dashboard.purpose.curiosity",
};

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useStudyStore((s) => s.hydrated);
  const roadmap = useStudyStore((s) => s.roadmap);
  const roadmaps = useStudyStore((s) => s.roadmaps);
  const switchRoadmap = useStudyStore((s) => s.switchRoadmap);
  const allSessions = useStudyStore((s) => s.sessions);
  const allSummaries = useStudyStore((s) => s.summaries);
  const startSession = useStudyStore((s) => s.startSession);
  const { t, tp } = useT();

  // Scoped to the roadmap in view — the store keeps one flat list for all of them.
  const sessions = sessionsFor(allSessions, roadmap);
  const summaries = summariesFor(allSummaries, roadmap);

  const progress = roadmapProgress(roadmap);
  const next = nextSubtopic(roadmap);
  const resume = activeSession(sessions);
  const weak = weakPoints(roadmap);
  const due = dueReviews(roadmap);
  const lastSummary = summaries[0];
  const growth = summaries.flatMap((s) => s.growth).slice(0, 3);
  const lastMilestone =
    roadmap?.topics.filter((t) => t.isMilestone && t.status !== "not-started").at(-1) ??
    roadmap?.topics.find((t) => t.isMilestone);

  function openNext() {
    if (!next) return;
    startSession({
      subtopicId: next.subtopic.id,
      subtopicTitle: next.subtopic.title,
      topicTitle: next.topic.title,
      mode: "lesson",
    });
    router.push(`/subtopic/${next.subtopic.id}`);
  }

  if (!hydrated || !roadmap) {
    return (
      <AppShell>
        <div className="space-y-5">
          <Skeleton className="h-9 w-2/3 max-w-sm" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHead
        eyebrow={t(PURPOSE_LABEL_KEY[roadmap.purpose])}
        title={roadmap.title}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {roadmaps.length > 1 && (
              <select
                value={roadmap.id}
                onChange={(e) => switchRoadmap(e.target.value)}
                aria-label={t("dashboard.switchRoadmap")}
                className="h-9 max-w-[45vw] rounded-lg border border-line bg-surface px-2.5 text-[13px] text-ink sm:max-w-none"
              >
                {roadmaps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            )}
            <Link href="/?new=1">
              <Button variant="secondary" size="sm" icon={<Plus className="size-4" />}>
                {t("dashboard.newRoadmap")}
              </Button>
            </Link>
            <Link href="/vault">
              <Button variant="secondary" size="sm">
                {t("dashboard.openVault")}
              </Button>
            </Link>
          </div>
        }
      />

      {/* min-w-0: grid items default to min-width:auto, so without it a wide
          child (the roadmap tree) pushes the whole page sideways on mobile. */}
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="min-w-0 space-y-6">
          {progress.total > 0 && progress.done === progress.total && (
            <div className="flex items-start gap-3 rounded-xl border border-sage-200 bg-sage-50 p-4 sm:p-5">
              <PartyPopper className="mt-0.5 size-5 shrink-0 text-sage-600" />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-sage-900">
                  {t("dashboard.congrats.heading", { title: roadmap.title })}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-sage-700/80">
                  {t("dashboard.congrats.body")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/recall/exam-night">
                    <Button size="sm">{t("dashboard.congrats.finalPass")}</Button>
                  </Link>
                  <Link href="/?new=1">
                    <Button variant="secondary" size="sm" icon={<Plus className="size-4" />}>
                      {t("dashboard.congrats.startNew")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {lastSummary?.carryOver && <LastTimeCallback summary={lastSummary} />}

          {/* the one thing to do right now */}
          <div className="book-card rounded-xl">
            {/* book cover that flips open */}
            <div className="book-cover flex flex-col justify-center items-center gap-1 rounded-xl p-6 bg-gradient-to-br from-gold-100 to-gold-50 border border-gold-200">
              <Eyebrow className="text-gold-700">
                {resume ? t("dashboard.next.unfinished") : t("dashboard.next.nextStep")}
              </Eyebrow>
              <h3 className="text-center text-[17px] font-semibold text-ink tracking-tight mt-1 max-w-[85%] truncate">
                {resume?.subtopicTitle ?? next?.subtopic.title ?? t("dashboard.next.fallbackTitle")}
              </h3>
              <span className="label-data text-gold-500 mt-2">{t("dashboard.next.hoverHint")}</span>
            </div>

            <Card tone="accent" inset={false} className="space-y-4 pl-16 pr-5 py-5 sm:pl-24 sm:pr-6 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Eyebrow className="text-gold-700">
                    {resume ? t("dashboard.next.unfinished") : t("dashboard.next.nextStep")}
                  </Eyebrow>
                  <h2 className="mt-1.5 text-[19px] leading-snug font-semibold tracking-tight text-ink">
                    {resume?.subtopicTitle ?? next?.subtopic.title ?? t("dashboard.next.allMastered")}
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-soft">
                    {resume
                      ? t("dashboard.next.resumeDetail", {
                          topic: resume.topicTitle ?? "",
                          n: resume.lastQuestionIndex + 1,
                        })
                      : next
                        ? t("dashboard.next.nextDetail", {
                            topic: next.topic.title,
                            min: next.subtopic.estimatedMin,
                          })
                        : t("dashboard.next.emptyDetail")}
                  </p>
                </div>
                {next && (
                  <MasteryMeter
                    value={resume ? resume.progress : next.subtopic.mastery}
                    status={next.subtopic.status}
                    className="hidden shrink-0 sm:inline-flex"
                  />
                )}
              </div>

              {(resume || next) && (
                <div className="flex flex-wrap gap-2">
                  {resume ? (
                    <Link href={`/subtopic/${resume.subtopicId}`}>
                      <Button icon={<PlayCircle className="size-4" />}>
                        {t("dashboard.next.resume")}
                      </Button>
                    </Link>
                  ) : (
                    <Button onClick={openNext} icon={<PlayCircle className="size-4" />}>
                      {t("dashboard.next.startStep")}
                    </Button>
                  )}
                  {weak.length > 0 && (
                    <Badge tone="review" icon={<Sparkles className="size-2.5" />}>
                      {tp("dashboard.next.weakPoints", weak.length, { count: weak.length })}
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          </div>

          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold text-ink">{t("dashboard.roadmapHeading")}</h2>
              <Link
                href="/vault"
                className="text-[13px] font-medium text-gold-700 underline decoration-gold-200 underline-offset-4 hover:decoration-gold-500"
              >
                {t("dashboard.seeEverything")}
              </Link>
            </div>
            <RoadmapView roadmap={roadmap} />
          </section>

          {growth.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[15px] font-semibold text-ink">{t("dashboard.sinceStarted")}</h2>
              <div className="space-y-2">
                {growth.map((g) => (
                  <GrowthCallout key={g.id} growth={g} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-6">
          <Card className="card-reveal space-y-4">
            <div>
              <Eyebrow>{t("dashboard.progress")}</Eyebrow>
              <p className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[30px] leading-none font-semibold tracking-tight text-ink tabular-nums">
                  {progress.mastery}%
                </span>
                <span className="text-[13px] text-ink-soft">
                  {t("dashboard.stepsMastered", { done: progress.done, total: progress.total })}
                </span>
              </p>
            </div>
            <MasteryMeter value={progress.mastery} />
            <div className="border-t border-line pt-4">
              <PacingIndicator roadmap={roadmap} mastery={progress.mastery} />
            </div>
          </Card>

          <UsageMeter roadmapId={roadmap.id} />

          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-ink">{t("dashboard.activeRecall")}</h2>
              {due.length > 0 && (
                <Badge tone="review">
                  {t("dashboard.dueForReview", { count: due.length })}
                </Badge>
              )}
            </div>
            <div className="grid gap-3">
              <Link
                href="/recall/session-wise"
                className="group flex items-start gap-3 rounded-xl border border-sage-100 bg-sage-50 p-4 transition-all hover:bg-sage-100 hover:translate-x-0.5"
              >
                <span className="mt-0.5 text-sage-600 transition-transform group-hover:scale-110">
                  <Repeat2 className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-sage-900">{t("dashboard.recall.fromLastSession")}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-sage-700/80">
                    {t("dashboard.recall.fromLastSessionBody")}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-sage-400 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href={`/recall/milestone-wise?scope=${lastMilestone?.id ?? "all"}`}
                className="group flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 p-4 transition-all hover:bg-gold-100 hover:translate-x-0.5"
              >
                <span className="mt-0.5 text-gold-600 transition-transform group-hover:scale-110">
                  <Flag className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gold-900">{t("dashboard.recall.upToMilestone")}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-gold-700/80">
                    {lastMilestone
                      ? t("dashboard.recall.upToMilestoneBody", { title: lastMilestone.title })
                      : t("dashboard.recall.upToMilestoneBodyEmpty")}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-gold-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Exam night gets its own entry point, and its own weight */}
            <Link
              href="/recall/exam-night"
              className="btn-glow group block overflow-hidden rounded-xl p-5"
            >
              <span className="label-data flex items-center gap-1.5 text-[#c9d3ad]">
                <Moon className="size-3" />
                {t("dashboard.recall.examNight")}
              </span>
              <span className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[17px] font-semibold tracking-tight text-[#f3f1e6]">
                  {t("dashboard.recall.examNightTitle")}
                </span>
                <ArrowRight className="size-4 shrink-0 text-[#c9d3ad] transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1.5 block text-[13px] leading-snug text-[#a9b78a]">
                {t("dashboard.recall.examNightBody")}
              </span>
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function RecallLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-0 hover:bg-sunk"
    >
      <span className="mt-0.5 text-gold-500">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{body}</span>
      </span>
      <ArrowRight className="mt-1 size-3.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
