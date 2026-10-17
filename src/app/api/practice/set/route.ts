import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import { withUsage } from '@/lib/usage';
import { PracticeSetSchema } from '@/lib/schemas';
import { PRACTICE_SYSTEM_PROMPT } from '@/lib/prompts';
import { uid } from '@/lib/utils';
import type { Question } from '@/lib/types';

export const POST = withUsage(async (request: NextRequest) => {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { subtopicId, context } = body;

    const title = context?.title ?? "this subtopic";
    const topicTitle = context?.topicTitle ?? "the topic";
    const weakPoints = context?.weakPoints || [];
    const weakPointsText = weakPoints.length > 0
      ? weakPoints.map((w: any) => w.title).join(', ')
      : 'None';

    const userPrompt = `Subtopic Title: ${title}
Topic Title: ${topicTitle}
Eligible Weak Points to blend in: ${weakPointsText}`;

    const combinedPrompt = `${PRACTICE_SYSTEM_PROMPT}\n\n${userPrompt}`;

    const parsed = await generateJSON(combinedPrompt, PracticeSetSchema, apiKey);

    const questions: Question[] = (parsed.questions || []).map((q: any) => {
      const questionId = uid("q");
      const isReview = Boolean(q.reviewOfLabel);

      if (q.kind === 'mcq') {
        const correctSuffix = uid("opt");
        const options = (q.options || []).map((o: any) => {
          const prefix = o.isCorrect ? 'correct_' : o.isTrap ? 'trap_' : 'dist_';
          const id = o.isCorrect 
            ? `correct_${correctSuffix}` 
            : `${prefix}${correctSuffix}_${uid("opt")}`;
          return {
            id,
            label: o.label,
          };
        });

        // Shuffle options
        const shuffled = options.sort(() => Math.random() - 0.5);

        return {
          id: questionId,
          subtopicId,
          kind: 'mcq',
          prompt: q.prompt,
          options: shuffled,
          tricky: (q.options || []).some((o: any) => o.isTrap),
          isReviewBlend: isReview,
          reviewOfLabel: q.reviewOfLabel || undefined,
        };
      } else {
        return {
          id: questionId,
          subtopicId,
          kind: q.kind || 'short',
          prompt: q.prompt,
          tricky: false,
          isReviewBlend: false,
        };
      }
    });

    return NextResponse.json({ subtopicId, questions });
  } catch (error: any) {
    console.error('Practice Set API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to generate practice set' }, { status: 500 });
  }
});
