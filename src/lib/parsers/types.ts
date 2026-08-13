export type ParserType = 'text' | 'youtube' | 'pdf' | 'pptx' | 'auto';

export interface ParseOptions {
  type?: ParserType;
  apiKey?: string;
  useAiCleanup?: boolean;
  model?: string;
  [key: string]: unknown;
}

export interface ParseResult {
  text: string;
  title?: string;
  metadata?: {
    sourceType: string;
    originalName?: string;
    size?: number;
    duration?: string; // For YouTube
    pageCount?: number; // For PDF
    slideCount?: number; // For PPTX
    [key: string]: unknown;
  };
  warnings?: string[];
}

export interface ParserPlugin {
  id: ParserType;
  name: string;
  supportedExtensions: string[];
  parse: (input: File | string, options?: ParseOptions) => Promise<ParseResult>;
}
