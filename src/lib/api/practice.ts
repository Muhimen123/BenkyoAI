/**
 * POST /api/practice/set, /api/practice/answer, /api/practice/explanation
 *
 * The answer key lives in this module rather than in the question objects the UI
 * receives — same as it will when a route handler holds it server-side.
 */
import { request } from "./client";
import { hash, uid } from "@/lib/utils";
import type {
  AnswerPayload,
  AnswerResult,
  ExplanationEvaluation,
  ExplanationPayload,
  ExplainMode,
  MistakeType,
  PracticeSet,
  Question,
} from "@/lib/types";

const answerKey = new Map<
  string,
  { correctOptionId: string; trapOptionId?: string; concept: string }
>();

export interface PracticeSetPayload {
  subtopicId: string;
  context?: {
    title: string;
    topicTitle: string;
    /** Older weak points eligible to be blended into this set. */
    weakPoints?: { id: string; title: string }[];
  };
}

export async function getPracticeSet(
  payload: PracticeSetPayload,
): Promise<PracticeSet> {
  return request<PracticeSetPayload, PracticeSet>(
    "/api/practice/set",
    payload,
    ({ subtopicId, context }) => {
      const title = context?.title ?? "this subtopic";
      const seed = hash(subtopicId);
      const questions: Question[] = [];

      const mcq = (
        prompt: string,
        correct: string,
        trap: string,
        others: string[],
        opts: { tricky?: boolean; review?: string } = {},
      ): Question => {
        const id = uid("q");
        const correctId = uid("o");
        const trapId = uid("o");
        const options = [
          { id: correctId, label: correct },
          { id: trapId, label: trap },
          ...others.map((label) => ({ id: uid("o"), label })),
        ];
        // Stable shuffle so the correct answer isn't always first.
        const offset = hash(id) % options.length;
        const shuffled = [...options.slice(offset), ...options.slice(0, offset)];
        answerKey.set(id, {
          correctOptionId: correctId,
          trapOptionId: trapId,
          concept: title,
        });
        return {
          id,
          subtopicId,
          kind: "mcq",
          prompt,
          options: shuffled,
          tricky: Boolean(opts.tricky),
          isReviewBlend: Boolean(opts.review),
          reviewOfLabel: opts.review,
        };
      };

      questions.push(
        mcq(
          `Which statement about ${title.toLowerCase()} holds in the general case?`,
          "The rule follows from the underlying model, so it survives changes to the surface details.",
          "It always holds, with no exceptions worth worrying about.",
          [
            "It only holds for the worked example in the notes.",
            "It's a convention with no reasoning behind it.",
          ],
        ),
      );

      questions.push({
        id: (() => {
          const id = uid("q");
          answerKey.set(id, { correctOptionId: "", concept: title });
          return id;
        })(),
        subtopicId,
        kind: "short",
        prompt: `In one or two sentences: when would you reach for ${title.toLowerCase()}, and when would you not?`,
        tricky: false,
        isReviewBlend: false,
      });

      questions.push(
        mcq(
          `A classmate applies ${title.toLowerCase()} and gets an answer that looks right but isn't. What most likely went wrong?`,
          "They matched the surface pattern without checking the condition the rule depends on.",
          "They made an arithmetic slip near the end.",
          [
            "They used the wrong notation.",
            "Nothing — the answer is right and the marking scheme is wrong.",
          ],
          { tricky: true },
        ),
      );

      const weak = context?.weakPoints?.[seed % (context.weakPoints.length || 1)];
      if (weak) {
        questions.push(
          mcq(
            `Still holding? ${weak.title} — which of these is the accurate description?`,
            "The one that names the mechanism rather than the outcome.",
            "The one that describes what you observe, without saying why.",
            ["The one that only applies to a special case.", "None of these."],
            { review: weak.title },
          ),
        );
      }

      questions.push({
        id: uid("q"),
        subtopicId,
        kind: "explain-back",
        prompt: `Explain ${title.toLowerCase()} in your own words, as if the person listening has never met it.`,
        tricky: false,
        isReviewBlend: false,
      });

      return { subtopicId, questions };
    },
    { latency: 850 },
  );
}

const FEEDBACK: Record<MistakeType, string> = {
  careless:
    "You had the right idea and moved too fast. Nothing to relearn here — just slow down on the last step.",
  misunderstanding:
    "This is the common wrong model, not a slip. Worth re-reading the explanation before moving on.",
  "missing-concept":
    "This leans on something earlier in the roadmap that hasn't landed yet. BenkyoAI will fold that step back in.",
};

