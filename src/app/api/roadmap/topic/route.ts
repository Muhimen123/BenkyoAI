import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/ai';
import { titleCase, uid } from '@/lib/utils';
import type { Subtopic, Topic } from '@/lib/types';

const TOPIC_SYSTEM_PROMPT = `You are BenkyoAI, an expert curriculum designer.
The user wants to add a custom topic to their learning roadmap manually.
Given a topic title and an optional list of subtopic titles, generate a structured topic with enriched subtopics.
You MUST respond with valid JSON matching the exact schema below.

JSON Schema:
{
  "summary": "String, 1-2 sentence summary of what this topic covers",
  "subtopics": [
    {
      "title": "String subtopic title (use the provided title if given, otherwise generate)",
      "explanationStub": "String, a 1-sentence hook or core rule for this subtopic",
      "estimatedMin": number // e.g. 15, 20, 30
    }
  ]
}

Guidelines:
- Use the provided subtopic titles if given; enrich them with explanationStub and estimatedMin.
- If no subtopics are given, generate 2-3 sensible subtopics for this topic.
- Keep stubs punchy and concrete.
`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { roadmapId, title, subtopicTitles } = body;

    const userPrompt = `Topic title: ${title}\nSubtopic titles: ${subtopicTitles?.length ? subtopicTitles.join(', ') : 'none provided'}`;
    const combinedPrompt = `${TOPIC_SYSTEM_PROMPT}\n\n${userPrompt}`;

    const responseText = await generateGeminiResponse(combinedPrompt, apiKey);
    const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    const topicId = uid('tp');
    const subtopics: Subtopic[] = (parsed.subtopics || []).map((s: any) => ({
      id: uid('st'),
      topicId,
      title: titleCase(s.title),
      explanationStub: s.explanationStub || '',
      mastery: 0,
      status: 'not-started' as const,
      isWeakPoint: false,
      estimatedMin: s.estimatedMin || 15,
      sessionIds: [],
    }));

    const topic: Topic = {
      id: topicId,
      roadmapId,
      title: titleCase(title),
      summary: parsed.summary || 'Added by you.',
      order: 999,
      status: 'not-started',
      mastery: 0,
      isMilestone: false,
      origin: 'manual',
      subtopics,
    };

    return NextResponse.json(topic);
  } catch (error: any) {
    console.error('Add topic API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to add topic' }, { status: 500 });
  }
}
