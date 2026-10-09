import { GoogleGenAI, type GenerateContentConfig } from '@google/genai';
import { z } from 'zod';
import { callAdapter, type AdapterProvider } from './providerAdapters';

// ---------------------------------------------------------------------------
// Token usage
//
// Every Gemini response carries usageMetadata. `lib/usage.ts` (server only)
// opens a per-request collector around each route; this module reports into
// it through a global handle, because ai.ts is also bundled for the browser
// and must not import Node APIs itself.
// ---------------------------------------------------------------------------

export interface UsageRecord {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/** Per-request state opened by `withUsage` in lib/usage.ts. */
export interface RequestContext {
  usage: UsageRecord[];
  provider: string;
  model?: string;
}

interface UsageMetadataLike {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
}

function currentContext(): RequestContext | undefined {
  return (globalThis as { __benkyoContext?: { getStore(): RequestContext | undefined } }).__benkyoContext?.getStore();
}

export function recordUsage(model: string, meta?: UsageMetadataLike) {
  const records = currentContext()?.usage;
  if (!records || !meta) return;
  records.push({
    provider: 'google',
    model,
    inputTokens: meta.promptTokenCount ?? 0,
    // Thinking tokens are billed as output.
    outputTokens: (meta.candidatesTokenCount ?? 0) + (meta.thoughtsTokenCount ?? 0),
  });
}

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

// ---------------------------------------------------------------------------
// Model resolution
//
// We cannot trust ai.models.list() to tell us what's callable — Google lists
// models that are "no longer available to new users" without flagging them.
// Strategy:
//   1. Fetch the model list and filter by supportedActions includes generateContent
//   2. Score each model (prefer flash, prefer higher version)
//   3. Try them in order until one responds — cache that winner
// ---------------------------------------------------------------------------

/** In-process cache: key-fingerprint → verified working model name */
const modelCache = new Map<string, string>();

/** Returns true for HTTP errors that definitely mean "wrong key" */
function isAuthError(err: any): boolean {
  const status: number =
    err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.httpStatus ?? 0;
  const msg = (err?.message ?? '').toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    (status === 400 && (msg.includes('api_key_invalid') || msg.includes('api key not valid')))
  );
}

/** Returns true when a model exists in the list but is not callable */
function isModelGone(err: any): boolean {
  const status: number =
    err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.httpStatus ?? 0;
  const msg = (err?.message ?? '').toLowerCase();
  return (
    status === 404 ||
    msg.includes('no longer available') ||
    msg.includes('not found') ||
    msg.includes('deprecated')
  );
}

/**
 * Score a model name so we can sort candidates.
 * Higher = preferred.
 */
function scoreModel(name: string): number {
  let score = 0;
  // Prefer flash (fast & cheap) over pro for most tasks
  if (name.includes('flash')) score += 10;
  if (name.includes('lite')) score -= 3;   // lite is cheaper but less capable
  // Prefer higher version numbers
  const versionMatch = name.match(/gemini-(\d+(?:\.\d+)?)/);
  if (versionMatch) score += parseFloat(versionMatch[1]) * 2;
  return score;
}

/**
 * Discover and verify the best working model for this key.
 * Results are cached for the process lifetime.
 */
async function resolveWorkingModel(apiKey?: string): Promise<string> {
  const cacheKey = apiKey ? apiKey.slice(-8) : '__env__';
  const cached = modelCache.get(cacheKey);
  if (cached) return cached;

  const ai = getGeminiClient(apiKey);

  // Step 1: Get the model list and filter to those that say they support generateContent
  let candidates: string[] = [];
  try {
    const pager = await ai.models.list();
    const listed: string[] = [];
    for await (const m of pager) {
      if (!m.name) continue;
      const clean = m.name.replace(/^models\//, '');
      if (!clean.startsWith('gemini')) continue;
      // Only include if supportedActions lists generateContent (or if field is absent)
      const actions: string[] = (m as any).supportedActions ?? [];
      if (actions.length === 0 || actions.some((a: string) => a.toLowerCase().includes('generate'))) {
        listed.push(clean);
      }
    }
    // Sort: highest score first
    candidates = listed.sort((a, b) => scoreModel(b) - scoreModel(a));
    console.log(`[ai] Models from API (${candidates.length}):`, candidates.slice(0, 8).join(', '));
  } catch (err) {
    console.warn('[ai] Could not fetch model list, using built-in candidates:', err);
  }

  // Step 2: Append hardcoded fallbacks that aren't already in the list
  const hardcoded = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ];
  for (const h of hardcoded) {
    if (!candidates.includes(h)) candidates.push(h);
  }

  // Step 3: Try each candidate until one actually works
  for (const candidate of candidates) {
    try {
      const probe = await ai.models.generateContent({ model: candidate, contents: 'hi' });
      recordUsage(candidate, probe.usageMetadata);
      console.log(`[ai] ✓ Working model found: ${candidate}`);
      modelCache.set(cacheKey, candidate);
      return candidate;
    } catch (err: any) {
      if (isAuthError(err)) throw err;   // Key is wrong — stop immediately
      if (isModelGone(err)) {
        console.log(`[ai] ✗ ${candidate}: unavailable`);
        continue;
      }
      // Rate limit / network — model may still work, try next anyway
      console.warn(`[ai] ? ${candidate}: ${err?.message?.slice(0, 60)}`);
    }
  }

  throw new Error(
    'No working Gemini model found for this key. ' +
    'Ensure the Gemini API is enabled for your project at ' +
    'https://aistudio.google.com/apikey and your key has the correct permissions.',
  );
}

