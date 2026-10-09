import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { callAdapter, ollamaBaseUrl } from "@/lib/providerAdapters";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Replaces fetch with one canned reply and records the request. */
function stubFetch(reply: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(reply), { status: 200 });
  }) as typeof fetch;
  return calls;
}

const schema = { type: "object", properties: { feedback: { type: "string" } }, required: ["feedback"] };

test("OpenAI: JSON Schema response format, bearer auth, usage parsed", async () => {
  const calls = stubFetch({
    choices: [{ message: { content: '{"feedback":"ok"}' } }],
    usage: { prompt_tokens: 11, completion_tokens: 7 },
  });
  const out = await callAdapter("openai", "sk-test", undefined, "hi", schema);
  assert.equal(calls[0].url, "https://api.openai.com/v1/chat/completions");
  assert.equal((calls[0].init.headers as Record<string, string>).authorization, "Bearer sk-test");
  const body = JSON.parse(calls[0].init.body as string);
  assert.equal(body.model, "gpt-5-mini");
  assert.deepEqual(body.response_format.json_schema.schema, schema);
  assert.deepEqual(out, { text: '{"feedback":"ok"}', model: "gpt-5-mini", inputTokens: 11, outputTokens: 7 });
});

test("Anthropic: schema enforced through a forced tool call", async () => {
  const calls = stubFetch({
    content: [{ type: "tool_use", name: "respond", input: { feedback: "ok" } }],
    usage: { input_tokens: 20, output_tokens: 5 },
  });
  const out = await callAdapter("anthropic", "sk-ant-test", "claude-sonnet-5-5", "hi", schema);
  const body = JSON.parse(calls[0].init.body as string);
  assert.equal((calls[0].init.headers as Record<string, string>)["x-api-key"], "sk-ant-test");
  assert.deepEqual(body.tool_choice, { type: "tool", name: "respond" });
  assert.deepEqual(body.tools[0].input_schema, schema);
  assert.equal(body.model, "claude-sonnet-5-5");
  assert.deepEqual(JSON.parse(out.text), { feedback: "ok" });
  assert.equal(out.inputTokens, 20);
});

test("Anthropic without a schema returns plain text", async () => {
  stubFetch({ content: [{ type: "text", text: "Hello" }], usage: {} });
  const out = await callAdapter("anthropic", "sk-ant-test", undefined, "hi");
  assert.equal(out.text, "Hello");
});

test("Ollama: local chat API with format schema", async () => {
  const calls = stubFetch({ message: { content: '{"feedback":"ok"}' }, prompt_eval_count: 30, eval_count: 9 });
  const out = await callAdapter("ollama", "http://localhost:11434/", "qwen2.5:7b", "hi", schema);
  assert.equal(calls[0].url, "http://localhost:11434/api/chat");
  const body = JSON.parse(calls[0].init.body as string);
  assert.equal(body.stream, false);
  assert.deepEqual(body.format, schema);
  assert.equal(out.outputTokens, 9);
});

test("Ollama address must be loopback (no SSRF)", () => {
  assert.equal(ollamaBaseUrl("http://127.0.0.1:11434/x"), "http://127.0.0.1:11434");
  assert.throws(() => ollamaBaseUrl("http://169.254.169.254/latest"));
  assert.throws(() => ollamaBaseUrl("http://example.com:11434"));
  assert.throws(() => ollamaBaseUrl("file:///etc/passwd"));
  assert.throws(() => ollamaBaseUrl("not a url"));
});

test("provider errors surface with their status", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: { message: "invalid key" } }), { status: 401 })) as typeof fetch;
  await assert.rejects(callAdapter("openai", "sk-bad", undefined, "hi"), /401.*invalid key/);
});
