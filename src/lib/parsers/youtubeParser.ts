import { ParseOptions, ParseResult } from './types';

/**
 * Extract YouTube Video ID from browser URL or raw video ID.
 * Supports:
 * - https://www.youtube.com/watch?v=XYZ
 * - https://youtu.be/XYZ
 * - https://www.youtube.com/shorts/XYZ
 * - https://www.youtube.com/embed/XYZ
 * - Raw 11-character video ID
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  
  // Check if raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1);
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2];
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.split('/')[2];
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return v;
      }
    }
  } catch {
    // Not a valid URL, try regex
  }

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Main YouTube Parser implementation.
 * Delegates to server-side API route (`/api/parse/youtube`) to avoid browser CORS restrictions.
 */
export async function parseYouTube(
  input: File | string,
  options?: ParseOptions
): Promise<ParseResult> {
  const inputString = typeof input === 'string' ? input : await input.text();
  const videoId = extractYouTubeVideoId(inputString);

  if (!videoId) {
    throw new Error('Invalid YouTube URL or Video ID. Please paste a valid YouTube browser URL (e.g. https://www.youtube.com/watch?v=...).');
  }

  const response = await fetch('/api/parse/youtube', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      urlOrId: inputString,
      apiKey: options?.apiKey,
      model: options?.model,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to parse YouTube video via API.');
  }

  return data.result;
}
