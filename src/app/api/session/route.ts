import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import { withUsage } from '@/lib/usage';
import { SessionSummarySchema } from '@/lib/schemas';
import { SESSION_SUMMARY_SYSTEM_PROMPT } from '@/lib/prompts';
import { uid } from '@/lib/utils';
import type { MistakeType, GrowthCallout } from '@/lib/types';

export const POST = withUsage(async (request: NextRequest) => {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { session, roadmap, answered = [] } = body;

    const lookup = new Map<string, { title: string; mastery: number }>(
      roadmap.topics.flatMap((t: any) =>
        t.subtopics.map((s: any) => [s.id, { title: s.title, mastery: s.mastery }]),
      ),
    );
    const seen = [...new Set(answered.map((a: any) => a.subtopicId))] as string[];
    const endedAt = new Date().toISOString();
    const durationMin = Math.max(
      1,
      Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000),
    );

    const struggled = answered
      .filter((a: any) => !a.correct)
      .map((a: any) => ({
        subtopicId: a.subtopicId,
        title: lookup.get(a.subtopicId)?.title ?? "Untitled",
        mistakeType: a.mistakeType ?? ("misunderstanding" as MistakeType),
      }));

    const understood = seen
      .filter((id) => answered.filter((a: any) => a.subtopicId === id).every((a: any) => a.correct))
      .map((id) => ({
        subtopicId: id,
        title: lookup.get(id)?.title ?? "Untitled",
        mastery: lookup.get(id)?.mastery ?? 0,
      }));

    const nextSub = roadmap.topics
      .flatMap((t: any) => t.subtopics)
      .find((s: any) => s.status === "not-started" && !seen.includes(s.id));

    // Prompt Gemini for Socratic growth callouts, carryOver, and nextUp details
    const userPrompt = `Roadmap: ${roadmap.title}
Covered today: ${JSON.stringify(seen.map(id => lookup.get(id)?.title))}
Struggled subtopics: ${JSON.stringify(struggled)}
Understood subtopics: ${JSON.stringify(understood)}
Next subtopic in sequence: ${nextSub ? nextSub.title : 'None'}
Answered details: ${JSON.stringify(answered)}`;

    const combinedPrompt = `${SESSION_SUMMARY_SYSTEM_PROMPT}\n\n${userPrompt}`;

    let growth: GrowthCallout[] = [];
    let nextUp = nextSub ? {
      subtopicId: nextSub.id,
      title: nextSub.title,
      reason: struggled.length ? "Comes with a short refresher on what tripped you up today." : "Next step on the roadmap.",
    } : undefined;
    let carryOver = struggled[0] ? {
      subtopicId: struggled[0].subtopicId,
      question: `Last time ${struggled[0].title.toLowerCase()} didn't hold. Does it now?`,
    } : undefined;

    try {
      const parsed = await generateJSON(combinedPrompt, SessionSummarySchema, apiKey);

      if (parsed.growth) {
        growth = parsed.growth.map((g: any) => ({
          id: uid("gc"),
          title: g.title,
          detail: g.detail,
          previousMistakeType: "misunderstanding" as MistakeType,
        }));
      }

      if (parsed.nextUp) {
        nextUp = {
          subtopicId: parsed.nextUp.subtopicId || nextUp?.subtopicId || '',
          title: parsed.nextUp.title || nextUp?.title || '',
          reason: parsed.nextUp.reason || nextUp?.reason || '',
        };
      }

      if (parsed.carryOver) {
        carryOver = {
          subtopicId: parsed.carryOver.subtopicId || carryOver?.subtopicId || '',
          question: parsed.carryOver.question || carryOver?.question || '',
        };
      }
    } catch (e) {
      console.warn('Failed to parse Gemini session summary, falling back to heuristics:', e);
      // Fallback is already initialized above
    }

    return NextResponse.json({
      sessionId: session.id,
      roadmapId: roadmap.id,
      startedAt: session.startedAt,
      endedAt,
      durationMin,
      covered: seen.map((id) => ({
        subtopicId: id,
        title: lookup.get(id)?.title ?? "Untitled",
      })),
      struggled,
      understood,
      growth,
      nextUp,
      carryOver,
    });
  } catch (error: any) {
    console.error('Session summary API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to summarize session' }, { status: 500 });
  }
});
