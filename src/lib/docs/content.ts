/**
 * Everything /docs says, in one typed file.
 *
 * Edit here to change the docs — the page, the search and the Markdown export
 * all read from this. Entries marked `todo: true` are placeholders the team
 * still has to fill in; the page tags them so they can't slip through unseen.
 *
 * `tests/docs.test.ts` checks the API reference against the real routes in
 * src/app/api, so the endpoint list can't silently drift.
 */

export interface PitchBlock {
  id: string;
  title: string;
  headline: string;
  points: string[];
  /** Where the figures in `points` come from. */
  sources?: { label: string; url: string }[];
  todo?: boolean;
}

export interface TeamMember {
  name: string;
  role: string;
  /** Shown as a mailto link when set. */
  email?: string;
  /** Path under /public, e.g. "/team/muhimen.jpg". Initials are used without one. */
  photo?: string;
  todo?: boolean;
}

export type FeatureStatus = "live" | "beta" | "upcoming" | "planned";

export interface Feature {
  name: string;
  area: string;
  status: FeatureStatus;
  note: string;
}

export interface Endpoint {
  method: "GET" | "POST";
  path: string;
  purpose: string;
  body: string;
  returns: string;
}

export interface ChangelogEntry {
  date: string;
  title: string;
  items: string[];
}

export interface Topic {
  title: string;
  body: string;
}

/* -------------------------------------------------------------- pitch deck */

