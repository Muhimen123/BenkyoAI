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
