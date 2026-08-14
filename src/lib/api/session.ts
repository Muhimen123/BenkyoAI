/**
 * POST /api/session — end-of-session recap, and the record the next session
 * opens from.
 */
import { request } from "./client";
import { uid } from "@/lib/utils";
import type {
  GrowthCallout,
  MistakeType,
  Roadmap,
  Session,
  SessionSummary,
} from "@/lib/types";

export interface SessionEndPayload {
  session: Session;
  roadmap: Roadmap;
  answered: {
    subtopicId: string;
    correct: boolean;
    mistakeType?: MistakeType;
    wasWeakPoint?: boolean;
  }[];
}

export async function endSession(
  payload: SessionEndPayload,
): Promise<SessionSummary> {
  return request<SessionEndPayload, SessionSummary>(
    "/api/session",
    payload,
    ({ session, roadmap, answered }) => {
      const lookup = new Map(
        roadmap.topics.flatMap((t) =>
          t.subtopics.map((s) => [s.id, { title: s.title, mastery: s.mastery }]),
        ),
      );
      const seen = [...new Set(answered.map((a) => a.subtopicId))];
      const endedAt = new Date().toISOString();
      const durationMin = Math.max(
        1,
        Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000),
      );

      const struggled = answered
        .filter((a) => !a.correct)
        .map((a) => ({
          subtopicId: a.subtopicId,
          title: lookup.get(a.subtopicId)?.title ?? "Untitled",
          mistakeType: a.mistakeType ?? ("misunderstanding" as MistakeType),
        }));

      const understood = seen
        .filter((id) => answered.filter((a) => a.subtopicId === id).every((a) => a.correct))
        .map((id) => ({
          subtopicId: id,
          title: lookup.get(id)?.title ?? "Untitled",
          mastery: lookup.get(id)?.mastery ?? 0,
        }));

      const growth: GrowthCallout[] = answered
        .filter((a) => a.correct && a.wasWeakPoint)
        .map((a) => ({
          id: uid("gc"),
          title: lookup.get(a.subtopicId)?.title ?? "Untitled",
          detail: "You missed this last time. This time you got it with no hint.",
          previousMistakeType: "misunderstanding" as MistakeType,
        }));

      const nextSub = roadmap.topics
        .flatMap((t) => t.subtopics)
        .find((s) => s.status === "not-started");

      return {
        sessionId: session.id,
        roadmapId: roadmap.id,
        startedAt: session.startedAt,
        endedAt,
        durationMin,
        covered: seen.map((id) => ({
          subtopicId: id,
          title: lookup.get(id)?.title ?? "Untitled",
        })),
        struggled,
        understood,
        growth,
        nextUp: nextSub
          ? {
              subtopicId: nextSub.id,
              title: nextSub.title,
              reason: struggled.length
                ? "Comes with a short refresher on what tripped you up today."
                : "Next step on the roadmap.",
            }
          : undefined,
        carryOver: struggled[0]
          ? {
              subtopicId: struggled[0].subtopicId,
              question: `Last time ${struggled[0].title.toLowerCase()} didn't hold. Does it now?`,
            }
          : undefined,
      };
    },
    { latency: 900 },
  );
}
