import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/ai';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';
import { uid } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, context } = body;
    
    // Construct the context string
    let contextStr = `Roadmap Title: ${context.roadmapTitle}\nDepth: ${context.depth}`;
    if (context.subtopicTitle) {
      contextStr += `\nCurrent Subtopic: ${context.subtopicTitle}`;
    }

    // Format the conversation history
    const history = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    const userPrompt = `Context:\n${contextStr}\n\nConversation History:\n${history}\n\nASSISTANT:`;
    
    // We expect standard text output for chat.
    const combinedPrompt = `${CHAT_SYSTEM_PROMPT}\n\n${userPrompt}`;

    const responseText = await generateGeminiResponse(combinedPrompt, apiKey, 'gemini-2.5-flash');
    
    const chatMessage: ChatMessage = {
      id: uid("msg"),
      role: 'assistant',
      content: responseText.trim(),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(chatMessage);
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to chat' }, { status: 500 });
  }
}
