"use client";

import { ArrowRight, BadgeCheck, Check, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { AnswerResult, MistakeType } from "@/lib/types";
import { cn } from "@/lib/utils";

const MISTAKE: Record<
  MistakeType,
  { label: string; tone: "review" | "clay" | "gold"; follow: string }
> = {
  careless: {
    label: "Careless slip",
    tone: "review",
    follow: "No change to your roadmap — this one doesn't count against mastery.",
  },
  misunderstanding: {
    label: "Wrong model",
    tone: "clay",
    follow: "Queued as a quick review in your next session.",
  },
  "missing-concept": {
    label: "Missing foundation",
    tone: "gold",
    follow: "An earlier step has been folded back into your roadmap.",
  },
};

export function ResultPanel({
  result,
  onNext,
  onExplain,
  isLast,
}: {
  result: AnswerResult;
  onNext: () => void;
  onExplain: () => void;
  isLast: boolean;
}) {
  const mistake = result.mistakeType ? MISTAKE[result.mistakeType] : null;

  return (
    <div
      className={cn(
        "animate-rise space-y-4 rounded-xl border p-5",
        result.correct ? "border-sage-100 bg-sage-50" : "border-line bg-sunk",
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full",
            result.correct ? "bg-sage-500 text-white" : "bg-clay-500 text-white",
          )}
        >
          {result.correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        </span>
        <span className="text-[15px] font-semibold text-ink">
          {result.correct ? "Correct" : "Not this time"}
        </span>
        {mistake && <Badge tone={mistake.tone}>{mistake.label}</Badge>}
        <span
          className={cn(
            "label-data ml-auto tabular-nums",
            result.understandingDelta >= 0 ? "text-sage-700" : "text-clay-700",
          )}
        >
          {result.understandingDelta >= 0 ? "+" : ""}
          {result.understandingDelta} mastery
        </span>
      </div>

      <p className="text-sm leading-relaxed text-ink-soft">{result.feedback}</p>

      {mistake && (
        <p className="border-l-2 border-line-strong pl-3 text-[13px] leading-snug text-ink-soft">
          {mistake.follow}
        </p>
      )}

      {result.growth && (
        <p className="text-[13px] text-sage-700">{result.growth.detail}</p>
      )}

      {result.bestExplanation && (
        <div className="rounded-lg border border-gold-200 bg-gold-50 p-3.5">
          <p className="label-data flex items-center gap-1.5 text-gold-700">
            <BadgeCheck className="size-3" />
            AI&apos;s best explanation
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
            {result.bestExplanation.text}
          </p>
          <p className="mt-2 text-[12px] text-ink-faint">
            {result.bestExplanation.helpedNote}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={onNext} icon={<ArrowRight className="size-4" />}>
          {isLast ? "Finish practice" : "Next question"}
        </Button>
        <Button variant="ghost" onClick={onExplain} icon={<Lightbulb className="size-4" />}>
          Explain this differently
        </Button>
      </div>
    </div>
  );
}
