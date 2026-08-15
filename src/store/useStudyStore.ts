"use client";

/**
 * The Vault: everything BenkyoAI knows, held in this browser.
 * No accounts, no sync, no server-side record.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { VAULT_STORAGE_KEY, maskKey } from "@/lib/byokVault";
import { clamp, uid } from "@/lib/utils";
import type {
  ChatMessage,
  Depth,
  KeyConnection,
  Material,
  MistakeType,
  ProviderId,
  Purpose,
  Roadmap,
  Session,
  SessionSummary,
  Subtopic,
  Summary,
  Topic,
} from "@/lib/types";

export interface OnboardingDraft {
  topic: string;
  purpose: Purpose | null;
  deadline?: string;
  calibration: { questionId: string; optionId: string }[];
}

interface StudyState {
  /** Raw key — sent with requests, never rendered. */
  apiKey: string | null;
  connection: KeyConnection | null;
  /** All saved roadmaps — you can hold several at once. */
  roadmaps: Roadmap[];
  /** The one currently in view; kept in sync with its entry in `roadmaps`. */
  roadmap: Roadmap | null;
  materials: Material[];
  summary: Summary | null;
  sessions: Session[];
  summaries: SessionSummary[];
  chats: Record<string, ChatMessage[]>;
  depth: Depth;
  examNight: boolean;
  draft: OnboardingDraft;
  hydrated: boolean;

  connectKey: (provider: ProviderId, apiKey: string) => void;
  disconnectKey: () => void;
  flagKeyInvalid: () => void;

  setDepth: (depth: Depth) => void;
  setExamNight: (on: boolean) => void;

  addMaterial: (material: Omit<Material, "id" | "addedAt" | "status">) => Material;
  removeMaterial: (id: string) => void;
  setSummary: (summary: Summary | null) => void;

  setDraft: (patch: Partial<OnboardingDraft>) => void;
  /** Adds a new roadmap (or updates one that already exists) and makes it active. */
  setRoadmap: (roadmap: Roadmap) => void;
  /** Switches the active roadmap without touching any of the saved ones. */
  switchRoadmap: (id: string) => void;
  /** Removes a saved roadmap. If it was active, another one (or none) takes over. */
  deleteRoadmap: (id: string) => void;
  addTopic: (topic: Topic) => void;
  setPromptOverride: (prompt: string) => void;

  recordAnswer: (input: {
    subtopicId: string;
    delta: number;
    mistakeType?: MistakeType;
  }) => void;

  startSession: (input: {
    subtopicId?: string;
    subtopicTitle?: string;
    topicTitle?: string;
    mode: Session["mode"];
  }) => Session;
  updateSession: (id: string, patch: Partial<Session>) => void;
  finishSession: (summary: SessionSummary) => void;
  appendChat: (sessionId: string, message: ChatMessage) => void;
  replaceChat: (sessionId: string, messages: ChatMessage[]) => void;

  resetVault: () => void;
}

const emptyDraft: OnboardingDraft = {
  topic: "",
  purpose: null,
  deadline: undefined,
  calibration: [],
};

function rollUp(topic: Topic): Topic {
  const mastery = topic.subtopics.length
    ? Math.round(
        topic.subtopics.reduce((sum, s) => sum + s.mastery, 0) /
          topic.subtopics.length,
      )
    : 0;
  const status = topic.subtopics.every((s) => s.status === "mastered")
    ? "mastered"
    : topic.subtopics.some((s) => s.status !== "not-started")
      ? "in-progress"
      : "not-started";
  return { ...topic, mastery, status };
}