export const PITCH: PitchBlock[] = [
  {
    id: "problem",
    title: "Problem",
    headline: "Most studying is passive, and most AI study tools make it more passive.",
    points: [
      "Re-reading notes and asking a chatbot for answers feel productive, yet decades of research show that testing yourself beats restudying: a meta-analysis of 217 studies found a medium-to-large benefit from practice testing (g ≈ 0.5–0.6).",
      "Learners rarely know why they got something wrong: a slip, a wrong mental model, or a missing foundation all look the same.",
      "Generic tutors forget everything between sessions, so weak points never come back on time.",
      "Study apps hold the learner's notes and history on someone else's servers.",
    ],
    sources: [
      { label: "Adesope, Trevisan & Sundararajan (2017), Rethinking the Use of Tests, Review of Educational Research", url: "https://journals.sagepub.com/doi/10.3102/0034654316689306" },
      { label: "The Learning Scientists — summary of the 217-study meta-analysis", url: "https://www.learningscientists.org/blog/2017/2/9-1" },
    ],
  },
  {
    id: "solution",
    title: "Solution",
    headline: "A tutor that diagnoses, remembers, and belongs to the learner.",
    points: [
      "Turns a topic or the learner's own material into a Roadmap → Topics → Subtopics tree with a prerequisite graph.",
      "Practice with trap options and explain-back checkpoints; every mistake is classified as careless, misunderstanding or missing concept.",
      "A missing concept walks back to the prerequisite; weak points return on an FSRS schedule until they hold.",
      "Runs on the learner's own AI key; their whole study history stays in their browser.",
    ],
  },
  {
    id: "why-now",
    title: "Why now",
    headline: "Tutoring-grade AI became cheap, and the biggest labs just confirmed learners want it.",
    points: [
      "The price of a fixed level of model performance is falling fast: Epoch AI estimates about 40× per year for GPT-4-level science performance (9× to 900× depending on the task); an independent analysis puts frontier models at 5–10× per year. Per-question tutoring now costs fractions of a cent.",
      "OpenAI launched Study Mode in ChatGPT (July 2025) and Google launched Guided Learning in Gemini (August 2025): the category is validated, but both live inside one provider's account.",
      "Schema-constrained output makes model responses reliable enough to drive an app, not just a chat window.",
      "Modern spaced repetition is mainstream: Anki has shipped the open FSRS scheduler as an option since version 23.10.",
      "Browsers can now store and search real material locally (OPFS, IndexedDB), so privacy no longer costs features.",
    ],
    sources: [
      { label: "Epoch AI — LLM inference price trends", url: "https://epoch.ai/data-insights/llm-inference-price-trends" },
      { label: "The Price of Progress (2025) — independent price-per-performance analysis", url: "https://arxiv.org/html/2511.23455v1" },
      { label: "OpenAI — Introducing study mode in ChatGPT", url: "https://openai.com/index/chatgpt-study-mode/" },
      { label: "Google — Guided Learning in Gemini", url: "https://blog.google/products-and-platforms/products/education/guided-learning/" },
      { label: "Anki manual — which spaced repetition algorithm Anki uses", url: "https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm" },
    ],
  },
  {
    id: "demo",
    title: "Product demo",
    headline: "From \"I have an exam in three weeks\" to a first diagnosed mistake in under five minutes.",
    points: [
      "1. Connect a key: guided, validated inline, stored only in the browser.",
      "2. Name a topic, upload notes or a YouTube link, answer three calibration questions.",
      "3. Get a roadmap paced to the deadline; open the first subtopic.",
      "4. Read a grounded explanation, practise, and see why each wrong answer was wrong.",
      "5. End the session: a recap with growth callouts and the question the next session opens with.",
    ],
  },
  {
    id: "market",
    title: "Market opportunity",
    headline: "BenkyoAI sits where two growing markets meet: AI in education and online tutoring.",
    points: [
      "AI in education: forecasts for 2030 range from US$5.8B (MarketsandMarkets, 17.5% CAGR from US$2.2B in 2024) to US$48.6B (Knowledge Sourcing Intelligence, 20.8% CAGR). The spread comes from how widely each firm defines the market.",
      "Online tutoring: estimated at US$9.5–12.8B in 2025, growing about 15% a year (Persistence Market Research; The Business Research Company).",
      "Demand is proven at scale: the largest AI providers now ship dedicated study modes to students for free.",
      "To fill in: TAM / SAM / SOM for the segment BenkyoAI targets first, and why that segment.",
    ],
    sources: [
      { label: "MarketsandMarkets — AI in Education market (Aug 2025)", url: "https://www.marketsandmarkets.com/PressReleases/ai-in-education.asp" },
      { label: "Research and Markets — AI in education (Knowledge Sourcing Intelligence)", url: "https://www.researchandmarkets.com/report/education-ai" },
      { label: "Persistence Market Research — Online tutoring market", url: "https://gii.tw/report/pmrs1660896-online-tutoring-market-global-industry-analysis.html" },
      { label: "The Business Research Company — Online tutoring global market report", url: "https://www.gii.co.jp/report/tbrc1712799-online-tutoring-global-market-report.html" },
    ],
    todo: true,
  },
  {
    id: "business-model",
    title: "Business model",
    headline: "BYOK: learners pay their AI provider directly, so serving a learner costs us almost nothing.",
    points: [
      "No per-user inference bill: the learner's own key pays for their tokens (a free-tier Gemini key works), and the in-app meter shows the cost.",
      "No user database to run, so hosting cost stays flat as usage grows.",
      "Options that fit this model: a hosted-key subscription for learners who don't want to manage a key; licences for schools and coaching centres with teacher-shared roadmaps; premium features such as encrypted backup and cross-device sync.",
      "To fill in: which of these BenkyoAI pursues first, and pricing.",
    ],
    todo: true,
  },
  {
    id: "traction",
    title: "Traction",
    headline: "Built and shipped end to end.",
    points: [
      "Working product: onboarding, roadmaps, practice, explain-back, three recall modes, session memory and an MCP server.",
      "Engineering quality: AI output validated against schemas, diagnosis and scheduling unit-tested, MCP server tested end to end.",
      "To fill in: users, sessions, retention, pilots or testimonials.",
    ],
    todo: true,
  },
  {
    id: "competition",
    title: "Competition",
    headline: "Others teach, or schedule, or ground in your notes. BenkyoAI does all three, and the learner owns the result.",
    points: [
      "Flashcard apps (Anki, Quizlet): strong review scheduling (Anki offers FSRS), but the learner writes or picks the cards, and wrong answers aren't diagnosed.",
      "ChatGPT Study Mode: Socratic, step-by-step help with quizzes and feedback, inside a ChatGPT conversation and account.",
      "Gemini Guided Learning: LearnLM-powered explanations with diagrams, videos and quizzes, inside the Gemini app.",
      "NotebookLM: answers grounded in your own documents, built around reading and summarising them.",
      "BenkyoAI: a roadmap with a prerequisite graph, rule-based mistake diagnosis, FSRS-scheduled recall and grounding in the learner's material, on any provider (Gemini, OpenAI, Anthropic or a local model), with all history kept on the learner's device.",
    ],
    sources: [
      { label: "OpenAI — Introducing study mode in ChatGPT", url: "https://openai.com/index/chatgpt-study-mode/" },
      { label: "Google — Guided Learning in Gemini", url: "https://blog.google/products-and-platforms/products/education/guided-learning/" },
      { label: "Anki manual — spaced repetition algorithms", url: "https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm" },
    ],
  },
  {
    id: "advantage",
    title: "Unique advantage",
    headline: "Diagnosis the learner can audit, memory the learner owns.",
    points: [
      "Mistake type comes from deterministic, unit-tested rules, not model opinion.",
      "Every structured model output is validated against a schema before it reaches the UI.",
      "Local-first by architecture: no accounts and no server-side copy of anyone's study history.",
      "Provider-neutral: Gemini, OpenAI, Anthropic or a local Ollama model, so no single lab owns the learner.",
      "Portable: the vault exports to any MCP client (Claude, Cursor and others).",
    ],
  },
  {
    id: "gtm",
    title: "Go-to-market",
    headline: "Start where exams are: student communities first, then teachers.",
    points: [
      "Zero-friction trial: no sign-up, and a free-tier Gemini key is enough to start.",
      "Exam Night mode as the wedge: a concrete, shareable moment every exam season.",
      "Student communities: university and exam-prep groups, study Discords and subreddits, with one-click roadmap demos for popular syllabi.",
      "Campus ambassadors who run exam-night sessions, then teachers and coaching centres once classroom sharing ships.",
      "To fill in: the channels and partnerships already in place, and the plan for the first 100 users.",
    ],
    todo: true,
  },
  {
    id: "vision",
    title: "Vision",
    headline: "Every learner gets a tutor that knows exactly what they don't know yet.",
    points: [
      "A personal learning record the learner owns and can take to any tool (the MCP server is the first step).",
      "Roadmaps that adapt to every answer, across every subject a person studies over years.",
    ],
  },
];

