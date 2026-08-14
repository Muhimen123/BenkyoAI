import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/ai';
import type { MistakeType, NextAction } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, subtopicId, optionId, text, elapsedSec } = body;

    if (optionId) {
      // Multiple Choice Question
      const isCorrect = optionId.startsWith('correct_');
      const parts = optionId.split('_');
      const correctSuffix = parts[1] || '';
      const correctOptionId = `correct_${correctSuffix}`;

      const mistakeType: MistakeType | undefined = isCorrect
        ? undefined
        : (elapsedSec < 6 ? 'careless' : 'misunderstanding');

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

      const responseText = await generateGeminiResponse(prompt, apiKey);
      const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(jsonString);

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

      const responseText = await generateGeminiResponse(prompt, apiKey);
      const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(jsonString);

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
}
