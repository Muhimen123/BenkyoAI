/**
 * End-to-end check of the MCP server: spawns it over stdio with the sample
 * vault, lists its tools and prompts, and calls each tool through a real MCP
 * client. Run: node mcp/smoke-test.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

const client = new Client({ name: "benkyo-smoke-test", version: "0.0.0" });
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [here("./server.mjs"), here("./sample-vault.json")],
  }),
);

const { tools } = await client.listTools();
const { prompts } = await client.listPrompts();
console.log("tools:", tools.map((t) => t.name).join(", "));
console.log("prompts:", prompts.map((p) => p.name).join(", "));

async function call(name, args = {}) {
  const res = await client.callTool({ name, arguments: args });
  assert.ok(!res.isError, `${name} failed: ${res.content?.[0]?.text}`);
  return JSON.parse(res.content[0].text);
}

const roadmaps = await call("list_roadmaps");
assert.equal(roadmaps[0].title, "Python Fundamentals");

const outline = await call("get_roadmap", { roadmap: "python" });
assert.deepEqual(outline.topics[1].subtopics[0].buildsOn, ["Boolean Expressions"]);

const weak = await call("get_weak_points");
assert.deepEqual(weak.map((w) => w.title), ["Boolean Expressions", "Conditionals"]);

const due = await call("get_due_reviews");
assert.deepEqual(due.map((d) => d.title), ["Boolean Expressions", "Conditionals"]);

const plan = await call("get_study_plan");
assert.equal(plan.openWith, "What does `if [] or 0:` do, and why?");
assert.equal(plan.thenLearn.title, "Boolean Expressions");

const history = await call("get_session_history", { limit: 1 });
assert.deepEqual(history[0].struggled, ["Conditionals (missing-concept)"]);

const usage = await call("get_usage");
assert.equal(usage.byModel["gemini-2.5-flash"].calls, 2);

const missing = await client.callTool({ name: "get_roadmap", arguments: { roadmap: "chemistry" } });
assert.ok(missing.isError, "unknown roadmap should be an error");

const prompt = await client.getPrompt({ name: "quiz_me", arguments: {} });
assert.match(prompt.messages[0].content.text, /get_study_plan/);

console.log("study plan:", JSON.stringify(plan, null, 2));
console.log("MCP smoke test passed");
await client.close();
