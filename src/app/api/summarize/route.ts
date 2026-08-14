import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/ai';
import { SUMMARIZE_SYSTEM_PROMPT } from '@/lib/prompts';
import { uid } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { materialIds, text, topic } = body;

    const userPrompt = `Topic: ${topic}\nMaterial Text: ${text || 'N/A'}\nMaterial IDs: ${materialIds.join(', ')}`;
    
    // We expect structured JSON output based on the system prompt.
    // So we use standard text generation with JSON prompt engineering.
    const combinedPrompt = `${SUMMARIZE_SYSTEM_PROMPT}\n\n${userPrompt}`;

    const responseText = await generateGeminiResponse(combinedPrompt, apiKey);
    
    // Attempt to parse the response as JSON.
    // Sometimes Gemini wraps JSON in markdown block.
    const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    const summary = {
      id: uid("sum"),
      title: `What your material covers on ${topic}`,
      materialIds,
      keyPoints: parsed.keyPoints || [],
      readingTimeMin: parsed.readingTimeMin || 10,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Summarize API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to summarize' }, { status: 500 });
  }
}
