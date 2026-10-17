/**
 * Spaced repetition with FSRS (Free Spaced Repetition Scheduler, via ts-fsrs).
 *
 * Every answer on a subtopic is a review. The grade comes from the same
 * deterministic diagnosis that drives mastery: a correct answer is "Good", a
 * careless slip is "Hard" (the idea is there, the execution wasn't), and a
 * misunderstanding or missing concept is "Again". FSRS then predicts when the
 * learner is about to forget, and recall pulls that subtopic back in on time.
 */
import { createEmptyCard, fsrs, Rating, type CardInput, type Grade } from "ts-fsrs";
import type { MistakeType, Subtopic } from "./types";

/** An FSRS card as it sits in localStorage: dates are ISO strings. */
export type ReviewCard = Omit<CardInput, "due" | "last_review"> & {
  due: string;
  last_review?: string;
};

const scheduler = fsrs({ enable_fuzz: true });

export function gradeFor(input: { delta: number; mistakeType?: MistakeType }): Grade {
  if (input.mistakeType === "careless") return Rating.Hard;
  if (input.mistakeType) return Rating.Again;
  return input.delta > 0 ? Rating.Good : Rating.Hard;
}

export function schedule(card: ReviewCard | undefined, grade: Grade, now = new Date()): ReviewCard {
  const { card: next } = scheduler.next(card ?? createEmptyCard(now), now, grade);
  return {
    ...next,
    due: next.due.toISOString(),
    last_review: next.last_review?.toISOString(),
  };
}

export function isDue(sub: Pick<Subtopic, "review">, now = new Date()) {
  return Boolean(sub.review && new Date(sub.review.due) <= now);
}

/** Probability (0–1) the learner can still recall this subtopic right now. */
export function retrievability(sub: Pick<Subtopic, "review">, now = new Date()) {
  if (!sub.review) return null;
  return scheduler.get_retrievability(sub.review, now, false);
}
