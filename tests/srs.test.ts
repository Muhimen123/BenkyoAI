import { test } from "node:test";
import assert from "node:assert/strict";
import { Rating } from "ts-fsrs";
import { gradeFor, isDue, schedule } from "@/lib/srs";

test("diagnosis maps onto FSRS grades", () => {
  assert.equal(gradeFor({ delta: 12 }), Rating.Good);
  assert.equal(gradeFor({ delta: -2, mistakeType: "careless" }), Rating.Hard);
  assert.equal(gradeFor({ delta: -7, mistakeType: "misunderstanding" }), Rating.Again);
  assert.equal(gradeFor({ delta: -7, mistakeType: "missing-concept" }), Rating.Again);
});

test("cards survive a JSON round trip, as they do in localStorage", () => {
  const now = new Date("2026-10-01T09:00:00Z");
  const card = JSON.parse(JSON.stringify(schedule(undefined, Rating.Good, now)));
  assert.equal(typeof card.due, "string");
  const next = schedule(card, Rating.Good, new Date(card.due));
  assert.ok(new Date(next.due) > new Date(card.due));
});

test("forgetting brings a subtopic back sooner than remembering", () => {
  const now = new Date("2026-10-01T09:00:00Z");
  let card = schedule(undefined, Rating.Good, now);
  for (let i = 0; i < 3; i++) card = schedule(card, Rating.Good, new Date(card.due));
  const reviewAt = new Date(card.due);
  const remembered = schedule(card, Rating.Good, reviewAt);
  const forgotten = schedule(card, Rating.Again, reviewAt);
  assert.ok(new Date(forgotten.due) < new Date(remembered.due));
  assert.equal(forgotten.lapses, card.lapses + 1);
});

test("isDue respects the scheduled date", () => {
  const card = schedule(undefined, Rating.Good, new Date("2026-10-01T09:00:00Z"));
  assert.equal(isDue({ review: card }, new Date(new Date(card.due).getTime() - 1)), false);
  assert.equal(isDue({ review: card }, new Date(card.due)), true);
  assert.equal(isDue({}), false);
});
