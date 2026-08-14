/**
 * POST /api/recall — builds the recall queue for a mode + scope.
 * Items are drawn from prior weak points and unresolved material in the roadmap
 * the caller passes in, so nothing here invents topics the Vault doesn't hold.
 */
import { request } from "./client";
import { hash, uid } from "@/lib/utils";
import type {
  AnswerPayload,
  AnswerResult,
  RecallItem,
  RecallQueue,
  RecallRequest,
  Subtopic,
} from "@/lib/types";

const recallKey = new Map<string, string>();

const REASON_ORDER = ["previous-mistake", "unresolved", "spaced-review"] as const;

function itemFor(sub: Subtopic, topicTitle: string, index: number): RecallItem {
  const reason = sub.isWeakPoint
    ? "previous-mistake"
    : sub.status === "in-progress"
      ? "unresolved"
      : "spaced-review";
  const id = uid("rc");
  const asMcq = hash(sub.id + index) % 3 !== 0;
  if (!asMcq) {
    return {
      id,
      prompt: `Without looking: what does ${sub.title.toLowerCase()} let you do, and when does it stop working?`,
      sourceSubtopicId: sub.id,
      sourceLabel: `${topicTitle} · ${sub.title}`,
      reason,
      kind: "short",
    };
  }
  const correctId = uid("o");
  recallKey.set(id, correctId);
  const options = [
    { id: correctId, label: "The account that names the underlying reason." },
    { id: uid("o"), label: "The account that only restates the definition." },
    { id: uid("o"), label: "The account that describes a related but different idea." },
  ];
  const offset = hash(id) % options.length;
  return {
    id,
    prompt: `${sub.title} — which description is accurate?`,
    sourceSubtopicId: sub.id,
    sourceLabel: `${topicTitle} · ${sub.title}`,
    reason,
    kind: "mcq",
    options: [...options.slice(offset), ...options.slice(0, offset)],
  };
}

export async function getRecallQueue(
  payload: RecallRequest,
): Promise<RecallQueue> {
  return request<RecallRequest, RecallQueue>(
    "/api/recall",
    payload,
    ({ mode, scope, roadmap }) => {
      const pairs = roadmap.topics.flatMap((t) =>
        t.subtopics.map((s) => ({ sub: s, topicTitle: t.title, topicId: t.id })),
      );
      const touched = pairs.filter((p) => p.sub.status !== "not-started");

      let selected = touched;
      let scopeLabel = "Everything in your vault";

      if (mode === "milestone-wise") {
        const milestoneIndex = roadmap.topics.findIndex((t) => t.id === scope);
        const cutoff = milestoneIndex === -1 ? roadmap.topics.length : milestoneIndex + 1;
        const ids = new Set(roadmap.topics.slice(0, cutoff).map((t) => t.id));
        selected = touched.filter((p) => ids.has(p.topicId));
        scopeLabel = `Up to ${roadmap.topics[Math.max(0, cutoff - 1)]?.title ?? "your first milestone"}`;
      } else if (mode === "session-wise") {
        selected = touched
          .filter((p) => p.sub.isWeakPoint || p.sub.status === "in-progress")
          .slice(0, 6);
        scopeLabel = "Your last session, plus what was left unresolved";
      }

      const ordered = [...selected].sort(
        (a, b) =>
          REASON_ORDER.indexOf(a.sub.isWeakPoint ? "previous-mistake" : "spaced-review") -
          REASON_ORDER.indexOf(b.sub.isWeakPoint ? "previous-mistake" : "spaced-review"),
      );

      const limit = mode === "exam-night" ? 12 : 6;
      const items = ordered
        .slice(0, limit)
        .map((p, i) => itemFor(p.sub, p.topicTitle, i));

      return {
        mode,
        scopeLabel,
        items,
        vaultCoverage: { covered: items.length, total: pairs.length },
      };
    },
    { latency: 800 },
  );
}

export async function submitRecallAnswer(
  payload: AnswerPayload,
): Promise<AnswerResult> {
  return request<AnswerPayload, AnswerResult>(
    "/api/recall/answer",
    payload,
    (body) => {
      if (!body.optionId) {
        const strong = (body.text ?? "").trim().split(/\s+/).length >= 10;
        return {
          questionId: body.questionId,
          correct: strong,
          understandingDelta: strong ? 8 : 1,
          mistakeType: strong ? undefined : "misunderstanding",
          feedback: strong
            ? "That came back intact."
            : "Thin recall. This one goes back in the queue for tonight.",
          suggestedAction: strong ? "move-on" : "review",
        };
      }
      const correct = recallKey.get(body.questionId) === body.optionId;
      return {
        questionId: body.questionId,
        correct,
        understandingDelta: correct ? 10 : -5,
        mistakeType: correct ? undefined : body.elapsedSec < 6 ? "careless" : "misunderstanding",
        feedback: correct
          ? "Held up without a prompt."
          : "Not there yet — this one stays in rotation.",
        correctOptionId: recallKey.get(body.questionId),
        suggestedAction: correct ? "move-on" : "review",
      };
    },
    { latency: 500 },
  );
}
