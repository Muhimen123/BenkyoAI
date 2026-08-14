/** POST /api/recall — builds the recall queue. POST /api/recall/answer — grades a recall answer. */
import { request } from "./client";
import type {
  AnswerPayload,
  AnswerResult,
  RecallQueue,
  RecallRequest,
} from "@/lib/types";

export async function getRecallQueue(
  payload: RecallRequest,
): Promise<RecallQueue> {
  return request<RecallRequest, RecallQueue>("/api/recall", payload);
}

export async function submitRecallAnswer(
  payload: AnswerPayload,
): Promise<AnswerResult> {
  return request<AnswerPayload, AnswerResult>("/api/recall/answer", payload);
}
