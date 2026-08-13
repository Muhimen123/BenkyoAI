import { ParseOptions, ParseResult } from './types';

/**
 * PDF Document Parser (Stub / Future Implementation)
 * Will use a PDF extraction library (e.g. pdfjs-dist) or Gemini native multimodal document parsing.
 */
export async function parsePdf(
  input: File | string,
  options?: ParseOptions
): Promise<ParseResult> {
  const fileName = input instanceof File ? input.name : 'Document.pdf';
  const fileSize = input instanceof File ? input.size : 0;

  // Future implementation note:
  // 1. Read PDF array buffer from File or path
  // 2. Extract text per page using pdfjs-dist or send file to Gemini multimodal API
  // 3. Structure headings, paragraphs, and tables into clean markdown

  return {
    text: `[PDF Parser Stub]\nFile Name: ${fileName}\n\nPDF parsing is queued for future implementation. When implemented, this will parse the document layout, extract text and tables, and convert them into structured markdown study notes.`,
    title: fileName.replace(/\.[^/.]+$/, ''),
    metadata: {
      sourceType: 'pdf',
      originalName: fileName,
      size: fileSize,
      status: 'stub_pending_implementation',
      options,
    },
    warnings: ['PDF parser is currently a stub and will be fully implemented in a future update.'],
  };
}
