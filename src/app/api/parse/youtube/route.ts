import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId } from '@/lib/parsers/youtubeParser';
import { YoutubeTranscript } from 'youtube-transcript';
import { getGeminiClient } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urlOrId, apiKey, model: clientModel } = body;

    if (!urlOrId) {
      return NextResponse.json({ success: false, error: 'Missing YouTube URL or Video ID' }, { status: 400 });
    }

    const videoId = extractYouTubeVideoId(urlOrId);
    if (!videoId) {
      return NextResponse.json({ success: false, error: 'Invalid YouTube URL or Video ID.' }, { status: 400 });
    }

    const warnings: string[] = [];

    // 1. Fetch oEmbed metadata (Title, Author, Thumbnail)
    let title = `YouTube Video (${videoId})`;
    let author = 'Unknown Channel';
    let thumbnail: string | undefined;

    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || title;
        author = oembedData.author_name || author;
        thumbnail = oembedData.thumbnail_url;
      }
    } catch (e) {
      console.warn('Server-side oEmbed fetch error:', e);
    }

    // 2. Fetch transcript using youtube-transcript package
    let sourceText = '';
    let transcriptFetched = false;
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      if (Array.isArray(transcriptItems) && transcriptItems.length > 0) {
        const lines = transcriptItems.map((item) => {
          const startSec = item.offset / 1000;
          const mins = Math.floor(startSec / 60);
          const secs = Math.floor(startSec % 60);
          const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          return `[${timeStr}] ${item.text}`;
        });
        sourceText = lines.join('\n');
        transcriptFetched = true;
      }
    } catch (e: any) {
      console.warn('youtube-transcript fetch error:', e);
      warnings.push(`Transcript extraction failed: ${e.message || String(e)}. Captions may be disabled or restricted.`);
    }

    // 3. AI Fallback if transcript could not be fetched
    if (!sourceText) {
      warnings.push('Transcript unavailable. Falling back to Gemini AI educational video explanation based on title and metadata.');
      try {
        const ai = getGeminiClient(apiKey);
        const model = clientModel || 'gemini-3.5-flash';

        const prompt = `You are an expert study assistant. A user wants a summary for a YouTube video titled "${title}" by "${author}" (Video ID: ${videoId}, URL: https://www.youtube.com/watch?v=${videoId}), but direct transcript extraction was unavailable because captions are disabled or restricted.

Please provide a comprehensive educational explanation and overview of what this video likely covers based on its title and author.`;

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        });

        if (response.text) {
          sourceText = response.text;
        }
      } catch (aiErr: any) {
        console.warn('Gemini AI fallback generation failed:', aiErr);
        warnings.push(`AI fallback generation failed: ${aiErr.message || String(aiErr)}.`);
      }
    }

    if (!sourceText) {
      sourceText = `[YouTube Video: ${title}]\nChannel: ${author}\nURL: https://www.youtube.com/watch?v=${videoId}\n\n(Transcript and AI explanation could not be retrieved.)`;
    }

    // 4. Final Descriptive Document Summary Layer
    // Turns the transcript (or fallback) into a comprehensive, descriptive document summary of what was talked about.
    let finalSummaryText = sourceText;
    let parsedWithAi = false;

    try {
      const ai = getGeminiClient(apiKey);
      const model = clientModel || 'gemini-3.5-flash';

      const summaryPrompt = `You are an expert document summarizer. Analyze the following content/transcript from the YouTube video "${title}" by "${author}" (URL: https://www.youtube.com/watch?v=${videoId}):
---
${sourceText}
---

Please provide a comprehensive, highly descriptive document summary of what was talked about in the video. 
Be thorough, detailed, and clear. Explain the narrative, discussions, arguments, and key points in depth. 
Do not format as quiz questions, flashcards, or study notes — instead, provide a rich, cohesive, and descriptive narrative summary of the video content.`;

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: summaryPrompt }],
          },
        ],
      });

      if (response.text) {
        finalSummaryText = response.text;
        parsedWithAi = true;
      }
    } catch (summaryErr: any) {
      console.warn('Document summary generation layer failed, falling back to raw source text:', summaryErr);
      warnings.push(`Document summary generation failed: ${summaryErr.message || String(summaryErr)}. Returning raw content.`);
    }

    return NextResponse.json({
      success: true,
      result: {
        text: finalSummaryText,
        title,
        metadata: {
          sourceType: 'youtube',
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          author,
          thumbnail,
          parsedWithAi,
          transcriptFetched,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    });
  } catch (error: any) {
    console.error('YouTube API parse error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse YouTube video.' },
      { status: 500 }
    );
  }
}
