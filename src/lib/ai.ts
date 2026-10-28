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
 * falling back to process.env.GEMINI_API_KEY in development only, so a
 * deployed relay never spends the operator's key on a keyless request.
 */
export function getGeminiClient(apiKey?: string) {
  const devKey = process.env.NODE_ENV === 'development' ? process.env.GEMINI_API_KEY : undefined;
  const key = apiKey || devKey;
  if (!key) {
    throw new Error('Gemini API key is missing. Please provide an API key or set GEMINI_API_KEY.');
  }
  return new GoogleGenAI({ apiKey: key });
}

// ---------------------------------------------------------------------------
// Model resolution
//
// We cannot trust ai.models.list() to tell us what's callable — Google lists
// models that are "no longer available to new users" without flagging them,
// and also lists specialized non-text models (e.g. TTS, image, realtime).
// Strategy:
//   1. Filter out specialized non-text modalities (-tts, image, embedding, audio, etc.)
//   2. Score text models (prefer flash, prefer stable & higher version)
//   3. Try candidates in prioritized order on the actual request, caching the winner
// ---------------------------------------------------------------------------

/** In-process cache: key-fingerprint → verified working model name */
const modelCache = new Map<string, string>();

/** Cache discovered candidate model list to avoid listing models on every call */
const candidateListCache = new Map<string, { list: string[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

/** Check if a model is suitable for general text/JSON generation */
export function isTextGenerationModel(name: string): boolean {
  const lower = name.toLowerCase();
  if (!lower.startsWith('gemini')) return false;
  if (
    lower.includes('-tts') ||
    lower.includes('image') ||
    lower.includes('imagen') ||
    lower.includes('embedding') ||
    lower.includes('realtime') ||
    lower.includes('live') ||
    lower.includes('audio') ||
    lower.includes('robotics') ||
    lower.includes('computer-use')
  ) {
    return false;
  }
  return true;
}

/**
 * Score a model name so we can sort candidates.
 * Higher = preferred.
 */
function scoreModel(name: string): number {
  let score = 0;
  // Prefer flash (fast & cheap) over pro for most tasks
  if (name.includes('flash')) score += 10;
  if (name.includes('lite')) score -= 3; // lite is cheaper but less capable
  // Prefer higher version numbers
  const versionMatch = name.match(/gemini-(\d+(?:\.\d+)?)/);
  if (versionMatch) score += parseFloat(versionMatch[1]) * 2;
  return score;
}

/** Built-in fallback candidates in priority order */
const HARDCODED_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

/**
 * Discover and sort candidate models for this key.
 */
async function getModelCandidates(apiKey?: string, requestedModel?: string): Promise<string[]> {
  const cacheKey = apiKey ? apiKey.slice(-8) : '__env__';
  const now = Date.now();
  let baseCandidates: string[] = [];

  const cached = candidateListCache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    baseCandidates = cached.list;
  } else {
    try {
      const ai = getGeminiClient(apiKey);
      const pager = await ai.models.list();
      const listed: string[] = [];
      for await (const m of pager) {
        if (!m.name) continue;
        const clean = m.name.replace(/^models\//, '');
        if (!isTextGenerationModel(clean)) continue;
        const actions: string[] = (m as any).supportedActions ?? [];
        if (actions.length === 0 || actions.some((a: string) => a.toLowerCase().includes('generate'))) {
          listed.push(clean);
        }
      }
      baseCandidates = listed.sort((a, b) => scoreModel(b) - scoreModel(a));
      candidateListCache.set(cacheKey, { list: baseCandidates, timestamp: now });
      console.log(`[ai] Discovered text models (${baseCandidates.length}):`, baseCandidates.slice(0, 8).join(', '));
    } catch (err) {
      console.warn('[ai] Could not fetch model list, using built-in candidates:', err);
    }
  }

  const pool = [...baseCandidates];
  for (const h of HARDCODED_FALLBACKS) {
    if (!pool.includes(h)) pool.push(h);
  }

  // Priority order:
  // 1. Explicitly requested model (if any)
  // 2. Previously verified working model in cache (if any)
  // 3. Candidate pool sorted by score
  const result: string[] = [];
  if (requestedModel && isTextGenerationModel(requestedModel)) {
    result.push(requestedModel);
  }
  const working = modelCache.get(cacheKey);
  if (working && !result.includes(working)) {
    result.push(working);
  }
  for (const c of pool) {
    if (!result.includes(c)) {
      result.push(c);
    }
  }

  return result;
}

/** Returns true for transient errors where a retry may succeed */
function isTransientError(err: any): boolean {
  const status: number =
    err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.httpStatus ?? 0;
  return status === 503 || status === 429 || status === 500;
}

/** Sleep helper */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Generate a text response using Gemini.
 *
 * For each candidate model, retries transient errors (503 high demand, 429 quota)
 * with exponential backoff before moving to the next candidate. This handles
 * the common case where Gemini models experience brief demand spikes.
 */
export async function generateGeminiResponse(
  prompt: string,
  apiKey?: string,
  model?: string,
  config?: GenerateContentConfig,
): Promise<string> {
  const ai = getGeminiClient(apiKey);
  const cacheKey = apiKey ? apiKey.slice(-8) : '__env__';

  const candidates = await getModelCandidates(apiKey, model);
  let lastError: any = null;
  const tried = new Set<string>();

  for (const candidate of candidates) {
    if (tried.has(candidate)) continue;
    tried.add(candidate);

    // Each candidate gets up to 3 attempts with exponential backoff
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await ai.models.generateContent({ model: candidate, contents: prompt, config });
        recordUsage(candidate, response.usageMetadata);
        if (!response.text) throw new Error('No response text returned from Gemini.');

        // Successfully generated: cache this model for future calls
        modelCache.set(cacheKey, candidate);
        return response.text;
      } catch (err: any) {
        if (isAuthError(err)) throw err;

        lastError = err;

        if (isTransientError(err) && attempt < MAX_RETRIES - 1) {
          // Transient error: wait and retry the same model
          const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s
          console.warn(
            `[ai] Model ${candidate} transient error (${err?.status ?? '?'}), ` +
            `retry ${attempt + 1}/${MAX_RETRIES - 1} in ${delayMs}ms...`,
          );
          await sleep(delayMs);
          continue;
        }

        // Non-transient or final retry exhausted: move to next candidate
        console.warn(
          `[ai] Model ${candidate} failed after ${attempt + 1} attempt(s) ` +
          `(${err?.message?.slice(0, 80) ?? err}), trying next candidate...`,
        );

        // Bust cache if this was the cached model
        if (modelCache.get(cacheKey) === candidate) {
          modelCache.delete(cacheKey);
        }
        break; // exit retry loop, move to next candidate
      }
    }

    // Limit how many distinct models we try to avoid excessive total latency
    if (tried.size >= 8) {
      break;
    }
  }

  throw lastError ?? new Error('No working Gemini model found for this key.');
}

/** Strip markdown code blocks before parsing JSON */
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
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
  return schema.parse(JSON.parse(cleanJsonText(text)));
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
  return generateGeminiResponse(prompt, apiKey, ctx?.model);
}

export async function generateJSON<T extends z.ZodType>(
  prompt: string,
  schema: T,
  apiKey?: string,
): Promise<z.infer<T>> {
  const ctx = currentContext();
  const provider = adapterFor(ctx);
  if (!provider || !ctx || !apiKey) return generateGeminiJSON(prompt, schema, apiKey, ctx?.model);

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
        if (isTextGenerationModel(cleanName)) {
          models.push(cleanName);
        }
      }
    }
    const sorted = Array.from(new Set(models)).sort((a, b) => scoreModel(b) - scoreModel(a));
    return sorted.length > 0 ? sorted : HARDCODED_FALLBACKS;
  } catch (err) {
    console.warn('[ai] Could not fetch model list:', err);
    return HARDCODED_FALLBACKS;
  }
}
