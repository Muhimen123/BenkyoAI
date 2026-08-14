import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/ai';
import { ROADMAP_SYSTEM_PROMPT } from '@/lib/prompts';
import { titleCase, uid } from '@/lib/utils';
import type { Purpose, Subtopic, Topic } from '@/lib/types';

const PACING: Record<Purpose, { sessionsPerWeek: number; minutesPerSession: number; note: string }> = {
  exam: { sessionsPerWeek: 5, minutesPerSession: 35, note: "Tight cycles, heavy recall, ruthless about what's examinable." },
  project: { sessionsPerWeek: 3, minutesPerSession: 45, note: "Depth on the parts you'll actually build with, lighter elsewhere." },
  job: { sessionsPerWeek: 4, minutesPerSession: 30, note: "Front-loads the things interviewers and colleagues assume you know." },
  curiosity: { sessionsPerWeek: 2, minutesPerSession: 25, note: "Unhurried. Follows what you find interesting rather than a syllabus." },
};

function levelFromCalibration(answers: any[]) {
  if (!answers || answers.length === 0) return 2;
  const levels = answers
    .map((a) => Number(a.optionId.split(":")[1] ?? 2))
    .filter((n) => !Number.isNaN(n));
  if (!levels.length) return 2;
  return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { topic, calibration, purpose, deadline, promptOverride } = body;

    const level = levelFromCalibration(calibration);
    
    let userPrompt = `Topic: ${topic}\nPurpose: ${purpose}\nCalibration Level (1-4): ${level}\nDeadline: ${deadline || 'None'}`;
    if (promptOverride) {
      userPrompt += `\nAdditional Instructions: ${promptOverride}`;
    }

    const combinedPrompt = `${ROADMAP_SYSTEM_PROMPT}\n\n${userPrompt}`;
    const responseText = await generateGeminiResponse(combinedPrompt, apiKey);
    
    const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    const roadmapId = uid("rm");
    const now = new Date().toISOString();

    const topics: Topic[] = (parsed.topics || []).map((node: any, index: number) => {
      const subtopics: Subtopic[] = (node.subtopics || []).map((s: any) => {
        const headStart = index === 0 ? (level - 1) * 18 : index === 1 ? (level - 2) * 12 : 0;
        const mastery = Math.max(0, Math.min(85, headStart));
        return {
          id: uid("st"),
          topicId: "", // filled below
          title: s.title,
          explanationStub: s.explanationStub || s.stub || "",
          mastery,
          status: mastery >= 80 ? "mastered" : mastery > 0 ? "in-progress" : "not-started",
          isWeakPoint: false,
          estimatedMin: s.estimatedMin || s.min || 15,
          sessionIds: [],
        };
      });

      const topicId = uid("tp");
      subtopics.forEach((s) => (s.topicId = topicId));
      
      const mastery = subtopics.length > 0 
        ? Math.round(subtopics.reduce((sum, s) => sum + s.mastery, 0) / subtopics.length)
        : 0;

      return {
        id: topicId,
        roadmapId,
        title: node.title,
        summary: node.summary,
        order: index,
        status: mastery >= 80 ? "mastered" : mastery > 0 ? "in-progress" : "not-started",
        mastery,
        isMilestone: Boolean(node.isMilestone),
        origin: "ai",
        subtopics,
      };
    });

    const roadmap = {
      id: roadmapId,
      title: titleCase(topic),
      purpose: purpose || "curiosity",
      deadline,
      createdAt: now,
      updatedAt: now,
      promptOverride,
      pacing: PACING[purpose as Purpose] || PACING.curiosity,
      topics,
    };

    return NextResponse.json(roadmap);
  } catch (error: any) {
    console.error('Roadmap API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to generate roadmap' }, { status: 500 });
  }
}
