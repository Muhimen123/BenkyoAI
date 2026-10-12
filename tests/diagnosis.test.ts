import { test } from "node:test";
import assert from "node:assert/strict";
import { diagnosePractice, diagnoseRecall, practiceOutcome } from "@/lib/diagnosis";

test("a correct option is never a mistake, however fast", () => {
  assert.equal(diagnosePractice("correct_abc", 1), undefined);
  assert.equal(diagnoseRecall("correct_abc", 1), undefined);
});

test("a fast wrong answer is a careless slip", () => {
  assert.equal(diagnosePractice("trap_abc_1", 5), "careless");
  assert.equal(diagnosePractice("dist_abc_1", 7.9), "careless");
});

test("choosing the misconception trap after thinking is a misunderstanding", () => {
  assert.equal(diagnosePractice("trap_abc_1", 8), "misunderstanding");
});

test("any other considered wrong answer is a missing concept", () => {
  assert.equal(diagnosePractice("dist_abc_1", 30), "missing-concept");
});

test("recall uses a shorter careless window and no missing-concept class", () => {
  assert.equal(diagnoseRecall("dist_x_1", 5), "careless");
  assert.equal(diagnoseRecall("dist_x_1", 6), "misunderstanding");
});

test("outcomes: careless barely moves mastery, missing concept sends the learner deeper", () => {
  assert.deepEqual(practiceOutcome(undefined), { understandingDelta: 12, suggestedAction: "move-on" });
  assert.deepEqual(practiceOutcome("careless"), { understandingDelta: -2, suggestedAction: "move-on" });
  assert.deepEqual(practiceOutcome("misunderstanding"), { understandingDelta: -7, suggestedAction: "review" });
  assert.deepEqual(practiceOutcome("missing-concept"), { understandingDelta: -7, suggestedAction: "go-deeper" });
});

test("the correct option is recovered from any option in the same question", async () => {
  const { correctOptionIdFor } = await import("@/lib/diagnosis");
  const { uid } = await import("@/lib/utils");
  // Built exactly as /api/practice/set and /api/recall build them.
  const shared = uid("opt");
  const correct = `correct_${shared}`;
  assert.equal(correctOptionIdFor(correct), correct);
  assert.equal(correctOptionIdFor(`trap_${shared}_${uid("opt")}`), correct);
  assert.equal(correctOptionIdFor(`dist_${shared}_${uid("opt")}`), correct);
  assert.equal(correctOptionIdFor("dist_abc_1"), "correct_abc");
});