/* -------------------------------------------------------------------- team */

export const TEAM: { name?: string; members: TeamMember[] } = {
  name: "Team BenkyoAI",
  members: [
    { name: "Al Muhimen", role: "Role", todo: true },
    { name: "Nishat Tasnim Meem", role: "Role", todo: true },
  ],
};

/* -------------------------------------------------------- product overview */

export const OVERVIEW: Topic[] = [
  {
    title: "What it does",
    body: "Builds an adaptive study roadmap from a topic or the learner's own material, teaches each step, tests it, works out why mistakes happen, and schedules weak points back until they hold.",
  },
  {
    title: "Who it's for",
    body: "Students preparing for exams, people learning for a job or a project, and anyone studying out of curiosity who wants to know what they actually remember.",
  },
  {
    title: "Core use cases",
    body: "Exam preparation against a deadline; turning lecture slides or PDFs into practice; nightly review of weak points; one focused vault-wide pass the night before an exam.",
  },
];

/* ---------------------------------------------------------- feature matrix */

export const FEATURES: Feature[] = [
  { name: "BYOK onboarding with inline key validation", area: "Onboarding", status: "live", note: "Gemini, OpenAI, Anthropic, Ollama" },
  { name: "Adaptive roadmaps with prerequisite graph", area: "Roadmaps", status: "live", note: "Purpose, deadline and calibration aware" },
  { name: "Multiple roadmaps", area: "Roadmaps", status: "live", note: "Switch, add, delete" },
  { name: "Material parsing: text, PDF, PPTX, YouTube", area: "Materials", status: "live", note: "Files parsed in the browser; YouTube captions fetched by a keyless relay" },
  { name: "Hybrid retrieval (BM25 + embeddings, RRF)", area: "Materials", status: "live", note: "Cited passages in explanations and chat" },
  { name: "Depth-controlled explanations", area: "Learning", status: "live", note: "Brief, balanced, deep; re-explain on demand" },
  { name: "MCQ and short-answer practice with trap options", area: "Practice", status: "live", note: "Weak points blended inline" },
  { name: "Deterministic mistake diagnosis", area: "Practice", status: "live", note: "Careless, misunderstanding, missing concept" },
  { name: "Explain-back checkpoints (typed or spoken)", area: "Practice", status: "live", note: "Voice where the browser supports it" },
  { name: "Active recall: session, milestone, exam night", area: "Recall", status: "live", note: "FSRS-ordered" },
  { name: "Session summaries and growth callouts", area: "Memory", status: "live", note: "Next session opens with a carry-over question" },
  { name: "Token usage and cost meter", area: "Settings", status: "live", note: "Per call, on the learner's key" },
  { name: "Vault export + read-only MCP server", area: "Integrations", status: "live", note: "Key never exported" },
  { name: "Docs visibility scheduling", area: "Docs", status: "live", note: "Env vars + admin panel" },
  { name: "Streaming chat responses", area: "Learning", status: "upcoming", note: "Replies arrive whole today" },
  { name: "Encrypted vault backup and restore", area: "Vault", status: "planned", note: "Import of an exported vault" },
  { name: "Teacher-shared roadmaps", area: "Collaboration", status: "planned", note: "Share a roadmap, not a history" },
];

