import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import { withUsage } from '@/lib/usage';
import { RecallFeedbackSchema, RecallShortGradeSchema } from '@/lib/schemas';
import type { NextAction } from '@/lib/types';
import { diagnoseRecall, isCorrectOption } from '@/lib/diagnosis';

export const POST = withUsage(async (request: NextRequest) => {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, subtopicId, optionId, text, elapsedSec } = body;

    if (optionId) {
      // Multiple Choice Question
      const isCorrect = isCorrectOption(optionId);
      const parts = optionId.split('_');
      const correctSuffix = parts[1] || '';
      const correctOptionId = `correct_${correctSuffix}`;

      const mistakeType = diagnoseRecall(optionId, elapsedSec);

      const prompt = `The student is doing active recall for a subtopic (ID: ${subtopicId}).
They answered a multiple-choice question.
Result: ${isCorrect ? 'Correct' : `Incorrect. Mistake Category: ${mistakeType}`}
Time taken: ${elapsedSec} seconds.

Generate Socratic feedback for this recall result.
Return a JSON object:
{
  "feedback": "1-2 sentences of Socratic guidance. Keep it brief, encouraging, and clear."
}
Respond ONLY with valid JSON.`;

      const parsed = await generateJSON(prompt, RecallFeedbackSchema, apiKey);

      const understandingDelta = isCorrect ? 10 : -5;
      const suggestedAction: NextAction = isCorrect ? 'move-on' : 'review';

      return NextResponse.json({
        questionId,
        correct: isCorrect,
        understandingDelta,
        mistakeType,
        feedback: parsed.feedback,
        correctOptionId,
        suggestedAction,
      });
    } else {
      // Short Answer Question
      const prompt = `The student was asked an active recall question: "Without looking: what does this concept let you do, and when does it stop working?"
Their written response is: "${text || ''}"
Time taken: ${elapsedSec} seconds.

Evaluate the response for accuracy and completeness. Is it a successful recall of the concept?
Return a JSON object:
{
  "correct": true/false,
  "feedback": "1-2 sentences of Socratic feedback explaining what was correct or what was missed.",
  "understandingDelta": number // 8 if correct, 1 if thin/incorrect
}
Respond ONLY with valid JSON.`;

      const parsed = await generateJSON(prompt, RecallShortGradeSchema, apiKey);

      const isCorrect = parsed.correct;
      const suggestedAction: NextAction = isCorrect ? 'move-on' : 'review';

      return NextResponse.json({
        questionId,
        correct: isCorrect,
        understandingDelta: parsed.understandingDelta ?? (isCorrect ? 8 : 1),
        mistakeType: isCorrect ? undefined : 'misunderstanding',
        feedback: parsed.feedback,
        suggestedAction,
      });
    }
  } catch (error: any) {
    console.error('Recall Answer API grading error:', error);
    return NextResponse.json({ message: error.message || 'Failed to submit recall answer' }, { status: 500 });
  }
});
