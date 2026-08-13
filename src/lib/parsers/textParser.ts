import { ParseOptions, ParseResult } from './types';
import { generateGeminiResponse } from '../ai';

export async function parseText(
  input: File | string,
  options?: ParseOptions
): Promise<ParseResult> {
  let rawText = '';
  let fileName = 'Untitled Document';
  let fileSize = 0;

  if (typeof input === 'string') {
    rawText = input;
    fileName = 'Pasted Text';
    fileSize = new Blob([input]).size;
  } else if (input instanceof File) {
    fileName = input.name;
    fileSize = input.size;
    rawText = await input.text();
  }

  let finalContent = rawText;

  // Optional AI cleanup / structuring if requested
  if (options?.useAiCleanup && rawText.trim().length > 0) {
    try {
      const prompt = `You are an expert study material preprocessor. Clean up the following raw text document, fixing any OCR artifacts, broken line breaks, or formatting issues while preserving all educational and informational content. Return clean, well-formatted Markdown:\n\n---\n${rawText}\n---`;
      finalContent = await generateGeminiResponse(
        prompt,
        options.apiKey,
        options.model || 'gemini-3.5-flash-lite'
      );
    } catch (err) {
      console.warn('AI cleanup failed, falling back to raw text:', err);
    }
  }

  return {
    text: finalContent,
    title: fileName.replace(/\.[^/.]+$/, ''),
    metadata: {
      sourceType: 'text',
      originalName: fileName,
      size: fileSize,
    },
  };
}
