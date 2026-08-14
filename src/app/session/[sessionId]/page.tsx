"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Check, CircleDashed, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Eyebrow } from "@/components/ui/Feedback";
import { GrowthCallout } from "@/components/GrowthCallout";
import { useStudyStore } from "@/store/useStudyStore";
import type { MistakeType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const MISTAKE_LABEL: Record<MistakeType, string> = {
  careless: "careless slip",
  misunderstanding: "wrong model",
  "missing-concept": "missing foundation",
};

export default function SessionSummaryPage() {
  const params = useParams<{ sessionId: string }>();
  const summaries = useStudyStore((s) => s.summaries);
  const hydrated = useStudyStore((s) => s.hydrated);
  const summary = summaries.find((s) => s.sessionId === params.sessionId);

  if (hydrated && !summary) {
    return (
      <AppShell>
        <EmptyState
          title="No recap for that session"
          body="Recaps are written when a session ends. This one may still be open."
          action={
            <Link href="/dashboard">
              <Button size="sm" variant="secondary">
                Back to today
              </Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  if (!summary) return <AppShell>{null}</AppShell>;

  return (
    <AppShell>
      <header className="mb-8 border-b border-line pb-6">
        <Eyebrow>Session recap · {formatDate(summary.endedAt)}</Eyebrow>
        <h1 className="mt-2 text-[26px] leading-tight font-semibold tracking-tight text-ink sm:text-[32px]">
          {summary.struggled.length === 0
            ? "Clean run."
            : summary.growth.length > 0
              ? "Progress, and a couple of loose ends."
              : "Here's what stuck, and what didn't."}
        </h1>
        <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3">
          {[
            { label: "Minutes", value: summary.durationMin },
            { label: "Steps touched", value: summary.covered.length },
            { label: "Solid", value: summary.understood.length },
            { label: "Needs work", value: summary.struggled.length },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="text-[26px] leading-none font-semibold tracking-tight text-ink tabular-nums">
                {stat.value}
              </dd>
              <dt className="label-data mt-1 text-ink-faint">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="space-y-6">
          {summary.growth.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-[15px] font-semibold text-ink">You got these back</h2>
              {summary.growth.map((g) => (
                <GrowthCallout key={g.id} growth={g} />
              ))}
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-3">
              <p className="label-data flex items-center gap-1.5 text-sage-700">
                <Check className="size-3" /> Understood well
              </p>
              {summary.understood.length ? (
                <ul className="space-y-2">
                  {summary.understood.map((item) => (
                    <li key={item.subtopicId} className="text-sm text-ink-soft">
                      <Link
                        href={`/subtopic/${item.subtopicId}`}
                        className="text-ink hover:underline"
                      >
                        {item.title}
                      </Link>
                      <span className="label-data ml-2 text-ink-faint">{item.mastery}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">Nothing landed cleanly this time.</p>
              )}
            </Card>

            <Card className="space-y-3">
              <p className="label-data flex items-center gap-1.5 text-clay-700">
                <TriangleAlert className="size-3" /> Struggled with
              </p>
              {summary.struggled.length ? (
                <ul className="space-y-2.5">
                  {summary.struggled.map((item) => (
                    <li key={item.subtopicId + item.mistakeType} className="space-y-1">
                      <Link
                        href={`/subtopic/${item.subtopicId}`}
                        className="text-sm text-ink hover:underline"
                      >
                        {item.title}
                      </Link>
                      <Badge tone={item.mistakeType === "careless" ? "review" : "clay"}>
                        {MISTAKE_LABEL[item.mistakeType]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">Nothing tripped you up.</p>
              )}
            </Card>
          </section>

          <section className="space-y-3">
            <p className="label-data flex items-center gap-1.5 text-ink-faint">
              <CircleDashed className="size-3" /> Covered
            </p>
            <div className="flex flex-wrap gap-2">
              {summary.covered.map((item) => (
                <Link
                  key={item.subtopicId}
                  href={`/subtopic/${item.subtopicId}`}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          {summary.nextUp && (
            <Card tone="accent" className="space-y-3">
              <Eyebrow className="text-gold-700">Next session</Eyebrow>
              <p className="text-[17px] leading-snug font-semibold tracking-tight text-ink">
                {summary.nextUp.title}
              </p>
              <p className="text-[13px] leading-snug text-ink-soft">
                {summary.nextUp.reason}
              </p>
              <Link href={`/subtopic/${summary.nextUp.subtopicId}`}>
                <Button size="sm" icon={<ArrowRight className="size-4" />} full>
                  Start it now
                </Button>
              </Link>
            </Card>
          )}

          {summary.carryOver && (
            <Card className="space-y-2">
              <Eyebrow>Held over</Eyebrow>
              <p className="text-sm leading-relaxed text-ink-soft">
                {summary.carryOver.question}
              </p>
              <p className="text-[13px] text-ink-faint">
                You'll be asked this when you come back.
              </p>
            </Card>
          )}

          <Link href="/dashboard">
            <Button variant="secondary" full>
              Back to today
            </Button>
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}
