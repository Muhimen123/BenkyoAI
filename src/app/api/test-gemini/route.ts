import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/ai';
import { withUsage } from '@/lib/usage';

export const POST = withUsage(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const prompt = body.prompt || 'hello';
    const apiKey = body.apiKey;
    const model = body.model || 'gemini-2.5-flash';

    const result = await generateGeminiResponse(prompt, apiKey, model);

    return NextResponse.json({ success: true, response: result });
  } catch (error: any) {
    console.error('Gemini test API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to communicate with Gemini API' },
      { status: 500 }
    );
  }
});
