#!/usr/bin/env node
/**
 * BenkyoAI MCP server.
 *
 * Exposes a learner's exported vault (roadmaps, mastery, weak points, FSRS
 * reviews, session history) to any MCP client — Claude Desktop, Claude Code,
 * Cursor — so the learner can say "quiz me on my weak spots" from the AI tool
 * they already use. Read-only, local, stdio only: the vault file never leaves
 * the machine through this server, and no API key is involved.
 *
 * Usage: node mcp/server.mjs /path/to/benkyoai-vault.json
 *    or: BENKYO_VAULT=/path/to/benkyoai-vault.json node mcp/server.mjs
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  dueReviews,
  listRoadmaps,
  loadVault,
  pickRoadmap,
  roadmapOutline,
  sessionHistory,
  studyPlan,
  usageSummary,
  weakPoints,
} from "./vault.mjs";

const vaultPath = process.argv[2] ?? process.env.BENKYO_VAULT;
if (!vaultPath) {
  console.error("Pass the exported vault file: node mcp/server.mjs <vault.json>");
  process.exit(1);
}

const server = new McpServer({ name: "benkyoai", version: "0.1.0" });

const roadmapArg = {
  roadmap: z
    .string()
    .optional()
    .describe("Roadmap id or title. Defaults to the roadmap the learner last had open."),
};

const readOnly = { readOnlyHint: true, openWorldHint: false };

/** Re-reads the file on every call, so a fresh export is picked up without a restart. */
async function respond(build) {
  try {
    const vault = await loadVault(vaultPath);
    return { content: [{ type: "text", text: JSON.stringify(build(vault), null, 2) }] };
  } catch (err) {
    return { isError: true, content: [{ type: "text", text: err.message }] };
  }
}

server.registerTool(
  "list_roadmaps",
  {
    title: "List roadmaps",
    description: "Every roadmap in the learner's vault with overall mastery and progress.",
    annotations: readOnly,
  },
  () => respond((vault) => listRoadmaps(vault)),
);

server.registerTool(
  "get_roadmap",
  {
    title: "Get roadmap",
    description:
      "Full Roadmap → Topic → Subtopic tree with mastery, status, weak-point flags, prerequisite links and next FSRS review date.",
    inputSchema: roadmapArg,
    annotations: readOnly,
  },
  ({ roadmap }) => respond((vault) => roadmapOutline(pickRoadmap(vault, roadmap))),
);

server.registerTool(
  "get_weak_points",
  {
    title: "Get weak points",
    description:
      "Subtopics the learner has misunderstood or is missing a foundation for, with the prerequisite subtopics they build on.",
    inputSchema: roadmapArg,
    annotations: readOnly,
  },
  ({ roadmap }) => respond((vault) => weakPoints(pickRoadmap(vault, roadmap))),
);

server.registerTool(
  "get_due_reviews",
  {
    title: "Get due reviews",
    description:
      "Subtopics the FSRS spaced-repetition scheduler says are due now (the learner is predicted to be close to forgetting them), most overdue first.",
    inputSchema: roadmapArg,
    annotations: readOnly,
  },
  ({ roadmap }) => respond((vault) => dueReviews(pickRoadmap(vault, roadmap))),
);

server.registerTool(
  "get_session_history",
  {
    title: "Get session history",
    description:
      "Recent end-of-session summaries: what was covered, what was struggled with (and the mistake type), and the carry-over question for next time.",
    inputSchema: { ...roadmapArg, limit: z.number().int().min(1).max(20).optional() },
    annotations: readOnly,
  },
  ({ roadmap, limit }) =>
    respond((vault) => sessionHistory(vault, pickRoadmap(vault, roadmap), limit ?? 5)),
);

server.registerTool(
  "get_study_plan",
  {
    title: "Get study plan",
    description:
      "What to do next, in BenkyoAI's priority order: the carry-over question, weak points (foundations first), FSRS reviews due, then the next new subtopic.",
    inputSchema: roadmapArg,
    annotations: readOnly,
  },
  ({ roadmap }) => respond((vault) => studyPlan(vault, pickRoadmap(vault, roadmap))),
);

server.registerTool(
  "get_usage",
  {
    title: "Get AI usage",
    description: "Token usage of the learner's own API key, per model, as recorded by the app.",
    annotations: readOnly,
  },
  () => respond((vault) => usageSummary(vault)),
);

server.registerPrompt(
  "quiz_me",
  {
    title: "Quiz me on my weak spots",
    description: "A Socratic recall session over the learner's weak points and due reviews.",
    argsSchema: roadmapArg,
  },
  ({ roadmap }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Use the benkyoai tools to run a recall session${roadmap ? ` on "${roadmap}"` : ""}.
1. Call get_study_plan and open with its carry-over question if there is one.
2. Ask one question at a time, starting with "repairFirst", then "reviewNow". For a weak point with foundations, test the foundation first.
3. Do not reveal the answer before I try. If I'm wrong, say whether it looks like a careless slip, a misunderstanding, or a missing concept, then give a hint and let me retry.
4. Finish with a three-line summary: what held, what didn't, what to study next.`,
        },
      },
    ],
  }),
);

server.registerPrompt(
  "explain_back",
  {
    title: "Explain-back check",
    description: "Ask the learner to teach a subtopic back, then grade the explanation for gaps.",
    argsSchema: { subtopic: z.string().describe("Subtopic title to explain back") },
  },
  ({ subtopic }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Call get_roadmap and find "${subtopic}". Ask me to explain it in my own words as if to someone outside the field. Then list the specific gaps or wrong assumptions in my explanation, and give one follow-up question that targets the biggest gap. Do not explain it for me first.`,
        },
      },
    ],
  }),
);

await server.connect(new StdioServerTransport());
