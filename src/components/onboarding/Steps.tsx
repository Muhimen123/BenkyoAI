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
import { useT } from "@/lib/i18n/LocaleProvider";

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
  const { t } = useT();
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-[22px] leading-snug font-semibold tracking-tight text-ink sm:text-[26px]">
          {t("onboarding.topic.heading")}
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          {t("onboarding.topic.lede")}
        </p>
      </div>

      <Field
        label={t("onboarding.topic.fieldLabel")}
        htmlFor="topic"
        hint={t("onboarding.topic.hint")}
      >
        <Textarea
          id="topic"
          rows={3}
          value={topic}
          autoFocus
          placeholder={t("onboarding.topic.placeholder")}
          onChange={(e) => onTopicChange(e.target.value)}
        />
      </Field>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-ink">{t("onboarding.topic.addMaterial")}</p>
          <span className="label-data text-ink-faint">{t("common.optional")}</span>
        </div>
        <p className="text-[13px] text-ink-soft">
          {t("onboarding.topic.materialLede")}
        </p>
        <MaterialInput compact />
      </div>

      <div className="flex gap-2">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            {t("common.back")}
          </Button>
        )}
        <Button size="lg" onClick={onNext} disabled={topic.trim().length < 3} className="flex-1">
          {t("common.continue")}
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
  const { t } = useT();
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
          {t("onboarding.calibration.heading")}
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          {t("onboarding.calibration.lede")}
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
          {t("common.back")}
        </Button>
        <Button size="lg" onClick={onNext} disabled={!complete} className="flex-1">
          {t("common.continue")}
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- purpose */

const PURPOSES: {
  id: Purpose;
  labelKey: string;
  icon: typeof GraduationCap;
  effectKey: string;
}[] = [
  {
    id: "exam",
    labelKey: "onboarding.purpose.exam.label",
    effectKey: "onboarding.purpose.exam.effect",
    icon: GraduationCap,
  },
  {
    id: "project",
    labelKey: "onboarding.purpose.project.label",
    effectKey: "onboarding.purpose.project.effect",
    icon: Hammer,
  },
  {
    id: "job",
    labelKey: "onboarding.purpose.job.label",
    effectKey: "onboarding.purpose.job.effect",
    icon: Briefcase,
  },
  {
    id: "curiosity",
    labelKey: "onboarding.purpose.curiosity.label",
    effectKey: "onboarding.purpose.curiosity.effect",
    icon: Sparkles,
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
  const { t } = useT();
  const days = daysUntil(deadline);

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-[22px] leading-snug font-semibold tracking-tight text-ink sm:text-[26px]">
          {t("onboarding.purpose.heading")}
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          {t("onboarding.purpose.lede")}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {PURPOSES.map(({ id, labelKey, effectKey, icon: Icon }) => (
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
            <p className="text-sm font-medium text-ink">{t(labelKey)}</p>
            <p className="mt-1 text-[13px] leading-snug text-ink-soft">{t(effectKey)}</p>
          </button>
        ))}
      </div>

      <Field
        label={t("onboarding.purpose.deadlineLabel")}
        htmlFor="deadline"
        optional
        hint={
          days === null
            ? t("onboarding.purpose.deadlineHintNone")
            : days > 0
              ? t("onboarding.purpose.deadlineHintDays", { days })
              : t("onboarding.purpose.deadlineHintPast")
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
          {t("common.back")}
        </Button>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!purpose}
          loading={submitting}
          className="flex-1"
        >
          {t("onboarding.purpose.submit")}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- building */

const BUILD_LINES = [
  "onboarding.building.reading",
  "onboarding.building.placing",
  "onboarding.building.ordering",
  "onboarding.building.pacing",
] as const;

export function BuildingRoadmap({ topic }: { topic: string }) {
  const { t } = useT();
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
        <p className="label-data text-gold-700">{t("onboarding.building.label")}</p>
        <h2 className="text-[22px] leading-snug font-semibold tracking-tight text-ink sm:text-[26px]">
          {topic}
        </h2>
      </div>
      <ul className="space-y-2.5">
        {BUILD_LINES.map((key, i) => (
          <li
            key={key}
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
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  );
}