/**
 * Generate a text response using Gemini.
 *
 * The model parameter is a hint — if the specified model 404s, the function
 * automatically discovers a working one and retries exactly once.
 */
export async function generateGeminiResponse(
  prompt: string,
  apiKey?: string,
  model?: string,
  config?: GenerateContentConfig,
): Promise<string> {
  const ai = getGeminiClient(apiKey);
  const cacheKey = apiKey ? apiKey.slice(-8) : '__env__';

  const firstModel = model ?? await resolveWorkingModel(apiKey);

  async function attempt(m: string): Promise<string> {
    const response = await ai.models.generateContent({ model: m, contents: prompt, config });
    recordUsage(m, response.usageMetadata);
    if (!response.text) throw new Error('No response text returned from Gemini.');
    return response.text;
  }

  try {
    return await attempt(firstModel);
  } catch (err: any) {
    if (isAuthError(err)) throw err;
    // Model failed or retired (e.g. 503 high demand, 429, or 404) — bust cache and resolve a new one
    console.warn(`[ai] Model ${firstModel} failed (${err?.message?.slice(0, 80)}), re-resolving fallback…`);
    modelCache.delete(cacheKey);
    const fallback = await resolveWorkingModel(apiKey);
    return attempt(fallback);
  }
}

/**
 * Generate a structured response that matches `schema`.
 *
 * The schema is sent to Gemini as JSON Schema so the model is constrained at
 * generation time (no markdown fences, no prose), then the reply is validated
 * with Zod. A reply that doesn't match throws instead of reaching the UI.
 */
export async function generateGeminiJSON<T extends z.ZodType>(
  prompt: string,
  schema: T,
  apiKey?: string,
  model?: string,
): Promise<z.infer<T>> {
  // `$schema` is not among the keywords Gemini supports, so strip it before sending.
  const responseJsonSchema: Record<string, unknown> = z.toJSONSchema(schema);
  delete responseJsonSchema.$schema;
  const text = await generateGeminiResponse(prompt, apiKey, model, {
    responseMimeType: 'application/json',
    responseJsonSchema,
  });
  return schema.parse(JSON.parse(text));
}

// ---------------------------------------------------------------------------
// Provider dispatch
//
// Routes call generateText / generateJSON. Gemini stays the default path (with
// model discovery and fallback); a request whose x-provider header names
// OpenAI, Anthropic or a local Ollama server goes to that provider instead.
// ---------------------------------------------------------------------------

function adapterFor(ctx?: RequestContext): AdapterProvider | null {
  const p = ctx?.provider;
  return p === 'openai' || p === 'anthropic' || p === 'ollama' ? p : null;
}

async function viaAdapter(
  provider: AdapterProvider,
  ctx: RequestContext,
  credential: string,
  prompt: string,
  schema?: Record<string, unknown>,
) {
  const result = await callAdapter(provider, credential, ctx.model, prompt, schema);
  ctx.usage.push({
    provider,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });
  if (!result.text) throw new Error('No response text returned from the provider.');
  return result.text;
}

export async function generateText(prompt: string, apiKey?: string): Promise<string> {
  const ctx = currentContext();
  const provider = adapterFor(ctx);
  if (provider && ctx && apiKey) return viaAdapter(provider, ctx, apiKey, prompt);
  return generateGeminiResponse(prompt, apiKey);
}

export async function generateJSON<T extends z.ZodType>(
  prompt: string,
  schema: T,
  apiKey?: string,
): Promise<z.infer<T>> {
  const ctx = currentContext();
  const provider = adapterFor(ctx);
  if (!provider || !ctx || !apiKey) return generateGeminiJSON(prompt, schema, apiKey);

  // OpenAI, Anthropic tool inputs and Ollama all want an object at the root,
  // so array-shaped contracts travel wrapped as { result: [...] }.
  const jsonSchema: Record<string, unknown> = z.toJSONSchema(schema);
  delete jsonSchema.$schema;
  const wrapped = jsonSchema.type !== 'object';
  const sent = wrapped
    ? { type: 'object', properties: { result: jsonSchema }, required: ['result'] }
    : jsonSchema;
  const parsed = JSON.parse(await viaAdapter(provider, ctx, apiKey, prompt, sent));
  return schema.parse(wrapped ? parsed.result : parsed);
}

/**
 * List available Gemini models for this key (used by the model picker UI).
 */
export async function listGeminiModels(apiKey?: string): Promise<string[]> {
  try {
    const ai = getGeminiClient(apiKey);
    const pager = await ai.models.list();
    const models: string[] = [];
    for await (const m of pager) {
      if (m.name) {
        const cleanName = m.name.replace(/^models\//, '');
        if (cleanName.startsWith('gemini')) models.push(cleanName);
      }
    }
    return models.length > 0 ? Array.from(new Set(models)) : [];
  } catch (err) {
    console.warn('[ai] Could not fetch model list:', err);
    return [];
  }
}