/* --------------------------------------------------------------- diagrams */

export const ARCHITECTURE = `flowchart LR
  subgraph Browser["Learner's browser (the only place data lives)"]
    UI["Next.js + React UI"]
    Vault[("Vault<br/>localStorage + OPFS")]
    Index[("Retrieval index<br/>IndexedDB")]
    FSRS["FSRS scheduler"]
    Rules["Diagnosis rules"]
  end
  subgraph Server["Stateless Next.js routes"]
    Routes["AI routes<br/>schema-validated"]
    Embed["/api/embed"]
  end
  Gemini["AI provider<br/>learner's own key"]
  MCP["BenkyoAI MCP server<br/>stdio, read-only"]
  Clients["Claude / Cursor / any MCP client"]
  UI <--> Vault
  UI <--> Index
  Rules --> Vault
  FSRS --> Vault
  UI -- "prompt + retrieved passages" --> Routes
  UI -- "chunks / query" --> Embed
  Routes --> Gemini
  Embed --> Gemini
  Vault -- "export (no key)" --> MCP
  MCP --> Clients`;

export const LOOP = `flowchart LR
  A["Assess level"] --> B["Plan roadmap<br/>+ prerequisite graph"]
  B --> C["Teach<br/>grounded in own material"]
  C --> D["Test<br/>trap options + explain-back"]
  D --> E["Diagnose<br/>careless / misunderstanding / missing concept"]
  E -- "missing concept" --> F["Walk back to prerequisite"]
  E --> G["Remember<br/>session summary + carry-over"]
  F --> G
  G --> H["Recall<br/>FSRS-scheduled"]
  H --> C`;

export const DATA_FLOW = `flowchart LR
  In["Input<br/>topic, notes, PDF, slides, YouTube"] --> Parse["Parse + chunk<br/>in the browser"]
  Parse --> Idx[("Local index")]
  Idx -- "top passages" --> Prompt["Prompt + fenced material"]
  Prompt --> AI["AI provider<br/>JSON Schema constrained"]
  AI --> Check["Zod validation"]
  Check --> Out["Output<br/>roadmap, explanation, questions"]
  Out --> Ans["Learner answers"]
  Ans --> Diag["Rules: mistake type"]
  Diag --> Sched["FSRS + weak points"]
  Sched -- "feedback" --> Prompt`;

/* ------------------------------------------------------------------- API */

