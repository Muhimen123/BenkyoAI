# Frontend Generation Prompt — BekyoAI
## Context

You are building the frontend for **BekyoAI**, a study app where users bring their own AI provider key (BYOK). The app turns any topic — or the user's own notes/materials — into a personalized, adaptive learning roadmap, gives step-by-step practice, and remembers the user's progress and mistakes across sessions so it can keep guiding them intelligently over time.

The goal of the UI is to keep the student **actively thinking**, not passively reading or watching. Every screen should reinforce that: quick checks of understanding, visible progress, and low-friction paths back into studying.

Build a clean, modern, distraction-free study interface. Favor calm neutral tones with one accent color, generous whitespace, and clear typographic hierarchy — this is a focus tool, not a marketing site.

**Key constraints:**
- **Tech stack: Next.js (App Router) + Tailwind CSS v4 + React 19.** All styling should use Tailwind utility classes — no separate CSS-in-JS or external UI kit unless it's built on top of Tailwind. Client-side session state (active session, summaries, roadmaps, chat history) is managed with **Zustand** via `src/store/useStudyStore.ts`. Component and route structure must match the folder structure section below.
- **There is no login or registration.** The app has no user accounts. The only "credential" in the entire product is the user's own AI provider API key (BYOK). Do not design any sign-up, sign-in, email/password, or OAuth flow anywhere. The first-run experience goes straight from "open the app" to "connect your AI key" to "tell us what you want to learn."
- **BYOK cannot assume prior familiarity.** Most users will not know what an API key is, where to get one, or why the app needs it. This is the single biggest trust/onboarding risk in the product — treat the BYOK step as a first-class, carefully designed moment, not a settings-page afterthought.
- **BYOK key vs. `GEMINI_API_KEY` env var — how these relate.** The architecture calls for `/api/summarize`, `/api/roadmap`, `/api/chat` routes built on `@google/genai`, and the repo's `.env.local` supports a `GEMINI_API_KEY` for local development. **This build does not implement those routes** (see "Scope & Backend Boundary" below) — but the frontend must be built as if the user's BYOK key, stored client-side in `localStorage` as part of the Vault, is what gets sent with every request once those routes exist. `GEMINI_API_KEY` is a future dev-only fallback for local testing when no user key is present — it is never the product's real key model and must never be presented to the end user as an option. The UI must be designed and copy-written entirely around "this is your key, your usage, your cost."
- **All data lives locally in the browser, in the Vault.** There is no server-side database and no user account tied to a backend. The BYOK key is stored in `localStorage` (see above). Materials, roadmaps, sessions, and progress are also persisted client-side as part of the "Vault" — use `localStorage` for small state and IndexedDB for larger material content if needed, but keep this simple and don't over-engineer the persistence layer. Design the UI as if the Vault is the single source of truth sitting in the browser — no "syncing to your account" language, no multi-device assumptions. The Next.js API routes are stateless request proxies to Gemini, not a database.
- **This is a frontend-only build.** The `/api/*` routes and Gemini integration shown in the architecture doc are the target end-state, but are NOT implemented in this build — see "Scope & Backend Boundary" below before writing any code.
- **UI primitives: plain Tailwind only, no component library.** Do not introduce shadcn/ui or any other headless/component kit. Hand-roll `components/ui/` primitives (buttons, cards, inputs, etc.) directly in Tailwind utility classes, per the "no separate CSS-in-JS or external UI kit" constraint above.

