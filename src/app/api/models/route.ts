import { NextRequest, NextResponse } from 'next/server';
import { listGeminiModels } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    let apiKey: string | undefined;
    try {
      const body = await request.json();
      apiKey = body.apiKey;
    } catch {
      // No body or invalid JSON, will fall back to env key
    }

    const models = await listGeminiModels(apiKey);
    return NextResponse.json({ success: true, models });
  } catch (error: any) {
    console.error('List models API error:', error);
    return NextResponse.json(
      {
        success: true,
        models: [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
        ],
        warning: error.message,
      }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('apiKey') || undefined;

  try {
    const models = await listGeminiModels(apiKey);
    return NextResponse.json({ success: true, models });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      models: [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ],
    });
  }
}
