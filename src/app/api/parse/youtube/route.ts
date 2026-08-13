import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId } from '@/lib/parsers/youtubeParser';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urlOrId } = body;

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
    let transcriptText = '';
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
        transcriptText = lines.join('\n');
      }
    } catch (e: any) {
      console.warn('youtube-transcript fetch error:', e);
      warnings.push(`Transcript extraction failed: ${e.message || String(e)}. Captions may be disabled or restricted.`);
    }

    if (!transcriptText) {
      transcriptText = `[YouTube Video: ${title}]\nChannel: ${author}\nURL: https://www.youtube.com/watch?v=${videoId}\n\n(Transcript could not be automatically retrieved using youtube-transcript package. Captions may be disabled, private, or auto-generated only.)`;
    }

    return NextResponse.json({
      success: true,
      result: {
        text: transcriptText,
        title,
        metadata: {
          sourceType: 'youtube',
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          author,
          thumbnail,
          parsedWithAi: false,
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
