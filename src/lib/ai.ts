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
export async function generateGeminiResponse(
  prompt: string,
  apiKey?: string,
  model: string = 'gemini-3.5-flash-lite'
): Promise<string> {
  const ai = getGeminiClient(apiKey);
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  
  if (!response.text) {
    throw new Error('No response text returned from Gemini.');
  }
  
  return response.text;
}

/**
 * List available Gemini 3 family models. Falls back to standard Gemini 3 models if API call fails or key is missing.
 */
export async function listGeminiModels(apiKey?: string): Promise<string[]> {
  const fallbackModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
  ];

  try {
    const ai = getGeminiClient(apiKey);
    const pager = await ai.models.list();
    const models: string[] = [];
    
    for await (const m of pager) {
      if (m.name) {
        const cleanName = m.name.replace(/^models\//, '');
        // Filter strictly for Gemini 3 family models
        if (cleanName.includes('gemini-3')) {
          models.push(cleanName);
        }
      }
    }

    if (models.length === 0) {
      return fallbackModels;
    }

    return Array.from(new Set(models));
  } catch (error) {
    console.warn('Could not fetch dynamic model list from Gemini API, using defaults:', error);
    return fallbackModels;
  }
}
