"use client";

import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendChatMessage } from "@/lib/api/chat";
import { retrieve } from "@/lib/rag";
import { useStudyStore } from "@/store/useStudyStore";
import { cn, uid } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

const EMPTY: ChatMessage[] = [];

const QUICK = ["Explain this more simply", "Give me a worked example", "Why is this on my roadmap?"];

export function ChatPanel({
  sessionId,
  roadmapTitle,
  subtopicTitle,
  className,
}: {
  sessionId: string;
  roadmapTitle: string;
  subtopicTitle?: string;
  className?: string;
}) {
  const messages = useStudyStore((s) => s.chats[sessionId] ?? EMPTY);
  const appendChat = useStudyStore((s) => s.appendChat);
  const depth = useStudyStore((s) => s.depth);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setInput("");
    appendChat(sessionId, {
      id: uid("m"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    });
    setPending(true);
    try {
      const reply = await sendChatMessage({
        messages: [...messages, { role: "user", content }].map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        context: { roadmapTitle, subtopicTitle, depth },
        sources: await retrieve(`${subtopicTitle ?? roadmapTitle}: ${content}`, 3),
      });
      appendChat(sessionId, reply);
    } catch {
      appendChat(sessionId, {
        id: uid("m"),
        role: "assistant",
        content:
          "That didn't go through. Your key may need attention — check the indicator in the header.",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface",
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink">Ask about this</p>
          <p className="label-data text-ink-faint">
            {subtopicTitle ?? roadmapTitle}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !pending && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-ink-soft">
              Stuck mid-question, or want it explained another way? Ask here — it
              knows which step you&apos;re on.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-line bg-sunk px-3 py-1.5 text-[13px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "animate-rise max-w-[85%] text-sm leading-relaxed whitespace-pre-line",
              message.role === "user"
                ? "ml-auto rounded-2xl rounded-br-sm bg-gold-50 px-3.5 py-2.5 text-ink"
                : "text-ink-soft",
            )}
          >
            {message.content}
          </div>
        ))}

        {pending && (
          <p className="flex items-center gap-2 text-sm text-ink-faint">
            <Loader2 className="size-3.5 animate-spin" /> Thinking
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            placeholder="Ask a question…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-gold-500 focus:outline-none"
          />
          <Button
            size="md"
            onClick={() => send(input)}
            disabled={!input.trim()}
            loading={pending}
            icon={<CornerDownLeft className="size-4" />}
            aria-label="Send"
          />
        </div>
      </div>
    </section>
  );
}
