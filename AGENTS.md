<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Benkyo AI Architecture & File Structure

This repository is an AI-powered study helper application using Next.js App Router, Tailwind CSS v4, and Google Gemini SDK (`@google/genai`).

## File Structure (`src/`)

```
src/
├── app/
│   ├── page.tsx                 # Landing / input page (paste material or topic)
│   ├── layout.tsx
│   ├── globals.css
│   │
│   ├── study/
│   │   └── [sessionId]/
│   │       └── page.tsx         # Main study view: summary + roadmap + chat
│   │
│   └── api/
│       ├── summarize/
│       │   └── route.ts         # POST → takes material, returns summary (Gemini)
│       ├── roadmap/
│       │   └── route.ts         # POST → takes summary/topic, returns roadmap (Gemini)
│       └── chat/
│           └── route.ts         # POST → study helper chat streaming (Gemini)
│
├── components/
│   ├── ui/                      # UI primitives (buttons, cards, inputs)
│   ├── MaterialInput.tsx        # Textarea / file upload for source material
│   ├── SummaryCard.tsx          # Summary display component
│   ├── RoadmapView.tsx          # Checklist / timeline of topics
│   └── ChatPanel.tsx            # AI study-helper chat UI
│
├── lib/
│   ├── ai.ts                    # Google Gen AI client wrapper (`@google/genai`)
│   ├── prompts.ts               # System prompts (summarize, roadmap, tutor)
│   └── types.ts                 # Shared TS types (Roadmap, Summary, Message, etc.)
│
└── store/
    └── useStudyStore.ts         # Zustand store — client-side session state
```

## Guidelines for Coding Agents
- **AI Integration**: Use Google Gemini SDK (`@google/genai`) configured via `GEMINI_API_KEY` in `.env.local`.
- **State Management**: Use Zustand (`src/store/useStudyStore.ts`) for managing active study sessions, summaries, roadmaps, and chat history.
- **Styling**: Use Tailwind CSS v4 and React 19.

## Available Agent Skills & MCP

### Skills
- **`next-dev-loop`**: Verify Next.js runtime behavior after editing app code using Next.js MCP (`/_next/mcp`) and browser automation (`agent-browser`).
- **`task-driven-development`**: Use for non-trivial coding tasks (multi-step features, refactors, bug hunts, migrations) — plan work, get user approval, persist as a task list file, and keep updated.
- **`find-skills`**: Discover and install agent skills when looking for new capabilities.
- **`mcp-scripting`**: Write mcpScript JavaScript for discovering, inspecting, and calling MCP tools in batches.

### MCP (Model Context Protocol)
- **Next.js Devtools (`next-devtools` / `/_next/mcp`)**: Running Next.js dev server exposes runtime diagnostics, route info, build status, cache management, and custom MCP tools. Use `next_2d_devtools_index`, `next_2d_devtools_call`, etc.
- **MCP Gateway (`mcp`, `mcpScript`)**: Manage servers, search tools, inspect schemas, and execute single or multi-call scripts across MCP tools.

