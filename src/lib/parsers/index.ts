import { ParseOptions, ParseResult, ParserType } from './types';
import { parseText } from './textParser';
import { parseYouTube } from './youtubeParser';
import { parsePdf } from './pdfParser';
import { parsePptx } from './pptxParser';

export * from './types';
export { parseText } from './textParser';
export { parseYouTube } from './youtubeParser';
export { parsePdf } from './pdfParser';
export { parsePptx } from './pptxParser';

/**
 * Detect parser type automatically based on input file name, content, or URL pattern.
 */
export function detectParserType(input: File | string): ParserType {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    // Check if YouTube URL
    if (
      trimmed.includes('youtube.com/') ||
      trimmed.includes('youtu.be/') ||
      (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed))
    ) {
      return 'youtube';
    }
    return 'text';
  }

  if (input instanceof File) {
    const name = input.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.pptx') || name.endsWith('.ppt')) return 'pptx';
    if (
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      name.endsWith('.markdown') ||
      name.endsWith('.csv') ||
      name.endsWith('.json') ||
      name.endsWith('.html') ||
      name.endsWith('.js') ||
      name.endsWith('.ts')
    ) {
      return 'text';
    }
    // Default fallback for unknown file types
    return 'text';
  }

  return 'text';
}

/**
 * Main entry point to parse any supported material input into standardized study text.
 */
export async function parseMaterial(
  input: File | string,
  options?: ParseOptions
): Promise<ParseResult> {
  const parserType = options?.type && options.type !== 'auto' 
    ? options.type 
    : detectParserType(input);

  switch (parserType) {
    case 'youtube':
      return await parseYouTube(input, options);
    case 'pdf':
      return await parsePdf(input, options);
    case 'pptx':
      return await parsePptx(input, options);
    case 'text':
    default:
      return await parseText(input, options);
  }
}
