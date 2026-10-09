import { ParseOptions, ParseResult } from './types';
import { extractPptx } from '../rag/extract';

/**
 * PowerPoint (.pptx) parser: reads the slide XML straight out of the archive
 * in the browser and returns the visible text, one section per slide.
 */
export async function parsePptx(
  input: File | string,
  options?: ParseOptions
): Promise<ParseResult> {
  if (typeof input === 'string') {
    return { text: input, metadata: { sourceType: 'pptx', options } };
  }

  const slides = await extractPptx(await input.arrayBuffer());
  return {
    text: slides.map((s) => `### ${s.location}\n${s.text}`).join('\n\n'),
    title: input.name.replace(/\.[^/.]+$/, ''),
    metadata: {
      sourceType: 'pptx',
      originalName: input.name,
      size: input.size,
      slideCount: slides.length,
    },
    warnings: slides.length ? undefined : ['No slide text found (the deck may be images only).'],
  };
}
