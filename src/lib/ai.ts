import { GoogleGenAI } from '@google/genai';

/**
 * Get an initialized GoogleGenAI client instance.
 * Accepts an optional dynamic apiKey (e.g. from client local storage),
 * falling back to process.env.GEMINI_API_KEY.
 */
export function getGeminiClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key is missing. Please provide an API key or set GEMINI_API_KEY.');
  }
  return new GoogleGenAI({ apiKey: key });
}

/**
 * Generate a text response using Gemini.
 */
export async function generateGeminiResponse(prompt: string, apiKey?: string): Promise<string> {
  const ai = getGeminiClient(apiKey);
  // Defaulting to gemini-2.5-flash (or gemini-1.5-flash)
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
  });
  
  if (!response.text) {
    throw new Error('No response text returned from Gemini.');
  }
  
  return response.text;
}