### Visual Identity
- **Color palette — pastel derivatives of this base palette, background maximally white.** Use these as the source hues, but shift each toward a very light, desaturated pastel tint rather than using them at full saturation — the app should read as airy and mostly white/neutral, with color used sparingly as accents (status tints, badges, active states, small highlights), not as large fills:
  - Café Noir `#563D23` (deep brown — use as pastel for primary text/high-contrast accents only, not as a fill)
  - Harvest Gold `#DD9C00` (use as a soft pastel gold for the accent color — CTAs, progress, active states)
  - Maize `#FAE45E` (soft pastel yellow — subtle highlight/tint backgrounds, e.g. "review" badges)
  - Moss Green `#A7A865` (soft pastel sage — secondary accent, e.g. mastered/success states)
  - Dark Moss Green `#283B0A` (deep green — reserve for small high-contrast accents, icons, or dark-mode/exam-night mode, not general fills)
  Base page/card backgrounds should stay near-white (e.g. `#FDFCFA`–`#FFFFFF` range); pastel tints sit on top as small surfaces, borders, badges, and accent states — not as full-page or full-card color blocks.
- **Design direction: avoid the generic "vibe-coded" AI-app look.** Don't default to the typical template pattern (centered hero + generic rounded cards + predictable grid + stock gradient blobs). Aim for a more considered, editorial/product-designed feel — thoughtful use of whitespace, type hierarchy, and asymmetry where appropriate — while staying calm and distraction-free per the Design Notes above. This applies across all screens, not just the landing/onboarding flow.
- **Logo/brand type: DM Serif Display for the wordmark/logo only.** Use DM Serif Display (via next/font or Google Fonts) specifically for the "BekyoAI" wordmark and any logo-lockup text. Body copy, UI labels, and functional text should stay on the app's normal sans-serif UI font — do not extend the serif display font to general UI text.
- **App icon/logo: use a generic placeholder icon for now.** The real logo will be supplied separately later. For this build, use a simple generic icon (e.g. an open-book or sparkle icon from an icon set already available in the project, such as lucide-react) wherever the app icon/logo mark would appear, sized and placed as if a final logo will be dropped in later — don't invest design effort into a custom icon.

---

### Build Approach (staged, to control cost/complexity)
Build this in two stages rather than generating every screen independently or all at once:
1. **Foundation** — folder scaffolding, `lib/types.ts` (all data contract types), the mock data layer (functions matching the Data Contracts section), the Zustand store (`useStudyStore.ts`), and the base theme/Tailwind setup + `components/ui/` primitives. Get this layer internally consistent before building screens on top of it.
2. **Core flow, one pass** — Onboarding → Dashboard → Vault → Roadmap/Topic/Subtopic, built together since they share state and components heavily.
3. **Remaining screens, one pass** — Practice, Active Recall, Session Summary, Settings.
4. **Polish pass** — responsive/empty/loading states, micro-interactions, once the full app exists.

Avoid regenerating the foundation layer once core screens are built on top of it; if a gap is found later, patch it rather than rebuilding.

---

## Folder Structure

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

Note: this structure currently only shows a single `study/[sessionId]` view plus three API routes. This build is frontend-only (see Scope & Backend Boundary) — the `api/` routes shown here are not implemented, but their names/shapes inform the mock data-layer functions the UI calls. The functional requirements below need more screens (onboarding, dashboard, vault, subtopic detail, active recall, session summary, settings) than are listed here. Extend the `app/` and `components/` structure to fit those needs, following the same conventions, rather than inventing a different pattern.

---

## Core Data Model (for the UI to reflect)

```
Vault (all of a user's material)
 └─ Roadmap
     └─ Topic
         └─ Subtopic
             ├─ Explanation (adjustable depth/effort level)
             └─ Practice Problems (MCQ + Short Questions)

Session
 ├─ tied to a point in the Roadmap
 ├─ produces a short end-of-session summary (covered / struggled / understood well)
 └─ feeds into next session's opening + long-term pattern tracking
```

---

## Functional Requirements

