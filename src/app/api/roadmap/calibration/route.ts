import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const t = body.topic?.trim() || "this topic";

    const questions = [
      {
        id: "q_seen",
        prompt: `How much of ${t} have you met before?`,
        options: [
          { id: "q_seen:1", label: "First time — start me at zero", level: 1 },
          { id: "q_seen:2", label: "I've read around it a bit", level: 2 },
          { id: "q_seen:3", label: "I studied it before and it faded", level: 3 },
          { id: "q_seen:4", label: "I'm actively studying it now", level: 4 },
        ],
      },
      {
        id: "q_solo",
        prompt: "Handed a typical problem in this area, what happens?",
        options: [
          { id: "q_solo:1", label: "I wouldn't know where to start", level: 1 },
          { id: "q_solo:2", label: "I'd need the notes open", level: 2 },
          { id: "q_solo:3", label: "I'd get most of the way", level: 3 },
          { id: "q_solo:4", label: "I'd finish it and check my work", level: 4 },
        ],
      },
      {
        id: "q_explain",
        prompt: "Could you explain the main idea to a classmate right now?",
        options: [
          { id: "q_explain:1", label: "Not yet", level: 1 },
          { id: "q_explain:2", label: "Roughly, with gaps", level: 2 },
          { id: "q_explain:3", label: "Yes, if they didn't push back", level: 3 },
          { id: "q_explain:4", label: "Yes, including the awkward questions", level: 4 },
        ],
      },
    ];

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Calibration API error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch calibration questions' },
      { status: 500 }
    );
  }
}
