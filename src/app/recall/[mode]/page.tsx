"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Moon, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorNote, Eyebrow, Skeleton } from "@/components/ui/Feedback";
import { RecallItemCard } from "@/components/recall/RecallItemCard";
import { getRecallQueue, submitRecallAnswer } from "@/lib/api/recall";
import { endSession } from "@/lib/api/session";
import { sessionsFor, useStudyStore } from "@/store/useStudyStore";
import type {
  AnswerPayload,
  AnswerResult,
  MistakeType,
  RecallMode,
  RecallQueue,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const FRAMING: Record<RecallMode, { eyebrow: string; title: string; lede: string }> = {
  "session-wise": {
    eyebrow: "Active recall",
    title: "From your last session",
    lede: "What you covered, plus anything that was left unresolved. No explanations — pull it from memory.",
  },
  "milestone-wise": {
    eyebrow: "Active recall",
    title: "Up to your milestone",
    lede: "Everything leading to this point in the roadmap, weakest material first.",
  },
  "exam-night": {
    eyebrow: "Exam night",
    title: "The whole vault, one pass",
    lede: "No explanations, no going back. Answer, see if it held, move on.",
  },
};

export default function RecallPage() {
  const params = useParams<{ mode: string }>();
  const router = useRouter();
  const mode = (["session-wise", "milestone-wise", "exam-night"] as RecallMode[]).includes(
    params.mode as RecallMode,
  )
    ? (params.mode as RecallMode)
    : "session-wise";
  const examNightMode = mode === "exam-night";

  const hydrated = useStudyStore((s) => s.hydrated);
  const roadmap = useStudyStore((s) => s.roadmap);
  const allSessions = useStudyStore((s) => s.sessions);
  const startSession = useStudyStore((s) => s.startSession);
  const finishSession = useStudyStore((s) => s.finishSession);
  const recordAnswer = useStudyStore((s) => s.recordAnswer);
  const setExamNight = useStudyStore((s) => s.setExamNight);

  // Recall only ever covers the roadmap in view.
  const sessions = sessionsFor(allSessions, roadmap);

  const [queue, setQueue] = useState<RecallQueue | null>(null);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answered, setAnswered] = useState<
    { subtopicId: string; correct: boolean; mistakeType?: MistakeType; wasWeakPoint?: boolean }[]
  >([]);
  const [ending, setEnding] = useState(false);
  const [queueFailed, setQueueFailed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Exam night dims the whole app for as long as it's running.
  useEffect(() => {
    setExamNight(examNightMode);
    return () => setExamNight(false);
  }, [examNightMode, setExamNight]);

  useEffect(() => {
    if (!roadmap) return;
    const scope =
      new URLSearchParams(window.location.search).get("scope") ??
      (mode === "session-wise" ? sessions[0]?.id ?? "all" : "all");
    const session = startSession({ mode: "recall", topicTitle: FRAMING[mode].title });
    setSessionId(session.id);
    setQueueFailed(false);
    getRecallQueue({ mode, scope, roadmap })
      .then(setQueue)
      .catch(() => {
        setQueueFailed(true);
        setQueue({ mode, scopeLabel: "", items: [], vaultCoverage: { covered: 0, total: 0 } });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap?.id, mode]);

  async function handleSubmit(payload: AnswerPayload) {
    setSubmitting(true);
    setActionError(null);
    // Only items that came back from an earlier mistake were weak points.
    const wasWeakPoint = queue?.items[index]?.reason === "previous-mistake";
    try {
      const outcome = await submitRecallAnswer(payload);
      setResult(outcome);
      recordAnswer({
        subtopicId: payload.subtopicId,
        delta: outcome.understandingDelta,
        mistakeType: outcome.mistakeType,
      });
      setAnswered((a) => [
        ...a,
        {
          subtopicId: payload.subtopicId,
          correct: outcome.correct,
          mistakeType: outcome.mistakeType,
          wasWeakPoint,
        },
      ]);
    } catch {
      setActionError("Your answer couldn't be checked. Nothing was recorded — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function next() {
    if (!queue) return;
    if (index < queue.items.length - 1) {
      setResult(null);
      setIndex((i) => i + 1);
      return;
    }
    setEnding(true);
    setActionError(null);
    try {
      const session = sessions.find((s) => s.id === sessionId);
      if (session && roadmap) {
        const summary = await endSession({ session, roadmap, answered });
        finishSession(summary);
        setExamNight(false);
        router.push(`/session/${summary.sessionId}`);
        return;
      }
      router.push("/dashboard");
    } catch {
      setEnding(false);
      setActionError("The recap couldn't be written. Press next to try again.");
    }
  }

  const framing = FRAMING[mode];
  const item = queue?.items[index];
  const progress = queue?.items.length
    ? Math.round((index / queue.items.length) * 100)
    : 0;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>
        {examNightMode && (
          <Button
            size="sm"
            variant="ghost"
            icon={<X className="size-3.5" />}
            onClick={() => router.push("/dashboard")}
          >
            Leave exam night
          </Button>
        )}
      </div>

      <header className="mb-7 max-w-2xl">
        <Eyebrow className={cn(examNightMode && "text-gold-500")}>
          {examNightMode && <Moon className="mr-1 inline size-3" />}
          {framing.eyebrow}
        </Eyebrow>
        <h1 className="mt-2 text-[26px] leading-tight font-semibold tracking-tight text-ink sm:text-[32px]">
          {framing.title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{framing.lede}</p>
        {queue && (
          <p className="label-data mt-3 text-ink-faint">{queue.scopeLabel}</p>
        )}
      </header>

      {/* progress through the queue — for exam night, through the whole vault */}
      {queue && queue.items.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="label-data text-ink-faint">
              {examNightMode
                ? `${index} of ${queue.items.length} items · covering ${queue.vaultCoverage.covered} of ${queue.vaultCoverage.total} steps in your vault`
                : `${index} of ${queue.items.length} answered`}
            </span>
            <span className="label-data text-ink-faint tabular-nums">{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gold-500 transition-all duration-500"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
        </div>
      )}

      {!hydrated || !queue ? (
        <Card className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : queueFailed ? (
        <ErrorNote
          action={
            <Link href="/dashboard">
              <Button size="sm" variant="secondary">
                Back to today
              </Button>
            </Link>
          }
        >
          The recall questions didn&apos;t come back. Check your key in Settings, then
          open recall again.
        </ErrorNote>
      ) : queue.items.length === 0 ? (
        <EmptyState
          title="Nothing to recall yet"
          body="Recall pulls from what you've already studied. Finish a step or two and this fills up on its own."
          action={
            <Link href="/dashboard">
              <Button size="sm" variant="secondary">
                Back to today
              </Button>
            </Link>
          }
        />
      ) : ending || !item ? (
        <Card className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <p className="text-sm text-ink-soft">Putting your recap together…</p>
        </Card>
      ) : (
        <Card className="max-w-2xl space-y-4">
          {actionError && <ErrorNote>{actionError}</ErrorNote>}
          <RecallItemCard
            key={item.id}
            item={item}
            index={index}
            total={queue.items.length}
            result={result}
            submitting={submitting}
            onSubmit={handleSubmit}
            onNext={next}
            isLast={index === queue.items.length - 1}
          />
        </Card>
      )}
    </AppShell>
  );
}
