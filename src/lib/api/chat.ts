/** POST /api/chat — the study-helper conversation. */
import { request } from "./client";
import type { ChatMessage } from "@/lib/types";
import type { Source } from "@/lib/rag";

export interface ChatPayload {
  messages: { role: "user" | "assistant"; content: string }[];
  context: { roadmapTitle: string; subtopicTitle?: string; depth: string };
  /** Passages retrieved from the learner's own material. */
  sources?: Source[];
}

export async function sendChatMessage(payload: ChatPayload): Promise<ChatMessage> {
  return request<ChatPayload, ChatMessage>("/api/chat", payload);
}
