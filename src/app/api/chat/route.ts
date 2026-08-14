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

    // 1. Check if it's getExplanation (depth is present)
    if (body.depth) {
      const { title, stub, depth } = body;
      const prompt = `You are a Socratic tutor explaining the subtopic "${title}".
The core stub is: "${stub}".
Explain this subtopic in detail at the chosen depth: "${depth}".
- brief: 1-2 paragraphs of core explanation.
- balanced: 2-3 paragraphs, including a brief walkthrough or worked example of the concept.
- deep: 3-4 paragraphs, explaining underlying mechanics, first principles, and connections to other concepts.

Your output MUST be a JSON array of paragraphs (strings). Do NOT wrap the JSON in markdown formatting blocks, or if you do, output only valid JSON: e.g. ["paragraph 1", "paragraph 2", ...]. Ensure the strings are properly escaped.`;
      
      const responseText = await generateGeminiResponse(prompt, apiKey);
      const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(jsonString);
      return NextResponse.json(parsed);
    }

    // 2. Check if it's reexplain (mode is present)
    if (body.mode) {
      const { title, mode } = body;
      const prompt = `Provide an alternative explanation paragraph for the subtopic "${title}".
The explanation focus/style must be: "${mode}".
- simpler: Explain it in extremely simple terms, stripping away jargon.
- deeper: Explain the underlying mechanics and arguments down to the first principles.
- differently: Provide a different angle or analogy, starting from a case where the rule/concept fails.

Respond with a single string containing only the explanation paragraph.`;

      const responseText = await generateGeminiResponse(prompt, apiKey);
      return NextResponse.json(responseText.trim());
    }

    // 3. Regular chat message
    const { messages, context } = body;
    if (!messages || !context) {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }
    
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

    const responseText = await generateGeminiResponse(combinedPrompt, apiKey);
    
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
