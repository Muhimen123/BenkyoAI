import { z } from 'zod';

/**
 * Zod schemas for every structured Gemini response.
 *
 * Each schema does double duty: it is converted to JSON Schema and sent to
 * Gemini as `responseJsonSchema` (so the model is constrained at generation
 * time), and the reply is validated against it before any route uses it.
 * Keep these in sync with the JSON examples in `prompts.ts`.
 */

export const SummarySchema = z.object({
  keyPoints: z.array(z.string()),
  readingTimeMin: z.number().optional(),
});

const RoadmapSubtopicSchema = z.object({
  title: z.string(),
  explanationStub: z.string(),
  estimatedMin: z.number().optional(),
});

export const RoadmapSchema = z.object({
  topics: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      isMilestone: z.boolean(),
      subtopics: z.array(
        RoadmapSubtopicSchema.extend({
          // Exact titles of earlier subtopics this one builds on: the edges of
          // the prerequisite graph.
          prerequisites: z.array(z.string()),
        }),
      ),
    }),
  ),
});

export const CustomTopicSchema = z.object({
  summary: z.string(),
  subtopics: z.array(RoadmapSubtopicSchema),
});

const OptionSchema = z.object({
  label: z.string(),
  isCorrect: z.boolean(),
  isTrap: z.boolean().optional(),
});

export const PracticeSetSchema = z.object({
  questions: z.array(
    z.object({
      kind: z.enum(['mcq', 'short']),
      prompt: z.string(),
      options: z.array(OptionSchema).optional(),
      reviewOfLabel: z.string().optional(),
    }),
  ),
});

export const RecallSetSchema = z.object({
  questions: z.array(
    z.object({
      subtopicId: z.string(),
      kind: z.enum(['mcq', 'short']),
      prompt: z.string(),
      options: z.array(OptionSchema).optional(),
    }),
  ),
});

export const ExplanationParagraphsSchema = z.array(z.string());

export const ExplainBackSchema = z.object({
  verdict: z.enum(['pass', 'needs-review']),
  gaps: z.array(z.string()),
  followUp: z.string(),
  understandingDelta: z.number(),
});

export const McqFeedbackSchema = z.object({
  feedback: z.string(),
  bestExplanation: z
    .object({ text: z.string(), helpedNote: z.string() })
    .optional(),
});

export const ShortAnswerGradeSchema = z.object({
  correct: z.boolean(),
  feedback: z.string(),
  suggestedAction: z.enum(['move-on', 'review', 'go-deeper']).optional(),
  understandingDelta: z.number().optional(),
});

export const RecallFeedbackSchema = z.object({
  feedback: z.string(),
});

export const RecallShortGradeSchema = z.object({
  correct: z.boolean(),
  feedback: z.string(),
  understandingDelta: z.number().optional(),
});

export const SessionSummarySchema = z.object({
  growth: z.array(z.object({ title: z.string(), detail: z.string() })).optional(),
  nextUp: z
    .object({ subtopicId: z.string(), title: z.string(), reason: z.string() })
    .optional(),
  carryOver: z
    .object({ subtopicId: z.string(), question: z.string() })
    .optional(),
});

/** Retrieved passages sent by the browser; capped so a request can't balloon the prompt. */
export const SourcesSchema = z
  .array(
    z.object({
      tag: z.string().regex(/^S\d+$/),
      label: z.string().max(200),
      text: z.string().max(2000),
    }),
  )
  .max(6)
  .optional();
