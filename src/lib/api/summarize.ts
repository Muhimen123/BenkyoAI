/** POST /api/summarize — material in, summary out. */
import { request } from "./client";
import { uid } from "@/lib/utils";
import type { Summary } from "@/lib/types";

export interface SummarizePayload {
  materialIds: string[];
  /** Pasted text, when the user typed rather than uploaded. */
  text?: string;
  topic: string;
}

export async function summarizeMaterial(
  payload: SummarizePayload,
): Promise<Summary> {
  return request<SummarizePayload, Summary>(
    "/api/summarize",
    payload,
    ({ materialIds, topic }) => ({
      id: uid("sum"),
      title: `What your material covers on ${topic}`,
      materialIds,
      keyPoints: [
        "The material front-loads definitions and leaves the reasoning to worked examples.",
        "Two sections carry most of the weight — the rest is application of those two.",
        "There's a gap between what the notes assume and where you said you're starting.",
        "Nothing here covers the last section of the roadmap, so that will come from elsewhere.",
      ],
      readingTimeMin: 6 + materialIds.length * 2,
      generatedAt: new Date().toISOString(),
    }),
    { latency: 1200 },
  );
}
