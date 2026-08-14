"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  CalendarClock,
  GraduationCap,
  Hammer,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Feedback";
import { MaterialInput } from "@/components/MaterialInput";
import { getCalibrationQuestions } from "@/lib/api/roadmap";
import type { CalibrationAnswer, CalibrationQuestion, Purpose } from "@/lib/types";
import { cn, daysUntil } from "@/lib/utils";

/* ------------------------------------------------------------------ topic */

export function TopicStep({
  topic,
  onTopicChange,
  onNext,
  onBack,
}: {
  topic: string;
  onTopicChange: (value: string) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-[22px] leading-snug font-semibold tracking-tight text-ink sm:text-[26px]">
          What do you want to learn?
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Write it the way you'd say it out loud. A subject, a chapter, a skill,
          a thing you keep failing questions on.
        </p>
      </div>

      <Field
        label="Your topic"
        htmlFor="topic"
        hint="Specific beats broad: “SN1 vs SN2 mechanisms” gets you a sharper roadmap than “chemistry”."
      >
        <Textarea
          id="topic"
          rows={3}
          value={topic}
          autoFocus
          placeholder="e.g. Organic chemistry — substitution and elimination mechanisms, for my end-of-term exam"
          onChange={(e) => onTopicChange(e.target.value)}
        />
      </Field>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-ink">Add your own material</p>
          <span className="label-data text-ink-faint">optional</span>
        </div>
        <p className="text-[13px] text-ink-soft">
          If you have slides or notes, the roadmap is built around them instead
          of a generic outline.
        </p>
        <MaterialInput compact />
      </div>

      <div className="flex gap-2">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
        <Button size="lg" onClick={onNext} disabled={topic.trim().length < 3} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ calibration */

export function CalibrationStep({
  topic,
  answers,
  onAnswer,
  onNext,
  onBack,
}: {
  topic: string;
  answers: CalibrationAnswer[];
  onAnswer: (answer: CalibrationAnswer) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [questions, setQuestions] = useState<CalibrationQuestion[] | null>(null);

  useEffect(() => {
    let alive = true;
    getCalibrationQuestions(topic)
      .then((q) => alive && setQuestions(q))
      .catch(() => alive && setQuestions([]));
    return () => {
      alive = false;
    };
  }, [topic]);

  const complete = questions?.length
    ? questions.every((q) => answers.some((a) => a.questionId === q.id))
    : false;

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-[22px] leading-snug font-semibold tracking-tight text-ink sm:text-[26px]">
          Where are you starting from?
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Three questions. Answer honestly — overstating it just means the first
          few sessions feel like a wall.
        </p>
      </div>

      {!questions ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-7">
          {questions.map((question, index) => {
            const chosen = answers.find((a) => a.questionId === question.id)?.optionId;
            return (
              <fieldset key={question.id} className="space-y-2.5">
                <legend className="mb-2.5 flex gap-2.5 text-[15px] font-medium text-ink">
                  <span className="label-data pt-1 text-ink-faint">0{index + 1}</span>
                  {question.prompt}
                </legend>
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors",
                      chosen === option.id
                        ? "border-gold-500 bg-gold-50 text-ink"
                        : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
                    )}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      className="sr-only"
                      checked={chosen === option.id}
                      onChange={() =>
                        onAnswer({ questionId: question.id, optionId: option.id })
                      }
                    />
                    <span
                      className={cn(
                        "size-3.5 shrink-0 rounded-full border-2 transition-colors",
                        chosen === option.id
                          ? "border-gold-500 bg-gold-500"
                          : "border-line-strong",
                      )}
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={!complete} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- purpose */

const PURPOSES: {
  id: Purpose;
  label: string;
  icon: typeof GraduationCap;
  effect: string;
}[] = [
  {
    id: "exam",
    label: "An exam",
    icon: GraduationCap,
    effect: "Short cycles, heavy recall, ruthless about what's examinable.",
  },
  {
    id: "project",
    label: "A project",
    icon: Hammer,
    effect: "Depth where you'll build, skimmed where you won't.",
  },
  {
    id: "job",
    label: "Work or interviews",
    icon: Briefcase,
    effect: "Front-loads what colleagues and interviewers assume you know.",
  },
  {
    id: "curiosity",
    label: "Curiosity",
    icon: Sparkles,
    effect: "Unhurried, follows what you find interesting.",
  },
];

export function PurposeStep({
  purpose,
  deadline,
  onPurposeChange,
  onDeadlineChange,
  onBack,
  onSubmit,
  submitting,
}: {
  purpose: Purpose | null;
  deadline?: string;
  onPurposeChange: (purpose: Purpose) => void;
  onDeadlineChange: (deadline: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const days = daysUntil(deadline);

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-[22px] leading-snug font-semibold tracking-tight text-ink sm:text-[26px]">
          Why this, why now?
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          This changes the roadmap, not just the tone — how fast it moves, how
          deep it goes, and what it's willing to skip.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {PURPOSES.map(({ id, label, icon: Icon, effect }) => (
          <button
            key={id}
            type="button"
            onClick={() => onPurposeChange(id)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              purpose === id
                ? "border-gold-500 bg-gold-50"
                : "border-line bg-surface hover:border-line-strong",
            )}
          >
            <Icon
              className={cn(
                "mb-2.5 size-4",
                purpose === id ? "text-gold-700" : "text-ink-faint",
              )}
            />
            <p className="text-sm font-medium text-ink">{label}</p>
            <p className="mt-1 text-[13px] leading-snug text-ink-soft">{effect}</p>
          </button>
        ))}
      </div>

      <Field
        label="Deadline"
        htmlFor="deadline"
        optional
        hint={
          days === null
            ? "If there's a date, the roadmap paces itself to hit it."
            : days > 0
              ? `${days} days out. Pacing will be set to fit.`
              : "That date has passed — pick another one."
        }
      >
        <div className="relative">
          <Input
            id="deadline"
            type="date"
            value={deadline ?? ""}
            onChange={(e) => onDeadlineChange(e.target.value)}
            className="pr-11"
          />
          <CalendarClock className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-faint" />
        </div>
      </Field>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!purpose}
          loading={submitting}
          className="flex-1"
        >
          Build my roadmap
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- building */

const BUILD_LINES = [
  "Reading what you gave it",
  "Placing you on the map",
  "Ordering the steps",
  "Setting the pace",
];

export function BuildingRoadmap({ topic }: { topic: string }) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setLine((l) => Math.min(l + 1, BUILD_LINES.length - 1)),
      900,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[50vh] flex-col justify-center space-y-6">
      <div className="space-y-2">
        <p className="label-data text-gold-700">Building</p>
        <h2 className="text-[22px] leading-snug font-semibold tracking-tight text-ink sm:text-[26px]">
          {topic}
        </h2>
      </div>
      <ul className="space-y-2.5">
        {BUILD_LINES.map((text, i) => (
          <li
            key={text}
            className={cn(
              "flex items-center gap-2.5 text-sm transition-opacity duration-500",
              i <= line ? "text-ink-soft opacity-100" : "text-ink-faint opacity-40",
            )}
          >
            {i < line ? (
              <span className="size-1.5 rounded-full bg-sage-500" />
            ) : i === line ? (
              <Loader2 className="size-3.5 animate-spin text-gold-500" />
            ) : (
              <span className="size-1.5 rounded-full bg-line-strong" />
            )}
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
