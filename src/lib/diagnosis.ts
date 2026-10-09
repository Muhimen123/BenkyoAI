/**
 * Mistake diagnosis: deterministic rules, not model opinion.
 *
 * Option ids carry their role (correct_/trap_/dist_), assigned server-side when
 * the question set is built. A wrong answer given faster than a person can
 * read the question is a careless slip; picking the misconception trap is a
 * misunderstanding; anything else points to a missing concept.
 */
import type { MistakeType, NextAction } from "./types";

/** Under this many seconds a wrong practice answer counts as a slip. */
export const CARELESS_SECONDS = 8;
/** Recall questions are shorter, so the slip window is shorter too. */
export const RECALL_CARELESS_SECONDS = 6;

export function isCorrectOption(optionId: string) {
  return optionId.startsWith("correct_");
}

export function diagnosePractice(optionId: string, elapsedSec: number): MistakeType | undefined {
  if (isCorrectOption(optionId)) return undefined;
  if (elapsedSec < CARELESS_SECONDS) return "careless";
  if (optionId.startsWith("trap_")) return "misunderstanding";
  return "missing-concept";
}

export function diagnoseRecall(optionId: string, elapsedSec: number): MistakeType | undefined {
  if (isCorrectOption(optionId)) return undefined;
  return elapsedSec < RECALL_CARELESS_SECONDS ? "careless" : "misunderstanding";
}

/** Mastery change and next step for a practice answer. */
export function practiceOutcome(mistake: MistakeType | undefined): {
  understandingDelta: number;
  suggestedAction: NextAction;
} {
  if (!mistake) return { understandingDelta: 12, suggestedAction: "move-on" };
  if (mistake === "careless") return { understandingDelta: -2, suggestedAction: "move-on" };
  if (mistake === "misunderstanding") return { understandingDelta: -7, suggestedAction: "review" };
  return { understandingDelta: -7, suggestedAction: "go-deeper" };
}
