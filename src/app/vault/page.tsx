"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, FolderOpen, Layers, NotebookPen, Plus, Trash2 } from "lucide-react";
import { AppShell, PageHead } from "@/components/shell/AppShell";
import { Segmented } from "@/components/ui/Segmented";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Eyebrow, Skeleton } from "@/components/ui/Feedback";
import { RoadmapView } from "@/components/RoadmapView";
import { RoadmapControls } from "@/components/RoadmapControls";
import { MaterialInput } from "@/components/MaterialInput";
import { SummaryCard } from "@/components/SummaryCard";
import {
  useStudyStore,
  roadmapProgress,
  sessionsFor,
  summariesFor,
} from "@/store/useStudyStore";
import { formatDate, relativeTime } from "@/lib/utils";
import type { Session } from "@/lib/types";

type Tab = "roadmap" | "materials" | "sessions";

export default function VaultPage() {
  const hydrated = useStudyStore((s) => s.hydrated);
  const roadmap = useStudyStore((s) => s.roadmap);
  const roadmaps = useStudyStore((s) => s.roadmaps);
  const switchRoadmap = useStudyStore((s) => s.switchRoadmap);
  const deleteRoadmap = useStudyStore((s) => s.deleteRoadmap);
  const materials = useStudyStore((s) => s.materials);
  const allSessions = useStudyStore((s) => s.sessions);
  const allSummaries = useStudyStore((s) => s.summaries);
  const summary = useStudyStore((s) => s.summary);
  const [tab, setTab] = useState<Tab>("roadmap");

  // Scoped to the roadmap in view — the store keeps one flat list for all of them.
  const sessions = sessionsFor(allSessions, roadmap);
  const summaries = summariesFor(allSummaries, roadmap);

  const progress = roadmapProgress(roadmap);

  if (!hydrated || !roadmap) {
    return (
      <AppShell>
        <Skeleton className="h-9 w-52" />
        <Skeleton className="mt-6 h-72 w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHead
        eyebrow="Vault"
        title={roadmap.title}
        lede={`Everything you've added or generated, kept in this browser. ${progress.done} of ${progress.total} steps mastered · started ${formatDate(roadmap.createdAt)}.`}
      />

      <Segmented<Tab>
        ariaLabel="Vault section"
        className="mb-6"
        value={tab}
        onChange={setTab}
        options={[
          { value: "roadmap", label: "Roadmap" },
          { value: "materials", label: `Materials (${materials.length})` },
          { value: "sessions", label: `Sessions (${sessions.length})` },
        ]}
      />

      {tab === "roadmap" && (
        <div className="animate-fade space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-ink">
                Your roadmaps ({roadmaps.length})
              </h2>
              <Link
                href="/?new=1"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gold-700 underline decoration-gold-200 underline-offset-4 hover:decoration-gold-500"
              >
                <Plus className="size-3.5" />
                New roadmap
              </Link>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {roadmaps.map((r) => {
                const active = r.id === roadmap.id;
                const rProgress = roadmapProgress(r);
                return (
                  <li key={r.id} className="flex items-center gap-3 bg-surface p-3 sm:p-4">
                    <button
                      type="button"
                      onClick={() => switchRoadmap(r.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex items-center gap-2">
                        {active && <Check className="size-3.5 shrink-0 text-gold-600" />}
                        <span className="truncate text-sm font-medium text-ink">
                          {r.title}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[12px] text-ink-soft">
                        {rProgress.done} of {rProgress.total} steps mastered ·{" "}
                        {rProgress.mastery}%
                        {active ? " · in view" : ""}
                      </span>
                    </button>
                    {roadmaps.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Delete ${r.title}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${r.title}"? Its sessions and history go with it. This can't be undone.`,
                            )
                          )
                            deleteRoadmap(r.id);
                        }}
                        className="shrink-0 rounded-lg p-2 text-ink-faint transition-colors hover:bg-clay-50 hover:text-clay-700"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-ink-soft">
              Tap a topic to open its steps. Each step keeps its own practice and
              session history.
            </p>
            <RoadmapControls roadmap={roadmap} />
          </div>
          <RoadmapView roadmap={roadmap} />
        </div>
      )}

      {tab === "materials" && (
        <div className="animate-fade space-y-6">
          <MaterialInput />
          {summary && <SummaryCard summary={summary} />}
          {materials.length === 0 && (
            <EmptyState
              icon={<NotebookPen className="size-5" />}
              title="No material yet"
              body="Add slides, a PDF, or a photo of your notes and the roadmap gets rebuilt around what's actually in them."
            />
          )}
        </div>
      )}

      {tab === "sessions" && (
        <SessionHistory sessions={sessions} summarised={summaries.map((s) => s.sessionId)} />
      )}
    </AppShell>
  );
}

function SessionHistory({
  sessions,
  summarised,
}: {
  sessions: Session[];
  summarised: string[];
}) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        className="animate-fade"
        icon={<FolderOpen className="size-5" />}
        title="No sessions yet"
        body="Once you start a step, every session lands here under the subtopic it belongs to — not in one long log."
      />
    );
  }

  // Sessions hang off the tree: topic → subtopic → sessions.
  const grouped = new Map<string, Map<string, Session[]>>();
  sessions.forEach((session) => {
    const topic = session.topicTitle ?? "Active recall";
    const sub = session.subtopicTitle ?? "Across the vault";
    if (!grouped.has(topic)) grouped.set(topic, new Map());
    const subs = grouped.get(topic)!;
    subs.set(sub, [...(subs.get(sub) ?? []), session]);
  });

  return (
    <div className="animate-fade space-y-6">
      {[...grouped.entries()].map(([topic, subs]) => (
        <section key={topic} className="space-y-2">
          <Eyebrow className="flex items-center gap-1.5">
            <Layers className="size-3" />
            {topic}
          </Eyebrow>
          <Card inset={false} className="divide-y divide-line">
            {[...subs.entries()].map(([sub, list]) => (
              <div key={sub} className="px-4 py-3.5 sm:px-5">
                <p className="text-sm font-medium text-ink">{sub}</p>
                <ul className="mt-2 space-y-1.5">
                  {list.map((session) => (
                    <li
                      key={session.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1"
                    >
                      <span className="label-data text-ink-faint">
                        {relativeTime(session.startedAt)}
                      </span>
                      <Badge tone={session.mode === "recall" ? "review" : "neutral"}>
                        {session.mode}
                      </Badge>
                      <span className="text-[13px] text-ink-soft">
                        {session.endedAt ? "finished" : `${session.progress}% through`}
                      </span>
                      {summarised.includes(session.id) ? (
                        <Link
                          href={`/session/${session.id}`}
                          className="text-[13px] font-medium text-gold-700 underline decoration-gold-200 underline-offset-4 hover:decoration-gold-500"
                        >
                          Recap
                        </Link>
                      ) : session.subtopicId ? (
                        <Link
                          href={`/subtopic/${session.subtopicId}`}
                          className="text-[13px] font-medium text-gold-700 underline decoration-gold-200 underline-offset-4 hover:decoration-gold-500"
                        >
                          Resume
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}
