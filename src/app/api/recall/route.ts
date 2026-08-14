import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/ai';
import { RECALL_SYSTEM_PROMPT } from '@/lib/prompts';
import { uid } from '@/lib/utils';
import type { RecallItem, RecallMode } from '@/lib/types';

const REASON_ORDER = ["previous-mistake", "unresolved", "spaced-review"] as const;

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, scope, roadmap } = body;

    const pairs = roadmap.topics.flatMap((t: any) =>
      t.subtopics.map((s: any) => ({ sub: s, topicTitle: t.title, topicId: t.id })),
    );
    const touched = pairs.filter((p: any) => p.sub.status !== "not-started");

    let selected = touched;
    let scopeLabel = "Everything in your vault";

    if (mode === "milestone-wise") {
      const milestoneIndex = roadmap.topics.findIndex((t: any) => t.id === scope);
      const cutoff = milestoneIndex === -1 ? roadmap.topics.length : milestoneIndex + 1;
      const ids = new Set(roadmap.topics.slice(0, cutoff).map((t: any) => t.id));
      selected = touched.filter((p: any) => ids.has(p.topicId));
      scopeLabel = `Up to ${roadmap.topics[Math.max(0, cutoff - 1)]?.title ?? "your first milestone"}`;
    } else if (mode === "session-wise") {
      selected = touched
        .filter((p: any) => p.sub.isWeakPoint || p.sub.status === "in-progress")
        .slice(0, 6);
      scopeLabel = "Your last session, plus what was left unresolved";
    }

    const ordered = [...selected].sort((a, b) => {
      const rA = a.sub.isWeakPoint ? "previous-mistake" : a.sub.status === "in-progress" ? "unresolved" : "spaced-review";
      const rB = b.sub.isWeakPoint ? "previous-mistake" : b.sub.status === "in-progress" ? "unresolved" : "spaced-review";
      return REASON_ORDER.indexOf(rA) - REASON_ORDER.indexOf(rB);
    });

    const limit = mode === "exam-night" ? 12 : 6;
    const subtopicsToRecall = ordered.slice(0, limit);

    if (subtopicsToRecall.length === 0) {
      return NextResponse.json({
        mode,
        scopeLabel,
        items: [],
        vaultCoverage: { covered: 0, total: pairs.length },
      });
    }

    // Call Gemini to generate active recall questions for these subtopics
    const userPrompt = `Recall Mode: ${mode}
Subtopics to recall: ${JSON.stringify(
      subtopicsToRecall.map((s) => ({
        id: s.sub.id,
        title: s.sub.title,
        topicTitle: s.topicTitle,
      }))
    )}`;

    const combinedPrompt = `${RECALL_SYSTEM_PROMPT}\n\n${userPrompt}`;
    const responseText = await generateGeminiResponse(combinedPrompt, apiKey);
    const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    const questionsMap = new Map<string, any>(
      (parsed.questions || []).map((q: any) => [q.subtopicId, q])
    );

    const items: RecallItem[] = subtopicsToRecall.map((p, index) => {
      const q = questionsMap.get(p.sub.id) || {
        kind: 'short',
        prompt: `Without looking: explain the core rule or mechanism of ${p.sub.title.toLowerCase()}.`,
      };

      const reason = p.sub.isWeakPoint
        ? "previous-mistake"
        : p.sub.status === "in-progress"
          ? "unresolved"
          : "spaced-review";

      const itemId = uid("rc");

      if (q.kind === 'mcq' && q.options) {
        const correctSuffix = uid("opt");
        const options = q.options.map((o: any) => {
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
          id: itemId,
          prompt: q.prompt,
          sourceSubtopicId: p.sub.id,
          sourceLabel: `${p.topicTitle} · ${p.sub.title}`,
          reason,
          kind: "mcq",
          options: shuffled,
        };
      } else {
        return {
          id: itemId,
          prompt: q.prompt,
          sourceSubtopicId: p.sub.id,
          sourceLabel: `${p.topicTitle} · ${p.sub.title}`,
          reason,
          kind: "short",
        };
      }
    });

    return NextResponse.json({
      mode,
      scopeLabel,
      items,
      vaultCoverage: { covered: items.length, total: pairs.length },
    });
  } catch (error: any) {
    console.error('Active Recall Queue API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to generate recall queue' }, { status: 500 });
  }
}
