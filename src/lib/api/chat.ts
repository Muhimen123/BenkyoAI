/** POST /api/chat — the study-helper conversation. */
import { request } from "./client";
import { hash } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export interface ChatPayload {
  messages: { role: "user" | "assistant"; content: string }[];
  context: { roadmapTitle: string; subtopicTitle?: string; depth: string };
}

const SHAPES = [
  (q: string, c: string) =>
    `Short answer first: the thing that decides it is the condition, not the pattern.\n\nOn ${c}: when you asked "${q}", the useful move is to name what would have to be true for the answer to change. If nothing would change it, you're looking at a definition. If something would, you're looking at a rule with a boundary — and that boundary is what gets tested.`,
  (q: string, c: string) =>
    `Try it as a two-step. First, what's given. Second, which single fact about ${c.toLowerCase()} turns what's given into what's asked.\n\nMost of the difficulty in "${q}" is that step two feels like it should be one leap. It isn't — it's a small chain, and writing the chain down is faster than holding it in your head.`,
  (_q: string, c: string) =>
    `Here's the version I'd use with someone seeing ${c.toLowerCase()} for the first time.\n\nStart from a case where it obviously works. Change one thing until it stops working. Whatever you changed is what the idea is really about — everything else is scenery.`,
];

export async function sendChatMessage(payload: ChatPayload): Promise<ChatMessage> {
  return request<ChatPayload, ChatMessage>(
    "/api/chat",
    payload,
    (body) => {
      const last = body.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
      const context = body.context.subtopicTitle ?? body.context.roadmapTitle;
      const shape = SHAPES[hash(last) % SHAPES.length];
      const base = shape(last.slice(0, 60), context);
      const content =
        body.context.depth === "brief"
          ? base.split("\n\n")[0]
          : body.context.depth === "deep"
            ? `${base}\n\nOne level down: this is the same structure as the earlier step in your roadmap — if that one felt shaky, it's worth re-opening, because this rests on it.`
            : base;
      return {
        id: `m_${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      };
    },
    { latency: 750 },
  );
}
