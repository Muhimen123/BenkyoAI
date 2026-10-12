"use client";

import { useEffect, useRef, useState } from "react";
import { Check, History, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Field";
import type { AnswerPayload, AnswerResult, RecallItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const REASON: Record<RecallItem["reason"], { label: string; tone: "review" | "gold" | "neutral" }> = {
  "previous-mistake": { label: "you missed this before", tone: "review" },
  unresolved: { label: "left unresolved", tone: "gold" },
  "spaced-review": { label: "due for review", tone: "neutral" },
};

/** One core recall UI. Mode-specific framing lives in the page around it. */
export function RecallItemCard({
  item,
  index,
  total,
  result,
  submitting,
  onSubmit,
  onNext,
  isLast,
}: {
  item: RecallItem;
  index: number;
  total: number;
  result: AnswerResult | null;
  submitting: boolean;
  onSubmit: (payload: AnswerPayload) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const [selected, setSelected] = useState<string | undefined>();
  const [text, setText] = useState("");
  const started = useRef(Date.now());
  const reason = REASON[item.reason];

  useEffect(() => {
    started.current = Date.now();
    setSelected(undefined);
    setText("");
  }, [item.id]);

  const ready = item.kind === "mcq" ? Boolean(selected) : text.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-data text-ink-faint tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <Badge tone={reason.tone} icon={<History className="size-2.5" />}>
          {reason.label}
        </Badge>
        <span className="label-data truncate text-ink-faint">{item.sourceLabel}</span>
      </div>

      <p className="text-[19px] leading-snug font-medium tracking-tight text-ink sm:text-[22px]">
        {item.prompt}
      </p>

      {item.kind === "mcq" ? (
        <div className="space-y-2">
          {item.options?.map((option) => {
            const chosen = selected === option.id;
            const correct = Boolean(result) && result?.correctOptionId === option.id;
            const wrong = Boolean(result) && chosen && !correct;
            return (
              <button
                key={option.id}
                type="button"
                disabled={Boolean(result) || submitting}
                onClick={() => setSelected(option.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-[15px] leading-snug transition-colors",
                  correct
                    ? "border-sage-500 bg-sage-50 text-ink"
                    : wrong
                      ? "border-clay-500 bg-clay-50 text-ink"
                      : chosen
                        ? "border-gold-500 bg-gold-50 text-ink"
                        : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0 rounded-full border-2",
                    correct
                      ? "border-sage-500 bg-sage-500"
                      : wrong
                        ? "border-clay-500 bg-clay-500"
                        : chosen
                          ? "border-gold-500 bg-gold-500"
                          : "border-line-strong",
                  )}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <Textarea
          rows={3}
          value={text}
          disabled={Boolean(result) || submitting}
          placeholder="From memory — no notes."
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {result ? (
        <div className="animate-rise space-y-3 border-t border-line pt-4">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full text-white",
                result.correct ? "bg-sage-500" : "bg-clay-500",
              )}
            >
              {result.correct ? <Check className="size-3" /> : <X className="size-3" />}
            </span>
            {result.feedback}
          </p>
          <Button onClick={onNext} full>
            {isLast ? "Finish recall" : "Next"}
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          full
          loading={submitting}
          disabled={!ready}
          onClick={() =>
            onSubmit({
              questionId: item.id,
              subtopicId: item.sourceSubtopicId,
              optionId: item.kind === "mcq" ? selected : undefined,
              text: item.kind === "mcq" ? undefined : text,
              prompt: item.prompt,
              elapsedSec: Math.round((Date.now() - started.current) / 1000),
            })
          }
        >
          Check
        </Button>
      )}
    </div>
  );
}
