import { ParseOptions, ParseResult } from './types';
import { getGeminiClient } from '../ai';
import { parseText } from './textParser';

/**
 * Extremely Resilient Multimodal PDF Parser
 * 1. Validates PDF magic bytes (%PDF-).
 * 2. Directly uploads the PDF to Gemini Files API (`ai.files.upload`) or uses inline base64 (`inlineData`),
 *    letting Gemini's native document parser handle PDFs of any structure (bypassing client-side `pdf-lib`/`pdfjs-dist` strictness).
 * 3. Falls back to client-side `pdfjs-dist` text extraction if AI processing fails or API key is not available.
 */
export async function parsePdf(
  input: File | string,
  options?: ParseOptions
): Promise<ParseResult> {
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing is only supported in browser environments.');
  }

  let file: File;
  let fileName = 'Document.pdf';

  if (typeof input === 'string') {
    return parseText(input, options);
  } else {
    file = input;
    fileName = file.name;
  }

  const arrayBuffer = await file.arrayBuffer();

  // Validate PDF magic bytes (%PDF-)
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
  const headerString = new TextDecoder().decode(headerBytes);
  if (!headerString.startsWith('%PDF')) {
    const textContent = await file.text();
    return parseText(textContent, options);
  }

  const ai = getGeminiClient(options?.apiKey);
  const model = options?.model || 'gemini-3.5-flash';
  const prompt = `You are an expert study assistant. Analyze this document "${fileName}" (including all text, tables, diagrams, and images). Extract and synthesize comprehensive Markdown study notes, key concepts, formulas, and definitions optimized for active learning and exam preparation:`;

  const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });

  // Strategy 1: Try Gemini Multimodal Direct Analysis (Inline base64 or Files API)
  try {
    // Method A: Try inline base64 data first (fast, direct)
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Data,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      if (response.text) {
        return {
          text: response.text,
          title: fileName.replace(/\.[^/.]+$/, ''),
          metadata: {
            sourceType: 'pdf',
            originalName: fileName,
            size: file.size,
            parsedWithAi: true,
            modelUsed: model,
          },
        };
      }
    } catch (inlineErr) {
      console.warn('Inline base64 PDF analysis failed, trying Gemini Files API:', inlineErr);
    }

    // Method B: Try Gemini Files API (`ai.files.upload`) with state polling
    let uploadedFile = await ai.files.upload({
      file: pdfBlob,
      mimeType: 'application/pdf',
    } as any);

    let attempts = 0;
    const fileNameToPoll = uploadedFile.name;
    while (uploadedFile.state === 'PROCESSING' && fileNameToPoll && attempts < 15) {
      await new Promise((res) => setTimeout(res, 1000));
      attempts++;
      try {
        uploadedFile = await ai.files.get({ name: fileNameToPoll });
      } catch {
        break;
      }
    }

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                fileUri: uploadedFile.uri,
                mimeType: uploadedFile.mimeType || 'application/pdf',
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    if (response.text) {
      return {
        text: response.text,
        title: fileName.replace(/\.[^/.]+$/, ''),
        metadata: {
          sourceType: 'pdf',
          originalName: fileName,
          size: file.size,
          parsedWithAi: true,
          modelUsed: model,
        },
      };
    }
  } catch (aiErr) {
    console.warn('Gemini multimodal direct PDF analysis failed. Falling back to pdfjs-dist text extraction:', aiErr);
  }

  // Strategy 2: Fallback to client-side text extraction via pdfjs-dist
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    } as any);

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const pageTexts: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: unknown) => (typeof item === 'object' && item !== null && 'str' in item ? (item as { str: string }).str : ''))
        .join(' ');
      pageTexts.push(`\n\n### Page ${i}\n${pageText}`);
    }

    const combinedRawText = pageTexts.join('\n');
    const textPrompt = `You are an expert study assistant. Read the following extracted PDF text from "${fileName}" and convert it into clean, comprehensive, well-structured Markdown study notes optimized for active learning and exam preparation:\n\n${combinedRawText}`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: textPrompt }],
        },
      ],
    });

    return {
      text: response.text || combinedRawText,
      title: fileName.replace(/\.[^/.]+$/, ''),
      metadata: {
        sourceType: 'pdf',
        originalName: fileName,
        size: file.size,
        pages: numPages,
        parsedWithAi: true,
        modelUsed: model,
      },
    };
  } catch (pdfjsErr) {
    console.warn('pdfjs-dist extraction failed, falling back to raw text:', pdfjsErr);
    const textContent = await file.text();
    return parseText(textContent, options);
  }
}
