import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/shell/Wordmark";
import { Mermaid } from "@/components/Mermaid";
import { DocsLiveStats } from "@/components/DocsLiveStats";

export const metadata: Metadata = {
  title: "BenkyoAI — How it works",
  description:
    "Architecture, AI pipeline, retrieval, spaced repetition, MCP server and privacy model of BenkyoAI.",
};

const ARCHITECTURE = `flowchart LR
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
  Gemini["Gemini API<br/>learner's own key"]
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

const LOOP = `flowchart LR
  A["Assess level"] --> B["Plan roadmap<br/>+ prerequisite graph"]
  B --> C["Teach<br/>grounded in own material"]
  C --> D["Test<br/>trap options + explain-back"]
  D --> E["Diagnose<br/>careless / misunderstanding / missing concept"]
  E -- "missing concept" --> F["Walk back to prerequisite"]
  E --> G["Remember<br/>session summary + carry-over"]
  F --> G
  G --> H["Recall<br/>FSRS-scheduled"]
  H --> C`;

export default function DocsPage() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Wordmark size="sm" />
          </Link>
          <nav className="flex gap-4 text-[13px] font-medium text-ink-soft">
            <a href="https://github.com/Muhimen123/BenkyoAI" className="hover:text-ink">
              GitHub
            </a>
            <Link href="/dashboard" className="hover:text-ink">
              Open the app
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-14 px-4 py-10 sm:px-6 sm:py-14">
        <section className="space-y-4">
          <p className="label-data text-gold-700">Documentation</p>
          <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink sm:text-[38px]">
            A tutor that diagnoses, remembers and belongs to the learner
          </h1>
          <p className="max-w-2xl text-[16px] leading-relaxed text-ink-soft">
            BenkyoAI turns a topic or a learner&apos;s own notes into an adaptive
            roadmap, works out <em>why</em> each mistake happened, and brings weak
            points back on a schedule until they hold. It runs on the learner&apos;s
            own AI key, and every byte of their study history stays in their browser.
          </p>
        </section>

        <Section title="Your vault, live" lede="Read from this browser. There is no server-side copy to show.">
          <DocsLiveStats />
        </Section>

        <Section title="The learning loop">
          <Mermaid definition={LOOP} />
        </Section>

        <Section title="Architecture">
          <Mermaid definition={ARCHITECTURE} />
        </Section>

        <Section title="What makes it different">
          <ul className="grid gap-3 sm:grid-cols-2">
            <Point title="The model does not judge alone">
              Correctness and mistake type come from deterministic code: answer time
              and whether the misconception trap was chosen. The model only explains,
              so every diagnosis is auditable.
            </Point>
            <Point title="Contract-bound AI output">
              Every structured response is generated against a JSON Schema built from
              a Zod schema, then validated again before use. Malformed output is
              rejected, never shown.
            </Point>
            <Point title="Missing concept → foundation">
              Roadmaps carry a prerequisite graph. A missing-concept mistake walks
              one step back along it and folds the foundation in for review.
            </Point>
            <Point title="Forgetting is scheduled">
              Each answer is an FSRS review (careless = Hard, misunderstanding or
              missing concept = Again). Recall pulls subtopics in when they are
              predicted to fade.
            </Point>
            <Point title="Grounded in the learner's material">
              PDFs, slides and notes are chunked and indexed in the browser. Hybrid
              BM25 + embedding search (Reciprocal Rank Fusion) feeds cited passages
              into explanations and chat.
            </Point>
            <Point title="Private by architecture">
              No accounts, no database. Routes are stateless relays. Uploaded text is
              fenced as data so instructions hidden in notes are not obeyed.
            </Point>
          </ul>
        </Section>

        <Section title="AI pipeline">
          <Table
            head={["Role", "Route", "Output contract"]}
            rows={[
              ["Summariser", "/api/summarize", "SummarySchema"],
              ["Curriculum designer", "/api/roadmap", "RoadmapSchema (with prerequisites)"],
              ["Socratic tutor", "/api/chat", "Paragraphs / text with [S#] citations"],
              ["Examiner", "/api/practice/set", "PracticeSetSchema (trap option required)"],
              ["Hybrid grader", "/api/practice/answer", "Rules decide; McqFeedbackSchema explains"],
              ["Explain-back evaluator", "/api/practice/explanation", "ExplainBackSchema"],
              ["Recall coach", "/api/recall", "RecallSetSchema, FSRS-ordered"],
              ["Session historian", "/api/session", "SessionSummarySchema (carry-over)"],
              ["Embedder", "/api/embed", "gemini-embedding-001, 768 dimensions"],
            ]}
          />
          <p className="text-[13px] leading-relaxed text-ink-soft">
            A self-healing resolver finds which Gemini models the learner&apos;s key can
            call, prefers fast Flash models, caches the winner and fails over on
            404, 429 or 503. Each response reports its token usage back to the
            browser for the cost meter.
          </p>
        </Section>

        <Section title="MCP server" lede="Study from Claude Desktop, Claude Code, Cursor or any MCP client.">
          <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-ink-soft">
            <li>Settings → Export my vault (the file never contains the API key).</li>
            <li>Add the server to the MCP client:</li>
          </ol>
          <pre className="overflow-x-auto rounded-lg border border-line bg-sunk p-4 text-[12px] leading-relaxed text-ink">
{`{
  "mcpServers": {
    "benkyoai": {
      "command": "node",
      "args": ["<repo>/mcp/server.mjs", "<path>/benkyoai-vault.json"]
    }
  }
}`}
          </pre>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Tools: list_roadmaps, get_roadmap, get_weak_points, get_due_reviews,
            get_session_history, get_study_plan, get_usage. Prompts: quiz_me,
            explain_back. Read-only, stdio only, re-reads the file on every call.
          </p>
        </Section>

        <Section title="Quality and safety">
          <Table
            head={["Check", "How"]}
            rows={[
              ["AI output shape", "JSON Schema at generation + Zod validation"],
              ["Prompt injection from uploads", "Material fenced as data; instructions inside are ignored"],
              ["Mistake diagnosis", "Deterministic rules, unit-tested"],
              ["Retrieval", "BM25, cosine, RRF and chunking unit-tested"],
              ["Scheduling", "FSRS grading unit-tested"],
              ["MCP server", "End-to-end test through a real MCP client"],
              ["Credentials", "Key never displayed after entry; never exported"],
            ]}
          />
        </Section>

        <Section title="Stack">
          <p className="text-[14px] leading-relaxed text-ink-soft">
            Next.js 16, React 19, Tailwind CSS v4, Zustand, Zod, Google Gen AI SDK,
            ts-fsrs, Mermaid, PDF.js, Model Context Protocol SDK. Deployed on Vercel.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[20px] font-semibold tracking-tight text-ink">{title}</h2>
        {lede && <p className="mt-1 text-[13px] text-ink-soft">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

function Point({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{children}</p>
    </li>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <thead className="bg-sunk text-ink-faint">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface text-ink-soft">
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? "px-4 py-2.5 font-medium text-ink" : "px-4 py-2.5"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
