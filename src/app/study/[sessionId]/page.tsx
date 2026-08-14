"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell, PageHead } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { RoadmapView } from "@/components/RoadmapView";
import { SummaryCard } from "@/components/SummaryCard";
import { ChatPanel } from "@/components/ChatPanel";
import { useStudyStore } from "@/store/useStudyStore";
import { relativeTime } from "@/lib/utils";

/**
 * The combined study view for a session: what the material said, where you are
 * on the roadmap, and the helper chat — all in one place.
 */
export default function StudySessionPage() {
  const params = useParams<{ sessionId: string }>();
  const hydrated = useStudyStore((s) => s.hydrated);
  const roadmap = useStudyStore((s) => s.roadmap);
  const summary = useStudyStore((s) => s.summary);
  const session = useStudyStore((s) =>
    s.sessions.find((x) => x.id === params.sessionId),
  );

  if (!hydrated) {
    return (
      <AppShell width="wide">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-6 h-72 w-full" />
      </AppShell>
    );
  }

  if (!session || !roadmap) {
    return (
      <AppShell width="wide">
        <EmptyState
          title="That session isn't in your vault"
          body="Sessions live in this browser. If you cleared it, this link won't resolve."
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

  return (
    <AppShell width="wide">
      <Link
        href="/vault"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Vault
      </Link>

      <PageHead
        eyebrow={`${session.mode} session · started ${relativeTime(session.startedAt)}`}
        title={session.subtopicTitle ?? roadmap.title}
        actions={
          session.subtopicId ? (
            <Link href={`/subtopic/${session.subtopicId}`}>
              <Button size="sm">
                {session.endedAt ? "Open this step" : "Resume"}
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="min-w-0 space-y-6">
          {summary && <SummaryCard summary={summary} />}
          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold text-ink">Where this sits</h2>
            <RoadmapView roadmap={roadmap} />
          </section>
        </div>

        <aside>
          <ChatPanel
            sessionId={session.id}
            roadmapTitle={roadmap.title}
            subtopicTitle={session.subtopicTitle}
            className="h-[560px] lg:sticky lg:top-20"
          />
        </aside>
      </div>
    </AppShell>
  );
}
