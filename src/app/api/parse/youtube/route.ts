import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { transcriptSections, youtubeVideoId } from '@/lib/rag/youtube';

/**
 * POST /api/parse/youtube  { url } → { title, author, sections }
 *
 * Fetches a video's title and captions (YouTube blocks both from the browser
 * by CORS) and returns them as timestamped sections for the in-browser index.
 * Stateless, no key, no AI: a video without captions is reported as such
 * rather than summarised from its title.
 */
export async function POST(request: NextRequest) {
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  const videoId = typeof url === 'string' ? youtubeVideoId(url) : null;
  if (!videoId) {
    return NextResponse.json({ message: 'Paste a YouTube link, e.g. https://www.youtube.com/watch?v=…' }, { status: 400 });
  }
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let title = `YouTube video ${videoId}`;
  let author: string | undefined;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`);
    if (res.ok) {
      const meta = (await res.json()) as { title?: string; author_name?: string };
      title = meta.title || title;
      author = meta.author_name;
    }
  } catch {
    // The title is a nicety; the captions are what matter.
  }

  // English captions first, then whatever track the video has.
  let lines: { text: string; offset: number }[] = [];
  for (const config of [{ lang: 'en' }, undefined]) {
    try {
      lines = await YoutubeTranscript.fetchTranscript(videoId, config);
      if (lines.length) break;
    } catch {
      // Try the next track.
    }
  }

  const sections = transcriptSections(lines);
  if (!sections.length) {
    return NextResponse.json(
      { message: "This video has no captions BenkyoAI can read. Try another video, or paste your notes instead." },
      { status: 422 },
    );
  }
  return NextResponse.json({ title, author, url: watchUrl, sections });
}