function statusFor(mastery: number, touched: boolean): Subtopic["status"] {
  if (mastery >= 80) return "mastered";
  if (mastery > 0 || touched) return "in-progress";
  return "not-started";
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      connection: null,
      roadmaps: [],
      roadmap: null,
      materials: [],
      summary: null,
      sessions: [],
      summaries: [],
      chats: {},
      depth: "balanced",
      examNight: false,
      draft: emptyDraft,
      hydrated: false,

      connectKey: (provider, apiKey) =>
        set({
          apiKey,
          connection: {
            provider,
            keyTail: maskKey(apiKey),
            connectedAt: new Date().toISOString(),
            lastCheckedAt: new Date().toISOString(),
            status: "connected",
          },
        }),

      disconnectKey: () => set({ apiKey: null, connection: null }),

      flagKeyInvalid: () =>
        set((s) =>
          s.connection
            ? {
                connection: {
                  ...s.connection,
                  status: "invalid",
                  lastCheckedAt: new Date().toISOString(),
                },
              }
            : {},
        ),

      setDepth: (depth) => set({ depth }),
      setExamNight: (examNight) => set({ examNight }),

      addMaterial: (material) => {
        const created: Material = {
          ...material,
          id: uid("mat"),
          addedAt: new Date().toISOString(),
          status: "ready",
        };
        set((s) => ({ materials: [created, ...s.materials] }));
        return created;
      },

      removeMaterial: (id) =>
        set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),

      setSummary: (summary) => set({ summary }),

      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

      setRoadmap: (roadmap) =>
        set((s) => ({
          roadmap,
          roadmaps: s.roadmaps.some((r) => r.id === roadmap.id)
            ? s.roadmaps.map((r) => (r.id === roadmap.id ? roadmap : r))
            : [roadmap, ...s.roadmaps],
        })),

      switchRoadmap: (id) =>
        set((s) => {
          const found = s.roadmaps.find((r) => r.id === id);
          return found ? { roadmap: found } : {};
        }),

      deleteRoadmap: (id) =>
        set((s) => {
          const roadmaps = s.roadmaps.filter((r) => r.id !== id);
          const roadmap =
            s.roadmap?.id === id ? (roadmaps[0] ?? null) : s.roadmap;
          // Drop the sessions, summaries and transcripts that belonged to it,
          // so a deleted roadmap doesn't leave history behind.
          const dropped = new Set(
            s.sessions.filter((x) => x.roadmapId === id).map((x) => x.id),
          );
          const chats = Object.fromEntries(
            Object.entries(s.chats).filter(([sessionId]) => !dropped.has(sessionId)),
          );
          return {
            roadmaps,
            roadmap,
            sessions: s.sessions.filter((x) => x.roadmapId !== id),
            summaries: s.summaries.filter((x) => x.roadmapId !== id),
            chats,
          };
        }),

      addTopic: (topic) =>
        set((s) => {
          if (!s.roadmap) return {};
          const roadmap = {
            ...s.roadmap,
            updatedAt: new Date().toISOString(),
            topics: [
              ...s.roadmap.topics,
              { ...topic, order: s.roadmap.topics.length },
            ],
          };
          return {
            roadmap,
            roadmaps: s.roadmaps.map((r) => (r.id === roadmap.id ? roadmap : r)),
          };
        }),

      setPromptOverride: (promptOverride) =>
        set((s) => {
          if (!s.roadmap) return {};
          const roadmap = { ...s.roadmap, promptOverride };
          return {
            roadmap,
            roadmaps: s.roadmaps.map((r) => (r.id === roadmap.id ? roadmap : r)),
          };
        }),

      recordAnswer: ({ subtopicId, delta, mistakeType }) =>
        set((s) => {
          if (!s.roadmap) return {};
          let touchedTitle = "";
          const topics = s.roadmap.topics.map((topic) => {
            if (!topic.subtopics.some((sub) => sub.id === subtopicId)) return topic;
            const subtopics = topic.subtopics.map((sub) => {
              if (sub.id !== subtopicId) return sub;
              touchedTitle = sub.title;
              const mastery = clamp(sub.mastery + delta);
              return {
                ...sub,
                mastery,
                status: statusFor(mastery, true),
                // A misunderstanding or missing concept marks this for inline review.
                isWeakPoint:
                  mistakeType === "careless"
                    ? sub.isWeakPoint
                    : mistakeType
                      ? true
                      : mastery >= 80
                        ? false
                        : sub.isWeakPoint,
              };
            });
            return rollUp({ ...topic, subtopics });
          });

          const adjusted = mistakeType === "missing-concept";
          const roadmap = {
            ...s.roadmap,
            topics,
            updatedAt: new Date().toISOString(),
            lastAdjustment: adjusted
              ? {
                  at: new Date().toISOString(),
                  reason: `An earlier step was folded back in after ${touchedTitle.toLowerCase()}.`,
                  affectedSubtopicIds: [subtopicId],
                }
              : s.roadmap.lastAdjustment,
          };
          return {
            roadmap,
            roadmaps: s.roadmaps.map((r) => (r.id === roadmap.id ? roadmap : r)),
          };
        }),

      startSession: ({ subtopicId, subtopicTitle, topicTitle, mode }) => {
        const state = get();
        const roadmapId = state.roadmap?.id ?? "";
        // Scoped to this roadmap: a recall session carries no subtopic, so
        // without the roadmap check it would match an open one from another.
        const existing = state.sessions.find(
          (s) =>
            !s.endedAt &&
            s.roadmapId === roadmapId &&
            s.subtopicId === subtopicId &&
            s.mode === mode,
        );
        if (existing) return existing;
        const session: Session = {
          id: uid("ses"),
          roadmapId,
          subtopicId,
          subtopicTitle,
          topicTitle,
          mode,
          startedAt: new Date().toISOString(),
          progress: 0,
          lastQuestionIndex: 0,
        };
        set((s) => ({ sessions: [session, ...s.sessions] }));
        return session;
      },

      updateSession: (id, patch) =>
        set((s) => ({
          sessions: s.sessions.map((session) =>
            session.id === id ? { ...session, ...patch } : session,
          ),
        })),

      finishSession: (summary) =>
        set((s) => {
          const roadmap = s.roadmap
            ? {
                ...s.roadmap,
                topics: s.roadmap.topics.map((topic) => ({
                  ...topic,
                  subtopics: topic.subtopics.map((sub) =>
                    summary.covered.some((c) => c.subtopicId === sub.id)
                      ? { ...sub, sessionIds: [...new Set([...sub.sessionIds, summary.sessionId])] }
                      : sub,
                  ),
                })),
              }
            : s.roadmap;
          return {
            roadmap,
            roadmaps: roadmap
              ? s.roadmaps.map((r) => (r.id === roadmap.id ? roadmap : r))
              : s.roadmaps,
            summaries: [summary, ...s.summaries.filter((x) => x.sessionId !== summary.sessionId)],
            sessions: s.sessions.map((session) =>
              session.id === summary.sessionId
                ? { ...session, endedAt: summary.endedAt, progress: 100 }
                : session,
            ),
          };
        }),

      appendChat: (sessionId, message) =>
        set((s) => ({
          chats: { ...s.chats, [sessionId]: [...(s.chats[sessionId] ?? []), message] },
        })),

      replaceChat: (sessionId, messages) =>
        set((s) => ({ chats: { ...s.chats, [sessionId]: messages } })),

      resetVault: () =>
        set({
          roadmaps: [],
          roadmap: null,
          materials: [],
          summary: null,
          sessions: [],
          summaries: [],
          chats: {},
          draft: emptyDraft,
          examNight: false,
        }),
    }),
    {
      name: VAULT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      partialize: ({ hydrated, ...rest }) => rest,
    },
  ),
);

