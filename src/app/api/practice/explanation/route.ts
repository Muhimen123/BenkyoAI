import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/ai';
import { EXPLAIN_BACK_SYSTEM_PROMPT } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { subtopicId, text } = body;

    const userPrompt = `Subtopic ID: ${subtopicId}
Explanation Text: "${text || ''}"`;

    const combinedPrompt = `${EXPLAIN_BACK_SYSTEM_PROMPT}\n\n${userPrompt}`;

    const responseText = await generateGeminiResponse(combinedPrompt, apiKey);
    const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Explanation Evaluation API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to evaluate explanation' }, { status: 500 });
  }
}
