"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  MessageCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AppShell, PageHead } from "@/components/shell/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorNote, Eyebrow, Skeleton } from "@/components/ui/Feedback";
import { MasteryMeter } from "@/components/ui/MasteryMeter";
import { DepthControl } from "@/components/DepthControl";
import { ChatPanel } from "@/components/ChatPanel";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { ResultPanel } from "@/components/practice/ResultPanel";
import { ExplainBack } from "@/components/practice/ExplainBack";
import {
  getExplanation,
  getPracticeSet,
  reexplain,
  submitAnswer,
} from "@/lib/api/practice";
import { endSession } from "@/lib/api/session";
import { retrieve, type Source } from "@/lib/rag";
import { citedTags } from "@/lib/prompts";
import { findSubtopic, useStudyStore, weakPoints } from "@/store/useStudyStore";
import type {
  AnswerPayload,
  AnswerResult,
  MistakeType,
  PracticeSet,
} from "@/lib/types";

type Phase = "learn" | "practice" | "done";

export default function SubtopicPage() {
  const params = useParams<{ subtopicId: string }>();
  const router = useRouter();

  const hydrated = useStudyStore((s) => s.hydrated);
  const roadmap = useStudyStore((s) => s.roadmap);
  const depth = useStudyStore((s) => s.depth);
  const sessions = useStudyStore((s) => s.sessions);
  const startSession = useStudyStore((s) => s.startSession);
  const updateSession = useStudyStore((s) => s.updateSession);
  const finishSession = useStudyStore((s) => s.finishSession);
  const recordAnswer = useStudyStore((s) => s.recordAnswer);

  const found = findSubtopic(roadmap, params.subtopicId);
  const weak = weakPoints(roadmap).filter((w) => w.id !== params.subtopicId);

  const [phase, setPhase] = useState<Phase>("learn");
  const [paragraphs, setParagraphs] = useState<string[] | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [extra, setExtra] = useState<string[]>([]);
  const [rewriting, setRewriting] = useState(false);
  const [set, setSet] = useState<PracticeSet | null>(null);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answered, setAnswered] = useState<
    { subtopicId: string; correct: boolean; mistakeType?: MistakeType; wasWeakPoint?: boolean }[]
  >([]);
  const [ending, setEnding] = useState(false);
  const [showChat, setShowChat] = useState(false);
  /** Practice set failed to load — shown in place of the endless skeleton. */
  const [practiceError, setPracticeError] = useState<string | null>(null);
  /** A single action (answer, re-explain, recap) failed. */
  const [actionError, setActionError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Opening a step opens (or resumes) a session against it.
  useEffect(() => {
    if (!found) return;
    const session = startSession({
      subtopicId: found.subtopic.id,
      subtopicTitle: found.subtopic.title,
      topicTitle: found.topic.title,
      mode: "lesson",
    });
    setSessionId(session.id);
    // ?mode=recall arrives from the "does it still hold?" callback card.
    if (new URLSearchParams(window.location.search).get("mode") === "recall") {
      setPhase("practice");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found?.subtopic.id]);

  // Explanation follows the depth dial.
  useEffect(() => {
    if (!found) return;
    let alive = true;
    setParagraphs(null);
    setExtra([]);
    setSources([]);
    (async () => {
      // Ground the explanation in the learner's own material when it has any.
      const retrieved = await retrieve(`${found.subtopic.title}. ${found.subtopic.explanationStub}`);
      const p = await getExplanation({
        subtopicId: found.subtopic.id,
        title: found.subtopic.title,
        stub: found.subtopic.explanationStub,
        depth,
        sources: retrieved,
      });
      if (!alive) return;
      const cited = new Set(citedTags(p.join(" ")));
      setSources(retrieved.filter((s) => cited.has(s.tag)));
      setParagraphs(p);
    })().catch(() => alive && setParagraphs([found.subtopic.explanationStub]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found?.subtopic.id, depth]);

  const loadPractice = useCallback(async () => {
    if (!found || set) return;
    setPracticeError(null);
    try {
      const loaded = await getPracticeSet({
        subtopicId: found.subtopic.id,
        context: {
          title: found.subtopic.title,
          topicTitle: found.topic.title,
          weakPoints: weak.map((w) => ({ id: w.id, title: w.title })),
        },
      });
      setSet(loaded);
    } catch {
      setPracticeError("The practice questions didn't come back. Check your key in Settings, then try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found?.subtopic.id, set]);

  useEffect(() => {
    if (phase === "practice") loadPractice();
  }, [phase, loadPractice]);

  if (!hydrated || (found && roadmap && !sessionId)) {
    return (
      <AppShell>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-6 h-64 w-full" />
      </AppShell>
    );
  }

  if (!found || !roadmap || !sessionId) {
    return (
      <AppShell>
        <EmptyState
          title="That step isn't in your vault"
          body="It may have been removed when the roadmap was rebuilt."
          action={
            <Link href="/vault">
              <Button size="sm" variant="secondary">
                Back to vault
              </Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const { topic, subtopic } = found;
  const question = set?.questions[index];
  const isLast = set ? index === set.questions.length - 1 : false;

  async function handleRewrite(mode: "differently" | "simpler" | "deeper") {
    setRewriting(true);
    setActionError(null);
    try {
      const text = await reexplain(subtopic.id, subtopic.title, mode);
      setExtra((current) => [...current, text]);
    } catch {
      setActionError("That explanation didn't come back. Try again in a moment.");
    } finally {
      setRewriting(false);
    }
  }

  async function handleAnswer(payload: AnswerPayload) {
    setSubmitting(true);
    setActionError(null);
    try {
      const outcome = await submitAnswer(payload);
      setResult(outcome);
      recordAnswer({
        subtopicId: subtopic.id,
        delta: outcome.understandingDelta,
        mistakeType: outcome.mistakeType,
      });
      setAnswered((a) => [
        ...a,
        {
          subtopicId: subtopic.id,
          correct: outcome.correct,
          mistakeType: outcome.mistakeType,
          wasWeakPoint: subtopic.isWeakPoint,
        },
      ]);
      updateSession(sessionId!, {
        lastQuestionIndex: index,
        progress: set ? Math.round(((index + 1) / set.questions.length) * 100) : 0,
      });
    } catch {
      setActionError("Your answer couldn't be checked. Nothing was recorded — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    setResult(null);
    if (isLast) setPhase("done");
    else setIndex((i) => i + 1);
  }

  async function finish() {
    setEnding(true);
    setActionError(null);
    try {
      const session = sessions.find((s) => s.id === sessionId)!;
      const summary = await endSession({ session, roadmap: roadmap!, answered });
      finishSession(summary);
      router.push(`/session/${summary.sessionId}`);
    } catch {
      setEnding(false);
      setActionError("The recap couldn't be written. Try ending the session again.");
    }
  }

  return (
    <AppShell>
      <Link
        href={`/roadmap/${topic.id}`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        {topic.title}
      </Link>

      <PageHead
        eyebrow={`${topic.title} · about ${subtopic.estimatedMin} min`}
        title={subtopic.title}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageCircle className="size-4" />}
            onClick={() => setShowChat((v) => !v)}
            className="lg:hidden"
          >
            {showChat ? "Hide chat" : "Ask"}
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="min-w-0 space-y-6">
          {actionError && <ErrorNote>{actionError}</ErrorNote>}
          {subtopic.isWeakPoint && (
            <p className="flex items-center gap-2 rounded-lg border border-maize-100 bg-maize-50 px-3.5 py-2.5 text-[13px] text-maize-700">
              <Sparkles className="size-3.5 shrink-0" />
              This came back from an earlier mistake. It'll keep appearing until it
              holds.
            </p>
          )}

          {phase === "learn" && (
            <>
              <Card className="space-y-4">
                {!paragraphs ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...paragraphs, ...extra].map((paragraph, i) => (
                      <p
                        key={i}
                        className={
                          i === 0
                            ? "text-[16px] leading-relaxed text-ink-soft"
                            : "animate-fade text-[16px] leading-relaxed text-ink-soft"
                        }
                      >
                        {paragraph}
                      </p>
                    ))}
                    {sources.length > 0 && (
                      <div className="rounded-lg border border-line bg-sunk px-3.5 py-3">
                        <Eyebrow>From your material</Eyebrow>
                        <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-ink-soft">
                          {sources.map((s) => (
                            <li key={s.tag}>
                              <span className="font-medium text-ink">[{s.tag}]</span> {s.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={rewriting}
                    onClick={() => handleRewrite("simpler")}
                    icon={<Lightbulb className="size-3.5" />}
                  >
                    Explain more simply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={rewriting}
                    onClick={() => handleRewrite("differently")}
                  >
                    Explain differently
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={rewriting}
                    onClick={() => handleRewrite("deeper")}
                  >
                    Go deeper
                  </Button>
                </div>
              </Card>

              <Button
                size="lg"
                onClick={() => setPhase("practice")}
                icon={<ArrowRight className="size-4" />}
                full
              >
                Start practice
              </Button>
            </>
          )}

          {phase === "practice" && (
            <Card>
              {practiceError && !set ? (
                <ErrorNote
                  action={
                    <Button size="sm" variant="secondary" onClick={() => loadPractice()}>
                      Try again
                    </Button>
                  }
                >
                  {practiceError}
                </ErrorNote>
              ) : !set || !question ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : question.kind === "explain-back" ? (
                <ExplainBack
                  subtopicId={subtopic.id}
                  prompt={question.prompt}
                  onDone={(evaluation) => {
                    recordAnswer({
                      subtopicId: subtopic.id,
                      delta: evaluation.understandingDelta,
                      mistakeType:
                        evaluation.verdict === "pass" ? undefined : "misunderstanding",
                    });
                    setAnswered((a) => [
                      ...a,
                      {
                        subtopicId: subtopic.id,
                        correct: evaluation.verdict === "pass",
                        mistakeType:
                          evaluation.verdict === "pass" ? undefined : "misunderstanding",
                        wasWeakPoint: subtopic.isWeakPoint,
                      },
                    ]);
                    next();
                  }}
                />
              ) : (
                <div className="space-y-5">
                  <QuestionCard
                    question={question}
                    index={index}
                    total={set.questions.length}
                    submitting={submitting}
                    locked={Boolean(result)}
                    chosenOptionId={undefined}
                    correctOptionId={result?.correctOptionId}
                    onSubmit={handleAnswer}
                  />
                  {result && (
                    <ResultPanel
                      result={result}
                      isLast={isLast}
                      onNext={next}
                      onExplain={() => {
                        setShowChat(true);
                        handleRewrite("differently");
                      }}
                    />
                  )}
                </div>
              )}
            </Card>
          )}

          {phase === "done" && (
            <Card tone="accent" className="space-y-5">
              <div>
                <Eyebrow className="text-gold-700">Practice complete</Eyebrow>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-[34px] leading-none font-semibold tracking-tight text-ink tabular-nums">
                    {subtopic.mastery}%
                  </span>
                  <span className="text-sm text-ink-soft">mastered</span>
                </p>
                <MasteryMeter
                  value={subtopic.mastery}
                  status={subtopic.status}
                  className="mt-3"
                />
              </div>

              <p className="text-sm leading-relaxed text-ink-soft">
                {subtopic.mastery >= 80
                  ? "Solid. Move on — this one will come back on its own in recall."
                  : subtopic.mastery >= 50
                    ? "Most of it is there. One more pass would make it stick."
                    : "Worth another look at the explanation before moving on."}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button onClick={finish} loading={ending}>
                  End session and see recap
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSet(null);
                    setIndex(0);
                    setResult(null);
                    setPhase("practice");
                  }}
                  icon={<RotateCcw className="size-4" />}
                >
                  Practise again
                </Button>
                <Button variant="ghost" onClick={() => setPhase("learn")}>
                  Re-read the explanation
                </Button>
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>This step</Eyebrow>
              <Badge tone={subtopic.status === "mastered" ? "sage" : "neutral"}>
                {subtopic.status.replace("-", " ")}
              </Badge>
            </div>
            <MasteryMeter value={subtopic.mastery} status={subtopic.status} showValue />
            <div className="border-t border-line pt-4">
              <DepthControl />
            </div>
          </Card>

          <div className={showChat ? "block" : "hidden lg:block"}>
            <ChatPanel
              sessionId={sessionId}
              roadmapTitle={roadmap.title}
              subtopicTitle={subtopic.title}
              className="h-[420px]"
            />
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