### 1. Roadmap Generation
- Entry flow where the user states what they want to learn, in free text.
- Optional material upload: PDF, PPTX, photos of handwritten notes, lecture recordings, video timestamps — should feel like a single "add material" action, not separate flows per file type.
- A short calibration step (a few quick questions) to gauge the user's current level before the roadmap is built.
- A step asking **why** they're learning this (exam, project, job, curiosity) — this framing should visibly influence pacing/depth, so surface it, don't hide it in settings.
- Optional deadline field (e.g. exam date) that the roadmap visibly adapts around (pacing indicator).
- Roadmap renders as a tree/outline: **Roadmap → Topics → Subtopics**, with per-node status (not started / in progress / mastered %).
- Roadmap is not static — include a subtle "updated based on your recent performance" indicator when it changes.
- Support "modify prompt" — an advanced/optional control letting the user directly edit the instruction the AI uses to generate or adjust the roadmap.
- Support manually adding a topic ("+ Add by myself") alongside AI-generated ones.

### 2. Vault (materials + roadmap home)
- Central library view of everything the user has uploaded/generated, organized under Roadmap → Topic → Subtopic.
- Sessions are attached under this structure so users can see history per subtopic, not just a flat log.

### 3. Practice per Step
- Each subtopic has its own practice set: MCQ and short-answer questions.
- In-context control to ask the AI to "explain this differently" or "explain more simply" at any point.
- After practice, show an understanding score (e.g. "72% mastered") with a clear next action: move on / review / go deeper.
- Wrong answers should surface *why* (misunderstanding vs. careless mistake vs. missing foundational concept) — reflect this distinction visually, since it leads to different follow-ups (quietly inserted earlier step vs. a scheduled quick review).
- At key checkpoints, replace the quiz with an "explain this back in your own words" input (text, and ideally voice) instead of MCQ — design this as a distinct, slightly more deliberate interaction from regular quiz questions.
- Occasional tricky/misleading questions to test true understanding vs. memorization — no special UI needed, but consider a subtle tag so users can tell these apart in review ("this one was designed to be tricky").

### 4. Active Recall
- Two modes, both should be reachable from the dashboard:
  - **Session-wise**: recall drawn from the previous session's material + anything left unresolved.
  - **Milestone-wise**: recall drawn from everything up to a roadmap milestone.
- **Exam Night Revision**: a distinct, high-visibility mode that runs active recall across the *entire* vault — this should feel different from regular practice (e.g. a dedicated entry point, progress-through-the-vault indicator).

### 5. Memory Across Sessions
- End-of-session summary screen: what was covered, what they struggled with, what they understood well.
- Next session should open by referencing the last one ("Last time you got this wrong, do you still remember it?") — build a component for this callback moment.
- Session resume: users should be able to pick up exactly where they left off from the dashboard/vault.
- Growth callouts: surface moments like "You struggled with this before, and just got it right without help" — treat this as a small celebratory UI moment, not just a log line.
- Review isn't a separate section — old weak points should appear blended into new lessons; the UI shouldn't have a heavy standalone "review" tab, but weak-point refreshers should be visually distinguishable when they appear inline.

### 6. Explanation Depth / Effort Level
- A user-adjustable "explanation depth" control (think: similar to an LLM effort/verbosity toggle) that affects how detailed explanations are for a topic.

