/**
 * POST /api/practice/set, /api/practice/answer, /api/practice/explanation
 * POST /api/chat — for getExplanation and reexplain
 */
import { request } from "./client";
import type {
  AnswerPayload,
  AnswerResult,
  ExplanationEvaluation,
  ExplanationPayload,
  ExplainMode,
  PracticeSet,
} from "@/lib/types";

export interface PracticeSetPayload {
  subtopicId: string;
  context?: {
    title: string;
    topicTitle: string;
    weakPoints?: { id: string; title: string }[];
  };
}

export async function getPracticeSet(
  payload: PracticeSetPayload,
): Promise<PracticeSet> {
  return request<PracticeSetPayload, PracticeSet>("/api/practice/set", payload);
}

export async function submitAnswer(
  payload: AnswerPayload,
): Promise<AnswerResult> {
  return request<AnswerPayload, AnswerResult>("/api/practice/answer", payload);
}

export async function evaluateExplanation(
  payload: ExplanationPayload,
): Promise<ExplanationEvaluation> {
  return request<ExplanationPayload, ExplanationEvaluation>(
    "/api/practice/explanation",
    payload,
  );
}

export async function reexplain(
  subtopicId: string,
  title: string,
  mode: ExplainMode,
): Promise<string> {
  return request<{ subtopicId: string; title: string; mode: ExplainMode }, string>(
    "/api/chat",
    { subtopicId, title, mode },
  );
}

export async function getExplanation(payload: {
  subtopicId: string;
  title: string;
  stub: string;
  depth: "brief" | "balanced" | "deep";
}): Promise<string[]> {
  return request<typeof payload, string[]>("/api/chat", payload);
}
