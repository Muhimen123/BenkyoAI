/**
 * Non-Gemini providers, called over their plain REST APIs.
 *
 * Every adapter takes the same prompt and (optionally) a JSON Schema, and
 * returns the raw text plus token usage. Structured output uses each
 * provider's native mechanism: OpenAI `response_format: json_schema`,
 * Anthropic a forced tool call whose input schema is the contract, and Ollama
 * the `format` field. The caller validates the result with Zod either way.
 */

export type AdapterProvider = 'openai' | 'anthropic' | 'ollama';

export interface AdapterResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export const DEFAULT_MODELS: Record<AdapterProvider, string> = {
  openai: 'gpt-5-mini',
  anthropic: 'claude-haiku-5-5',
  ollama: 'gemma3:4b',
};

/**
 * For Ollama the "key" is the address of the learner's own Ollama server.
 * Only loopback addresses are accepted, so the server can never be pointed
 * at an arbitrary host (no SSRF through this setting).
 */
export function ollamaBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error('Ollama address must be a URL like http://localhost:11434');
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'http:' || !loopback) {
    throw new Error('Ollama must run on this machine (http://localhost:11434).');
  }
  return url.origin;
}

async function postJSON(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message ?? data?.error ?? res.statusText;
    throw Object.assign(new Error(`Provider error (${res.status}): ${message}`), { status: res.status });
  }
  return data;
}

export async function callAdapter(
  provider: AdapterProvider,
  credential: string,
  model: string | undefined,
  prompt: string,
  schema?: Record<string, unknown>,
): Promise<AdapterResult> {
  const m = model || DEFAULT_MODELS[provider];

  if (provider === 'openai') {
    const data = await postJSON(
      'https://api.openai.com/v1/chat/completions',
      { authorization: `Bearer ${credential}` },
      {
        model: m,
        messages: [{ role: 'user', content: prompt }],
        ...(schema && {
          response_format: { type: 'json_schema', json_schema: { name: 'response', schema, strict: false } },
        }),
      },
    );
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      model: m,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    };
  }

  if (provider === 'anthropic') {
    const data = await postJSON(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': credential, 'anthropic-version': '2023-06-01' },
      {
        model: m,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        ...(schema && {
          tools: [{ name: 'respond', description: 'Return the response in the required shape.', input_schema: schema }],
          tool_choice: { type: 'tool', name: 'respond' },
        }),
      },
    );
    const blocks: { type: string; text?: string; input?: unknown }[] = data.content ?? [];
    const tool = blocks.find((b) => b.type === 'tool_use');
    return {
      text: tool ? JSON.stringify(tool.input) : blocks.map((b) => b.text ?? '').join(''),
      model: m,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };
  }

  const data = await postJSON(`${ollamaBaseUrl(credential)}/api/chat`, {}, {
    model: m,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    ...(schema && { format: schema }),
  });
  return {
    text: data.message?.content ?? '',
    model: m,
    inputTokens: data.prompt_eval_count ?? 0,
    outputTokens: data.eval_count ?? 0,
  };
}
