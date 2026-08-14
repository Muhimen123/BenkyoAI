/** POST /api/session — end-of-session recap. */
import { request } from "./client";
import type {
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
  return request<SessionEndPayload, SessionSummary>("/api/session", payload);
}