export const API: Endpoint[] = [
  { method: "POST", path: "/api/key/validate", purpose: "Check a key works before it is saved", body: "{ provider, apiKey, model? }", returns: "{ valid, provider, message }" },
  { method: "GET", path: "/api/models", purpose: "List Gemini models the key can call", body: "query: apiKey", returns: "{ success, models[] }" },
  { method: "POST", path: "/api/models", purpose: "List Gemini models the key can call", body: "{ apiKey }", returns: "{ success, models[] }" },
  { method: "POST", path: "/api/summarize", purpose: "Summarise uploaded material", body: "{ materialIds, text, topic }", returns: "Summary" },
  { method: "POST", path: "/api/roadmap/calibration", purpose: "Level-check questions for a topic", body: "{ topic }", returns: "CalibrationQuestion[]" },
  { method: "POST", path: "/api/roadmap", purpose: "Build or rebuild a roadmap", body: "{ topic, purpose, deadline?, calibration, materialKeyPoints?, promptOverride? }", returns: "Roadmap" },
  { method: "POST", path: "/api/roadmap/topic", purpose: "Add a learner-written topic", body: "{ roadmapId, title, subtopicTitles }", returns: "Topic" },
  { method: "POST", path: "/api/chat", purpose: "Explanation, re-explanation or tutor chat", body: "{ title, stub, depth, sources? } | { title, mode } | { messages, context, sources? }", returns: "string[] | string | ChatMessage" },
  { method: "POST", path: "/api/practice/set", purpose: "Generate a practice set", body: "{ subtopicId, context }", returns: "PracticeSet" },
  { method: "POST", path: "/api/practice/answer", purpose: "Grade an answer (rules decide, model explains)", body: "{ questionId, subtopicId, optionId? | text?, prompt?, elapsedSec }", returns: "AnswerResult" },
  { method: "POST", path: "/api/practice/explanation", purpose: "Evaluate an explain-back", body: "{ subtopicId, text, source }", returns: "ExplanationEvaluation" },
  { method: "POST", path: "/api/recall", purpose: "Build a recall queue", body: "{ mode, scope, roadmap }", returns: "RecallQueue" },
  { method: "POST", path: "/api/recall/answer", purpose: "Grade a recall answer", body: "{ questionId, subtopicId, optionId? | text?, prompt?, elapsedSec }", returns: "AnswerResult" },
  { method: "POST", path: "/api/session", purpose: "Write the end-of-session recap", body: "{ session, roadmap, answered[] }", returns: "SessionSummary" },
  { method: "POST", path: "/api/embed", purpose: "Embed chunks or a query", body: "{ texts[], task: document | query }", returns: "{ model, embeddings[][] }" },
  { method: "POST", path: "/api/parse/youtube", purpose: "Fetch a YouTube video's title and captions as timestamped sections (no AI, no key)", body: "{ url }", returns: "{ title, author, url, sections }" },
];

export const API_AUTH =
  "There are no user accounts. The study routes read the learner's key from the x-provider-key header (with x-provider and optional x-provider-model), relay one request to that provider, and keep nothing; a missing key is a 401. The key-check and model-list routes take the key in the request body instead, and the YouTube route needs no key at all. Token usage comes back in the x-benkyo-usage response header for the in-app cost meter.";

/* --------------------------------------------- engineering topic sections */

export const DATA_LAYER: Topic[] = [
  { title: "Sources", body: "Typed or pasted text, PDF (PDF.js), PowerPoint (PPTX slide XML), YouTube captions (the video's own published caption track, cited by timestamp). No other web content is fetched." },
  { title: "Processing", body: "Material is split into overlapping chunks in the browser; chunks get BM25 statistics and, when a key is present, 768-dimension embeddings." },
  { title: "Storage", body: "Study state in localStorage (Zustand persist), files in the Origin Private File System, the retrieval index in IndexedDB. All per-browser." },
  { title: "Privacy", body: "No accounts, no database, no analytics. Routes are stateless relays. The API key is never shown after entry and is excluded from vault exports." },
];

