"use client";

import { useState } from "react";
import { Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Field";
import type { AnswerPayload, Question } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuestionCard({
  question,
  index,
  total,
  submitting,
  locked,
  chosenOptionId,
  correctOptionId,
  onSubmit,
}: {
  question: Question;
  index: number;
  total: number;
  submitting: boolean;
  locked: boolean;
  chosenOptionId?: string;
  correctOptionId?: string;
  onSubmit: (payload: AnswerPayload) => void;
}) {
  const [selected, setSelected] = useState<string | undefined>(chosenOptionId);
  const [text, setText] = useState("");
  // The parent remounts this card per question (key), so state and the timer start fresh.
  const [startedAt] = useState(() => Date.now());

  const ready = question.kind === "mcq" ? Boolean(selected) : text.trim().length > 0;

  function submit() {
    onSubmit({
      questionId: question.id,
      subtopicId: question.subtopicId,
      optionId: question.kind === "mcq" ? selected : undefined,
      text: question.kind === "mcq" ? undefined : text,
      prompt: question.prompt,
      elapsedSec: Math.round((Date.now() - startedAt) / 1000),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-data text-ink-faint tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        {question.isReviewBlend && (
          <Badge tone="review" icon={<Sparkles className="size-2.5" />}>
            from earlier: {question.reviewOfLabel}
          </Badge>
        )}
        {question.tricky && (
          <Badge tone="gold" icon={<TriangleAlert className="size-2.5" />}>
            built to be tricky
          </Badge>
        )}
      </div>

      <p className="text-[19px] leading-snug font-medium tracking-tight text-ink sm:text-[21px]">
        {question.prompt}
      </p>

      {question.kind === "mcq" ? (
        <div className="space-y-2">
          {question.options?.map((option) => {
            const isChosen = selected === option.id;
            const isCorrect = locked && correctOptionId === option.id;
            const isWrongChoice = locked && isChosen && correctOptionId !== option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={locked || submitting}
                onClick={() => setSelected(option.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-[15px] leading-snug transition-colors",
                  isCorrect
                    ? "border-sage-500 bg-sage-50 text-ink"
                    : isWrongChoice
                      ? "border-clay-500 bg-clay-50 text-ink"
                      : isChosen
                        ? "border-gold-500 bg-gold-50 text-ink"
                        : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
                  locked && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0 rounded-full border-2 transition-colors",
                    isCorrect
                      ? "border-sage-500 bg-sage-500"
                      : isWrongChoice
                        ? "border-clay-500 bg-clay-500"
                        : isChosen
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
          rows={4}
          value={text}
          disabled={locked || submitting}
          placeholder="Write it out — a sentence or two is enough."
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {!locked && (
        <Button size="lg" onClick={submit} loading={submitting} disabled={!ready} full>
          Check answer
        </Button>
      )}
    </div>
  );
}
