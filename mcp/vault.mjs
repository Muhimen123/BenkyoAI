/**
 * Read-only views over an exported BenkyoAI vault.
 *
 * The vault is the JSON the app's Settings page exports (the same shape it
 * keeps in localStorage, minus the API key). Everything here is a pure
 * function of that JSON, so the MCP server never needs network access or a key.
 */
import { readFile } from "node:fs/promises";

export async function loadVault(path) {
  const raw = JSON.parse(await readFile(path, "utf8"));
  // Accept both the export file and a raw localStorage dump ({ state, version }).
  const state = raw.state ?? raw;
  return {
    roadmaps: state.roadmaps?.length ? state.roadmaps : state.roadmap ? [state.roadmap] : [],
    activeRoadmapId: state.roadmap?.id ?? null,
    sessions: state.sessions ?? [],
    summaries: state.summaries ?? [],
    usage: state.usage ?? [],
  };
}

/** Finds a roadmap by id or (case-insensitive) title; defaults to the active one. */
export function pickRoadmap(vault, query) {
  const { roadmaps, activeRoadmapId } = vault;
  if (!roadmaps.length) throw new Error("The vault has no roadmaps yet.");
  if (!query) return roadmaps.find((r) => r.id === activeRoadmapId) ?? roadmaps[0];
  const q = query.trim().toLowerCase();
  const found =
    roadmaps.find((r) => r.id === query) ??
    roadmaps.find((r) => r.title.toLowerCase() === q) ??
    roadmaps.find((r) => r.title.toLowerCase().includes(q));
  if (!found) {
    throw new Error(
      `No roadmap matches "${query}". Available: ${roadmaps.map((r) => r.title).join(", ")}`,
    );
  }
  return found;
}

function subtopics(roadmap) {
  return roadmap.topics.flatMap((t) => t.subtopics.map((s) => ({ ...s, topicTitle: t.title })));
}

function titleIndex(roadmap) {
  return new Map(subtopics(roadmap).map((s) => [s.id, s.title]));
}

export function listRoadmaps(vault) {
  return vault.roadmaps.map((r) => {
    const subs = subtopics(r);
    return {
      id: r.id,
      title: r.title,
      purpose: r.purpose,
      deadline: r.deadline ?? null,
      active: r.id === vault.activeRoadmapId,
      mastery: subs.length ? Math.round(subs.reduce((n, s) => n + s.mastery, 0) / subs.length) : 0,
      mastered: subs.filter((s) => s.status === "mastered").length,
      total: subs.length,
    };
  });
}

export function roadmapOutline(roadmap) {
  const titles = titleIndex(roadmap);
  return {
    id: roadmap.id,
    title: roadmap.title,
    purpose: roadmap.purpose,
    deadline: roadmap.deadline ?? null,
    lastAdjustment: roadmap.lastAdjustment?.reason ?? null,
    topics: roadmap.topics.map((t) => ({
      title: t.title,
      summary: t.summary,
      milestone: t.isMilestone,
      mastery: t.mastery,
      subtopics: t.subtopics.map((s) => ({
        id: s.id,
        title: s.title,
        coreIdea: s.explanationStub,
        mastery: s.mastery,
        status: s.status,
        weakPoint: s.isWeakPoint,
        buildsOn: (s.prerequisiteIds ?? []).map((id) => titles.get(id)).filter(Boolean),
        nextReview: s.review?.due ?? null,
      })),
    })),
  };
}

export function weakPoints(roadmap) {
  const titles = titleIndex(roadmap);
  return subtopics(roadmap)
    .filter((s) => s.isWeakPoint)
    .map((s) => ({
      id: s.id,
      title: s.title,
      topic: s.topicTitle,
      mastery: s.mastery,
      coreIdea: s.explanationStub,
      foundations: (s.prerequisiteIds ?? []).map((id) => titles.get(id)).filter(Boolean),
    }));
}

export function dueReviews(roadmap, now = new Date()) {
  return subtopics(roadmap)
    .filter((s) => s.review && new Date(s.review.due) <= now)
    .sort((a, b) => new Date(a.review.due) - new Date(b.review.due))
    .map((s) => ({
      id: s.id,
      title: s.title,
      topic: s.topicTitle,
      dueSince: s.review.due,
      lapses: s.review.lapses ?? 0,
      mastery: s.mastery,
    }));
}

export function sessionHistory(vault, roadmap, limit = 5) {
  return vault.summaries
    .filter((s) => s.roadmapId === roadmap.id)
    .slice(0, limit)
    .map((s) => ({
      endedAt: s.endedAt,
      minutes: s.durationMin,
      covered: s.covered.map((c) => c.title),
      struggled: s.struggled.map((x) => `${x.title} (${x.mistakeType})`),
      understood: s.understood.map((x) => x.title),
      carryOverQuestion: s.carryOver?.question ?? null,
      nextUp: s.nextUp ? `${s.nextUp.title}: ${s.nextUp.reason}` : null,
    }));
}

/**
 * The same priority the app uses: shaky foundations first, then whatever FSRS
 * says is about to be forgotten, then the next new step on the roadmap.
 */
export function studyPlan(vault, roadmap, now = new Date()) {
  const weak = weakPoints(roadmap);
  const due = dueReviews(roadmap, now).filter((d) => !weak.some((w) => w.id === d.id));
  const next = subtopics(roadmap).find((s) => s.status === "in-progress") ??
    subtopics(roadmap).find((s) => s.status === "not-started");
  const last = vault.summaries.find((s) => s.roadmapId === roadmap.id);
  return {
    openWith: last?.carryOver?.question ?? null,
    repairFirst: weak.map((w) => ({
      title: w.title,
      why: w.foundations.length
        ? `Weak point; check the foundation first: ${w.foundations.join(", ")}`
        : "Weak point from an earlier mistake",
    })),
    reviewNow: due.map((d) => ({ title: d.title, why: `FSRS review due since ${d.dueSince}` })),
    thenLearn: next ? { title: next.title, topic: next.topicTitle, minutes: next.estimatedMin } : null,
  };
}

export function usageSummary(vault) {
  const byModel = {};
  for (const u of vault.usage) {
    const m = (byModel[u.model] ??= { calls: 0, inputTokens: 0, outputTokens: 0 });
    m.calls++;
    m.inputTokens += u.inputTokens;
    m.outputTokens += u.outputTokens;
  }
  return { calls: vault.usage.length, byModel };
}
