import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/ai';

const EMBEDDING_MODEL = 'gemini-embedding-001';
/** 768 dimensions keeps the in-browser index small with little loss in recall. */
const DIMENSIONS = 768;
const BATCH = 50;

/**
 * POST /api/embed — embeds chunks of the learner's material (or a search
 * query) with the learner's own key. Stateless: vectors go straight back to
 * the browser, where the index lives.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-provider-key');
    if (!apiKey) {
      return NextResponse.json({ message: 'Missing API key' }, { status: 401 });
    }
    // Embeddings come from Gemini; never send another provider's key to Google.
    const provider = request.headers.get('x-provider') ?? 'google';
    if (provider !== 'google') {
      return NextResponse.json({ message: 'Semantic search needs a Gemini key' }, { status: 422 });
    }

    const { texts, task } = (await request.json()) as { texts: string[]; task: 'document' | 'query' };
    if (!Array.isArray(texts) || !texts.length) {
      return NextResponse.json({ message: 'Nothing to embed' }, { status: 400 });
    }

    const ai = getGeminiClient(apiKey);
    const embeddings: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH) {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts.slice(i, i + BATCH),
        config: {
          taskType: task === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
          outputDimensionality: DIMENSIONS,
        },
      });
      for (const e of response.embeddings ?? []) embeddings.push(e.values ?? []);
    }

    return NextResponse.json({ model: EMBEDDING_MODEL, embeddings });
  } catch (error) {
    console.error('Embed API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to embed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
