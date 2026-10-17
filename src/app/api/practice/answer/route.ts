import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import { withUsage } from '@/lib/usage';
import { McqFeedbackSchema, ShortAnswerGradeSchema } from '@/lib/schemas';
import { correctOptionIdFor, diagnosePractice, isCorrectOption, practiceOutcome } from '@/lib/diagnosis';

export const POST = withUsage(async (request: NextRequest) => {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, subtopicId, optionId, text, elapsedSec } = body;
    // Older clients don't send the question; fall back to the generic wording.
    const question: string =
      typeof body.prompt === 'string' && body.prompt.trim()
        ? body.prompt.trim()
        : 'In one or two sentences: when would you reach for this concept, and when would you not?';

    // We don't have the full roadmap in this request, but we can query Gemini.
    // We can infer the subtopic title or just pass subtopicId to help, but wait, the client doesn't send the subtopic title.
    // Wait, is it possible to get the subtopic title?
    // Let's ask Gemini to assume the context or write general Socratic feedback for this concept.
    // Actually, we can just say "the subtopic" or query Gemini to analyze the text response.

    if (optionId) {
      // Multiple Choice Question
      const isCorrect = isCorrectOption(optionId);
      const correctOptionId = correctOptionIdFor(optionId);

      // Deterministic diagnosis; the model only writes the feedback.
      const mistakeType = diagnosePractice(optionId, elapsedSec);

      const prompt = `The student is studying a subtopic (ID: ${subtopicId}).
They answered a multiple-choice question: "${question}"
Result: ${isCorrect ? 'Correct' : `Incorrect. Mistake Category: ${mistakeType}`}
Time taken: ${elapsedSec} seconds.

Generate Socratic feedback for this result.
Return a JSON object:
{
  "feedback": "1-2 sentences of Socratic guidance. If they got it wrong, briefly explain what to watch out for.",
  "bestExplanation": {
    "text": "A brief conceptual tip or mental model for this topic.",
    "helpedNote": "A brief note on why this mental model is helpful."
  }
}
Respond ONLY with valid JSON.`;

      const parsed = await generateJSON(prompt, McqFeedbackSchema, apiKey);

      const { understandingDelta, suggestedAction } = practiceOutcome(mistakeType);

      return NextResponse.json({
        questionId,
        correct: isCorrect,
        understandingDelta,
        mistakeType,
        feedback: parsed.feedback,
        correctOptionId,
        suggestedAction,
        bestExplanation: parsed.bestExplanation,
      });
    } else {
      // Short Answer Question
      const prompt = `The student was asked a short-answer application question: "${question}"
Their written response is: "${text || ''}"
Time taken: ${elapsedSec} seconds.

Evaluate the response for correctness, accuracy, and depth of explanation.
Return a JSON object:
{
  "correct": true/false,
  "feedback": "1-2 sentences of Socratic feedback explaining what was good or what was missing.",
  "suggestedAction": "move-on" | "review" | "go-deeper",
  "understandingDelta": number // 8 to 12 if correct, -2 to -7 if incorrect/thin
}
Respond ONLY with valid JSON.`;

      const parsed = await generateJSON(prompt, ShortAnswerGradeSchema, apiKey);

      return NextResponse.json({
        questionId,
        correct: parsed.correct,
        understandingDelta: parsed.understandingDelta ?? (parsed.correct ? 10 : -5),
        mistakeType: parsed.correct ? undefined : 'missing-concept',
        feedback: parsed.feedback,
        suggestedAction: parsed.suggestedAction || (parsed.correct ? 'move-on' : 'review'),
      });
    }
  } catch (error: any) {
    console.error('Practice Answer API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to submit answer' }, { status: 500 });
  }
});