// Vaults saved before multiple roadmaps existed hold a single `roadmap` and no
// list. Seed the list from it so those roadmaps don't vanish from the switcher.
function backfillRoadmaps() {
  const { roadmap, roadmaps } = useStudyStore.getState();
  if (roadmap && !roadmaps.some((r) => r.id === roadmap.id)) {
    useStudyStore.setState({ roadmaps: [roadmap, ...roadmaps] });
  }
}

// `hydrated` sits outside the persisted slice so the first client render can
// tell "no roadmap yet" apart from "storage hasn't loaded yet".
useStudyStore.persist.onFinishHydration(() => {
  backfillRoadmaps();
  useStudyStore.setState({ hydrated: true });
});
if (useStudyStore.persist.hasHydrated()) {
  backfillRoadmaps();
  useStudyStore.setState({ hydrated: true });
}

/* --------------------------------------------------------------- selectors */

export function findSubtopic(roadmap: Roadmap | null, subtopicId: string) {
  if (!roadmap) return null;
  for (const topic of roadmap.topics) {
    const sub = topic.subtopics.find((s) => s.id === subtopicId);
    if (sub) return { topic, subtopic: sub };
  }
  return null;
}

export function nextSubtopic(roadmap: Roadmap | null) {
  if (!roadmap) return null;
  for (const topic of roadmap.topics) {
    const sub =
      topic.subtopics.find((s) => s.status === "in-progress") ??
      topic.subtopics.find((s) => s.status === "not-started");
    if (sub) return { topic, subtopic: sub };
  }
  return null;
}

export function weakPoints(roadmap: Roadmap | null) {
  if (!roadmap) return [];
  return roadmap.topics.flatMap((t) =>
    t.subtopics
      .filter((s) => s.isWeakPoint)
      .map((s) => ({ id: s.id, title: s.title, topicTitle: t.title })),
  );
}

export function roadmapProgress(roadmap: Roadmap | null) {
  if (!roadmap || !roadmap.topics.length) return { mastery: 0, done: 0, total: 0 };
  const subs = roadmap.topics.flatMap((t) => t.subtopics);
  return {
    mastery: Math.round(subs.reduce((sum, s) => sum + s.mastery, 0) / subs.length),
    done: subs.filter((s) => s.status === "mastered").length,
    total: subs.length,
  };
}

export function activeSession(sessions: Session[]) {
  return sessions.find((s) => !s.endedAt) ?? null;
}

/**
 * Sessions and summaries are stored in one flat list across every roadmap, so
 * anything shown against "the current roadmap" has to be narrowed first —
 * otherwise switching roadmaps surfaces another one's history.
 */
export function sessionsFor(sessions: Session[], roadmap: Roadmap | null) {
  if (!roadmap) return [];
  return sessions.filter((s) => s.roadmapId === roadmap.id);
}

export function summariesFor(summaries: SessionSummary[], roadmap: Roadmap | null) {
  if (!roadmap) return [];
  return summaries.filter((s) => s.roadmapId === roadmap.id);
}

export type { StudyState };