### 7. BYOK (must be guided, not just a settings field)
- This is the very first thing a new user does — there is no account to fall back on, so this screen *is* the onboarding.
- Explain in plain language, before asking for anything: what an API key is, why the app needs it (their key = their own AI usage, their own cost/control), and that it stays local to them.
- Walk the user through getting a key step-by-step (e.g. numbered mini-guide or accordion per supported provider — "1. Go to [provider] → 2. Create a key → 3. Paste it here"), rather than a bare input field with a label.
- Validate the key inline (test it as soon as it's entered) and give an unambiguous success/failure state before letting the user move forward.
- Once connected: a persistent, always-visible but non-intrusive status indicator (connected / provider name) somewhere consistent like the header — the user should never have to wonder "is my key working right now."
- Settings should let them view connection status and replace/remove the key, but never re-display the key itself in plaintext.
- Make it easy to change providers or re-enter a key later without feeling like a "recovery" flow — this isn't a forgot-password situation, it's a normal settings action.

### 8. Nice-to-Have (design for, lower priority)
- Speak-aloud input for the "explain in your own words" checkpoints.
- Cross-user anonymized insight ("this explanation helps most students with this mistake") — could surface subtly as an "AI's best explanation" badge, no need for a full feature surface yet.

---

## Scope & Backend Boundary

**Build the frontend only.** Do not implement, stub out server logic for, or make architectural decisions about:
- Any AI/LLM call itself (prompt construction, model selection, streaming logic, parsing the AI's response) — this includes the `/api/summarize`, `/api/roadmap`, `/api/chat` route handlers and `src/lib/ai.ts`/`src/lib/prompts.ts` named in the architecture doc. Their existence and naming inform what client functions should call, but do not write their implementation.
- File parsing (PDF/PPTX/photo/audio-to-text extraction)
- Web search integration
- The local storage engine itself (IndexedDB/localStorage schema, migrations, persistence internals)

Instead, build the UI against a **thin data layer / mock API** that returns the shapes defined below. Every place the UI needs data or triggers an action (generate roadmap, submit practice answer, save session, etc.) should call a clearly named function (e.g. `generateRoadmap(input)`, `submitAnswer(payload)`) — named and shaped to match the real route it will eventually call (`/api/roadmap`, etc.) — that currently returns mock/sample data, so the real route handler can be dropped in later without touching UI code. Do not hardcode data directly into components — route it through these functions.

## Data Contracts (what the UI expects to receive)

These define the shape of data the frontend consumes and produces at each integration point. Use these as the mock data / type definitions (e.g. TypeScript interfaces) for now.

**Roadmap generation**
- Receives: topic text, optional uploaded material references, calibration answers, purpose (exam/project/job/curiosity), optional deadline.
- Returns: a roadmap tree — `Topic[]` → each with `Subtopic[]` → each with an explanation stub, mastery %, and status (not started / in progress / mastered).

**Practice**
- Receives: a subtopic ID.
- Returns: a list of questions (MCQ or short-answer), each with prompt, options (if MCQ), and — after submission — a result object containing correct/incorrect, an understanding delta, and a mistake type (`misunderstanding` / `careless` / `missing-concept`).

**Explain-back checkpoint**
- Receives: the user's free-text (or transcribed voice) explanation.
- Returns: an evaluation object — gaps found (if any), a pass/needs-review verdict, and optional follow-up explanation.

**Active recall**
- Receives: a mode (`session-wise` / `milestone-wise` / `exam-night`) and relevant scope (session ID, milestone ID, or "all").
- Returns: a queue of recall items pulled from prior weak points and unresolved material.

**Session summary**
- Receives: end-of-session state.
- Returns: a structured summary object — topics covered, struggled points, well-understood points, and any growth callouts (previously-missed items now answered correctly).

**BYOK**
- Receives: provider name + API key string.
- Returns: a validation result (valid/invalid, provider confirmed). The key itself is only ever stored locally, never sent anywhere except directly to the provider for validation/use.

---



1. **Onboarding** — topic input, optional material upload, calibration questions, purpose + deadline capture.
2. **Dashboard** — current roadmap snapshot, resume-session card, active recall entry points (session-wise, milestone-wise, exam night), growth callouts.
3. **Vault** — Roadmap → Topic → Subtopic tree, materials list, session history per node.
4. **Roadmap / Topic view** — subtopic list with mastery %, explanation depth control, "modify prompt" and "add topic" affordances.
5. **Subtopic detail** — explanation panel + practice (MCQ/short answer) + "explain back to me" checkpoint.
6. **Active Recall session** — session-wise / milestone-wise / exam-night variants, sharing one core recall UI with mode-specific framing.
7. **Session summary** — end-of-session recap screen.
8. **Settings** — BYOK key management, explanation depth default, deadline management.

---

## Design Notes
- This is a study tool: prioritize clarity and low cognitive load over visual flourish.
- Use progressive disclosure — advanced controls (modify prompt, BYOK, effort level) should be accessible but not clutter the primary study flow.
- Make the distinction between "new learning" and "review" felt through subtle visual treatment (e.g. a small badge/tint on review-blended content) rather than separate navigation.
- Exam Night Revision should feel more urgent/focused than regular practice — consider a slightly different visual mode (e.g. darker/focused theme) when active.
- **UI/UX quality is a top priority, not an afterthought.** Polished spacing, considered micro-interactions (hover/active/loading/empty states), and clear visual hierarchy matter as much as functionality — this should feel like a well-crafted product, not a wireframe brought to life.
- **Fully responsive, mobile-first.** Every screen — onboarding, dashboard, vault tree, practice, active recall, session summary — must work cleanly on mobile, not just adapt awkwardly. Assume a meaningful share of studying happens on a phone. Roadmap trees and vault views especially need a mobile-friendly collapsed/drill-down pattern rather than cramming a desktop tree layout onto a small screen.
- **If a UI detail isn't specified above, fill it in sensibly — but keep it simple.** Where this prompt leaves a gap (e.g. exact empty-state copy, a minor transition, secondary button placement), make a reasonable, low-complexity choice consistent with the rest of the design rather than leaving it unbuilt or over-engineering a solution. Don't introduce new features, extra screens, or extra flows to fill a gap — just complete what's already described.

---

## What NOT to Do
- Do not build or reference any login, sign-up, password, or OAuth flow — there are no user accounts.
- Do not put the API key behind a generic "Settings" label as the only way to find it — it must be surfaced directly in the first-run flow.
- Do not treat BYOK as a single unlabeled text input — it needs explanation, guidance, and validation, not just a field.
- Do not display the raw API key anywhere after it's first entered.
- Do not build a separate, heavyweight "Review" section — weak-point review is blended inline into new lessons (see Memory Across Sessions).
- Do not bury Exam Night Revision inside regular practice navigation — it needs its own clear entry point.
- Do not use a generic SaaS dashboard aesthetic (sidebars full of unrelated widgets, marketing-style hero sections, pricing-page patterns) — this is a focused study tool, not a business app.
- Do not deviate from the folder structure's conventions when adding new mock functions/files — extend it, don't replace its pattern.
- Do not add features beyond what's listed here; if something seems missing, flag it as a question rather than assuming.
- Do not implement any backend logic — no AI calls, no file parsing, no real database/storage engine, no actual `/api/*` route handlers. Build against the mock data functions described in "Data Contracts" instead.
- Do not have mock functions simulate a fixed, app-owned Gemini key in the request path the end user experiences — even mocked, the data flow should reflect that the user's own BYOK key (from `localStorage`) is what would be sent; `GEMINI_API_KEY` is a future dev-only fallback, never the product's real key model.
- Do not silently invent your own data shapes for roadmap/practice/session objects — use the contracts defined above so a real backend can be dropped in later without UI rework.

## Ask
Generate the Next.js (App Router) + Tailwind CSS v4 + React 19 **frontend** — screens, components, mock data-layer functions (named and shaped to match the eventual `/api/summarize`, `/api/roadmap`, `/api/chat` routes and any others needed for practice, active recall, session summary, and BYOK validation), and the Zustand store — based on the requirements above, matching the flow and screen groupings from the design board (Vault → Roadmap/Topic/Subtopic, Practice, Active Recall, Session Resume) rather than a generic layout. Prioritize BYOK onboarding and the no-login constraint as top-level design decisions, not details. Build strictly frontend: wire every data need through the mock functions matching the Data Contracts section, not real backend logic — no real Gemini calls, no real route handlers. Make UI/UX quality and full mobile responsiveness first-class priorities throughout. Where details are left unspecified, fill the gap with a simple, sensible choice — don't over-engineer or add scope. Follow the folder structure section exactly as provided, extending it only where the functional requirements need screens/mock functions it doesn't yet list.
