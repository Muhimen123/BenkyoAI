/** POST /api/summarize — material in, summary out. */
import { request } from "./client";
import type { Summary } from "@/lib/types";

export interface SummarizePayload {
  materialIds: string[];
  text?: string;
  topic: string;
}

export async function summarizeMaterial(
  payload: SummarizePayload,
): Promise<Summary> {
  return request<SummarizePayload, Summary>("/api/summarize", payload);
}