export const AI_LAYER: Topic[] = [
  { title: "Models", body: "Gemini by default: a resolver lists the models the key can call, prefers Flash, caches the winner and fails over on 404, 429 or 503. OpenAI, Anthropic and local Ollama run through thin REST adapters." },
  { title: "Retrieval (RAG)", body: "Hybrid search: BM25 and cosine similarity fused with Reciprocal Rank Fusion. Passages are tagged [S1], [S2]… and the UI shows which ones a reply cited." },
  { title: "Personalisation", body: "Calibration sets the starting level; purpose and deadline set pacing; weak points and FSRS due dates decide what practice and recall pull in." },
  { title: "Explainability", body: "The model never decides whether an answer was right or why it was wrong. Rules do, from answer time and which option was chosen, so every diagnosis can be traced." },
];

export const PERFORMANCE: Topic[] = [
  { title: "Load profile", body: "Server work is one AI relay per learner action, with no database round trips, so routes scale horizontally on serverless hosting." },
  { title: "Client", body: "Heavy parsers (PDF.js, Mermaid) load only on the pages that use them. Retrieval runs locally, so search costs no network trip." },
  { title: "Cost", body: "Flash-class models by default, and the prompt carries only the top retrieved passages rather than whole documents." },
];

export const SECURITY: Topic[] = [
  { title: "Authentication", body: "None for learners, by design: there is nothing server-side to log in to. The /docs admin panel uses a server-side token (DOCS_ADMIN_TOKEN) and an httpOnly, SameSite=strict cookie holding a digest of it." },
  { title: "Access control", body: "One role: docs admin. Every admin Server Function re-checks the cookie rather than trusting the UI." },
  { title: "Data protection", body: "Keys live only in the learner's browser and travel to the route over the same origin; uploaded text is fenced as data so instructions hidden in notes are ignored; Ollama is restricted to loopback addresses." },
  { title: "Output safety", body: "Structured AI output is generated against a JSON Schema and validated with Zod; malformed output is rejected, never shown." },
];

export const ANALYTICS: Topic[] = [
  { title: "What we measure", body: "Nothing leaves the learner's browser, so there is no central analytics. The live panel above reads the viewer's own vault." },
  { title: "Learner KPIs (computed locally)", body: "Subtopics mastered, weak points resolved, FSRS reviews due versus done, sessions summarised, and AI spend per roadmap." },
  { title: "Activation (target)", body: "Share of new learners who reach their first diagnosed mistake in their first session — the moment the product proves its value." },
  { title: "Retention (target)", body: "Weekly active learners, and the share who return within 7 days for a recall session." },
  { title: "Learning outcome (target)", body: "Weak points resolved per learner per week, and recall accuracy on FSRS-due items over time." },
  { title: "How they'd be measured", body: "Only with explicit opt-in and aggregate, anonymous counts — never vault contents — consistent with the local-first design." },
];

export const ROADMAP: { horizon: string; items: string[] }[] = [
  { horizon: "Short term", items: ["Streaming chat replies", "Vault import (restore an export)", "Exam-night sharing for study groups"] },
  { horizon: "Mid term", items: ["Encrypted vault backup", "Teacher-shared roadmaps", "Opt-in, privacy-preserving usage metrics"] },
  { horizon: "Long term", items: ["Cross-subject learner record the learner owns", "Classroom mode for schools"] },
];

/* -------------------------------------------------------------- changelog */

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-10-09",
    title: "Docs as pitch deck + reliability fixes",
    items: [
      "/docs gains a pitch deck, team, feature matrix, API reference, search, export and admin-scheduled visibility.",
      "Correct answers are highlighted correctly after an MCQ; short answers are graded against the question actually asked.",
      "Failed AI calls now show a clear message instead of an endless loader, and a rejected key turns the header indicator red.",
    ],
  },
  { date: "2026-08-15", title: "Multiple roadmaps", items: ["Hold several roadmaps and switch between them", "Pop-ups and responsive layout across screens"] },
  { date: "2026-08-14", title: "Backend complete", items: ["AI routes connected for roadmaps, practice, recall and sessions", "Model choice and self-healing model resolution", "PDF, PPTX and YouTube parsing", "OPFS vault functions"] },
  { date: "2026-08-13", title: "Project start", items: ["Next.js 16 app scaffolded with the BenkyoAI file structure"] },
];