export async function submitAnswer(
  payload: AnswerPayload,
): Promise<AnswerResult> {
  return request<AnswerPayload, AnswerResult>(
    "/api/practice/answer",
    payload,
    (body) => {
      const key = answerKey.get(body.questionId);

      // Short answer: graded on whether the response actually commits to a claim.
      if (!body.optionId) {
        const text = (body.text ?? "").trim();
        const substantive = text.split(/\s+/).length >= 12;
        return {
          questionId: body.questionId,
          correct: substantive,
          understandingDelta: substantive ? 9 : 2,
          mistakeType: substantive ? undefined : "missing-concept",
          feedback: substantive
            ? "That names the condition, not just the result — which is the part that transfers."
            : "Too thin to tell whether it's there. Say when it applies and when it doesn't.",
          suggestedAction: substantive ? "move-on" : "review",
        };
      }

      const correct = Boolean(key && body.optionId === key.correctOptionId);
      if (correct) {
        return {
          questionId: body.questionId,
          correct: true,
          understandingDelta: 12,
          feedback: "Right, and for the right reason.",
          correctOptionId: key?.correctOptionId,
          suggestedAction: "move-on",
          bestExplanation: {
            text: "Check the condition before the pattern. The condition is what fails first when a question is designed to trip you.",
            helpedNote: "This framing helps most students who miss this one.",
          },
        };
      }

      const mistakeType: MistakeType =
        body.elapsedSec < 8
          ? "careless"
          : key?.trapOptionId && body.optionId === key.trapOptionId
            ? "misunderstanding"
            : "missing-concept";

      return {
        questionId: body.questionId,
        correct: false,
        understandingDelta: mistakeType === "careless" ? -2 : -7,
        mistakeType,
        feedback: FEEDBACK[mistakeType],
        correctOptionId: key?.correctOptionId,
        suggestedAction: mistakeType === "careless" ? "move-on" : mistakeType === "misunderstanding" ? "review" : "go-deeper",
      };
    },
    { latency: 600 },
  );
}

export async function evaluateExplanation(
  payload: ExplanationPayload,
): Promise<ExplanationEvaluation> {
  return request<ExplanationPayload, ExplanationEvaluation>(
    "/api/practice/explanation",
    payload,
    (body) => {
      const words = body.text.trim().split(/\s+/).filter(Boolean);
      const hasBecause = /because|since|so that|which means/i.test(body.text);
      const hasCondition = /when|if|unless|only/i.test(body.text);

      const gaps: string[] = [];
      if (!hasBecause) gaps.push("No causal link — you described what happens, not why.");
      if (!hasCondition) gaps.push("No boundary — say when this stops being true.");
      if (words.length < 25) gaps.push("Short enough that a listener would still be guessing.");

      const pass = gaps.length === 0;
      return {
        verdict: pass ? "pass" : "needs-review",
        gaps,
        followUp: pass
          ? undefined
          : "Try once more, and this time finish the sentence “this works because…”.",
        understandingDelta: pass ? 15 : Math.max(2, 8 - gaps.length * 2),
      };
    },
    { latency: 1000 },
  );
}

/** POST /api/chat — the in-context "explain this differently" control. */
export async function reexplain(
  subtopicId: string,
  title: string,
  mode: ExplainMode,
): Promise<string> {
  return request<{ subtopicId: string; title: string; mode: ExplainMode }, string>(
    "/api/chat",
    { subtopicId, title, mode },
    () => {
      if (mode === "simpler")
        return `Plainly: ${title.toLowerCase()} is a rule for deciding what happens next, and it only works while its one condition holds. Strip everything else away and that's the whole idea.`;
      if (mode === "deeper")
        return `Going deeper on ${title.toLowerCase()}: the rule is a shortcut for a longer argument. Follow that argument once and the edge cases stop being exceptions you memorise — they become the places where a step in the argument fails.`;
      return `Another angle on ${title.toLowerCase()}: instead of starting from the definition, start from a case where it clearly fails. What's missing in that case is exactly what the rule is asserting.`;
    },
    { latency: 900 },
  );
}

/** POST /api/chat — the explanation body for a subtopic, at the chosen depth. */
export async function getExplanation(payload: {
  subtopicId: string;
  title: string;
  stub: string;
  depth: "brief" | "balanced" | "deep";
}): Promise<string[]> {
  return request<typeof payload, string[]>(
    "/api/chat",
    payload,
    ({ title, stub, depth }) => {
      const core = [
        stub,
        `The useful way in is to ask what ${title.toLowerCase()} rules out. Anything that survives that question is the part worth remembering; the rest is bookkeeping.`,
      ];
      if (depth === "brief") return core.slice(0, 2);
      const balanced = [
        ...core,
        `Worked through: take the simplest case that isn't trivial. Name what's given, name what's asked, and check the one condition this idea depends on before you use it. That check is the step people skip, and it's the step exam questions are built around.`,
      ];
      if (depth === "balanced") return balanced;
      return [
        ...balanced,
        `One level down: the rule is shorthand for a longer argument. Follow the argument once and the exceptions stop being a list to memorise — each one is a place where a specific step of the argument fails, and you can predict them rather than recall them.`,
        `Where it connects: this is the same shape as the earlier step in your roadmap. If that one felt shaky, this will too, and the fix is upstream.`,
      ];
    },
    { latency: 700 },
  );
}
