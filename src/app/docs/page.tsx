import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Mermaid } from "@/components/Mermaid";
import { DocsLiveStats } from "@/components/DocsLiveStats";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsNav, type NavSection } from "@/components/docs/DocsNav";
import { TeamGrid, TodoTag } from "@/components/docs/TeamGrid";
import { getDocsStatus, isAdmin } from "@/lib/docs/accessServer";
import type { DocsAccessStatus } from "@/lib/docs/access";
import {
  AI_LAYER,
  ANALYTICS,
  API,
  API_AUTH,
  ARCHITECTURE,
  CHANGELOG,
  DATA_FLOW,
  DATA_LAYER,
  FEATURES,
  LOOP,
  OVERVIEW,
  PERFORMANCE,
  PITCH,
  ROADMAP,
  SECURITY,
  TEAM,
  type FeatureStatus,
  type Topic,
} from "@/lib/docs/content";
import { docsMarkdown } from "@/lib/docs/markdown";
import pkg from "../../../package.json";

const DESCRIPTION =
  "Pitch, architecture, AI pipeline, API, retrieval, spaced repetition, MCP server and privacy model of BenkyoAI.";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { visible } = getDocsStatus();
  return {
    title: "BenkyoAI — How it works",
    description: DESCRIPTION,
    // Outside its window the page says "not available"; keep that out of search.
    ...(!visible && { robots: { index: false, follow: false } }),
  };
}

/** The stack, read from package.json so the versions shown are the ones shipped. */
const STACK: { label: string; deps: string[] }[] = [
  { label: "Frontend", deps: ["next", "react", "tailwindcss", "zustand", "lucide-react"] },
  { label: "Server", deps: ["next", "zod", "@modelcontextprotocol/sdk"] },
  { label: "AI", deps: ["@google/genai", "ts-fsrs"] },
  { label: "Parsing and diagrams", deps: ["pdfjs-dist", "youtube-transcript", "mermaid"] },
  { label: "Language and tooling", deps: ["typescript", "eslint", "tsx"] },
];

function versionOf(name: string) {
  const all: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
  return all[name]?.replace(/^[\^~]/, "");
}

const stackList = STACK.flatMap((g) =>
  g.deps.map((name) => ({ name, version: versionOf(name) ?? "" })),
).filter((d, i, all) => d.version && all.findIndex((x) => x.name === d.name) === i);

const SECTIONS: NavSection[] = [
  ...PITCH.filter((p) => p.id !== "vision").map((p) => ({ id: p.id, title: p.title, group: "Pitch" })),
  { id: "team", title: "Team", group: "Pitch" },
  { id: "vision", title: "Vision", group: "Pitch" },
  { id: "overview", title: "Product overview", group: "Product" },
  { id: "live", title: "Your vault, live", group: "Product" },
  { id: "features", title: "Feature matrix", group: "Product" },
  { id: "loop", title: "The learning loop", group: "Product" },
  { id: "product-roadmap", title: "Product roadmap", group: "Product" },
  { id: "architecture", title: "Architecture", group: "Engineering" },
  { id: "data-flow", title: "Data flow", group: "Engineering" },
  { id: "different", title: "What makes it different", group: "Engineering" },
  { id: "stack", title: "Technology stack", group: "Engineering" },
  { id: "ai", title: "AI layer", group: "Engineering" },
  { id: "api", title: "API reference", group: "Engineering" },
  { id: "data-layer", title: "Data layer", group: "Engineering" },
  { id: "mcp", title: "MCP server", group: "Engineering" },
  { id: "performance", title: "Performance", group: "Engineering" },
  { id: "security", title: "Security", group: "Engineering" },
  { id: "quality", title: "Quality and safety", group: "Engineering" },
  { id: "analytics", title: "Analytics", group: "Engineering" },
  { id: "changelog", title: "Changelog", group: "History" },
];

const STATUS_STYLE: Record<FeatureStatus, string> = {
  live: "bg-sage-50 text-sage-700 border-sage-100",
  beta: "bg-gold-50 text-gold-700 border-gold-200",
  upcoming: "bg-maize-50 text-maize-700 border-maize-100",
  planned: "bg-sunk text-ink-soft border-line",
};

export default async function DocsPage() {
  await connection();
  const status = getDocsStatus();
  const admin = await isAdmin();

  if (!status.visible && !admin) return <DocsClosed status={status} />;

  const markdown = docsMarkdown(stackList);
  const vision = PITCH.find((p) => p.id === "vision")!;

  return (
    <div className="min-h-dvh bg-paper">
      <DocsHeader>
        {admin && (
          <Link href="/docs/admin" className="hover:text-ink">
            Admin
          </Link>
        )}
      </DocsHeader>

      {admin && !status.visible && (
        <p className="docs-chrome border-b border-maize-100 bg-maize-50 px-4 py-2 text-center text-[13px] text-maize-700">
          Admin preview — visitors currently see “not available”.{" "}
          <Link href="/docs/admin" className="underline">
            Change visibility
          </Link>
        </p>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="max-w-3xl space-y-4">
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
          <p className="text-[13px] text-ink-faint">
            Two minutes: read the pitch. Ten minutes: the architecture, AI layer and API.
          </p>
        </section>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 print:block">
          <aside className="docs-chrome min-w-0 lg:relative">
            <DocsNav sections={SECTIONS} markdown={markdown} />
          </aside>

          <main className="min-w-0 space-y-14">
            <GroupHeading id="Pitch">The pitch</GroupHeading>
            {PITCH.filter((p) => p.id !== "vision").map((block) => (
              <Section key={block.id} id={block.id} title={block.title} todo={block.todo}>
                <PitchBody headline={block.headline} points={block.points} sources={block.sources} />
              </Section>
            ))}
            <Section id="team" title="Team" lede={TEAM.name}>
              <TeamGrid members={TEAM.members} />
            </Section>
            <Section id="vision" title={vision.title}>
              <PitchBody headline={vision.headline} points={vision.points} />
            </Section>

            <GroupHeading id="Product">The product</GroupHeading>
            <Section id="overview" title="Product overview">
              <Topics items={OVERVIEW} />
            </Section>
            <Section id="live" title="Your vault, live" lede="Read from this browser. There is no server-side copy to show.">
              <DocsLiveStats />
            </Section>
            <Section id="features" title="Feature matrix" lede="Live means shipped in this build.">
              <Table
                head={["Feature", "Area", "Status", "Note"]}
                rows={FEATURES.map((f) => [
                  f.name,
                  f.area,
                  <span key="s" className={`inline-block rounded border px-1.5 py-px text-[11px] font-medium ${STATUS_STYLE[f.status]}`}>
                    {f.status}
                  </span>,
                  f.note,
                ])}
              />
            </Section>
            <Section id="loop" title="The learning loop">
              <Mermaid definition={LOOP} />
            </Section>
            <Section id="product-roadmap" title="Product roadmap">
              <div className="grid gap-3 sm:grid-cols-3">
                {ROADMAP.map((r) => (
                  <div key={r.horizon} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-[14px] font-semibold text-ink">{r.horizon}</p>
                    <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-soft">
                      {r.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <GroupHeading id="Engineering">Engineering</GroupHeading>
            <Section id="architecture" title="Architecture">
              <Mermaid definition={ARCHITECTURE} />
            </Section>
            <Section id="data-flow" title="Data flow" lede="Input → processing → AI → output → feedback.">
              <Mermaid definition={DATA_FLOW} />
            </Section>
            <Section id="different" title="What makes it different">
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
            <Section id="stack" title="Technology stack" lede="Versions read from package.json at build time. Deployed on Vercel.">
              <div className="grid gap-3 sm:grid-cols-2">
                {STACK.map((g) => (
                  <div key={g.label} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-[14px] font-semibold text-ink">{g.label}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {g.deps
                        .filter((d) => versionOf(d))
                        .map((d) => (
                          <li key={d} className="rounded border border-line bg-sunk px-1.5 py-0.5 text-[12px] text-ink-soft">
                            {d} <span className="text-ink-faint tabular-nums">{versionOf(d)}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
            <Section id="ai" title="AI layer">
              <Topics items={AI_LAYER} />
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
                Each response reports its token usage back to the browser for the cost meter.
              </p>
            </Section>
            <Section id="api" title="API reference" lede={`${API.length} endpoints, all stateless.`}>
              <p className="text-[13px] leading-relaxed text-ink-soft">{API_AUTH}</p>
              <Table
                head={["Endpoint", "Purpose", "Body", "Returns"]}
                rows={API.map((e) => [
                  <span key="p" className="font-mono text-[12px] whitespace-nowrap">
                    <span className="text-gold-700">{e.method}</span> {e.path}
                  </span>,
                  e.purpose,
                  <code key="b" className="text-[12px]">{e.body}</code>,
                  <code key="r" className="text-[12px]">{e.returns}</code>,
                ])}
              />
            </Section>
            <Section id="data-layer" title="Data layer">
              <Topics items={DATA_LAYER} />
            </Section>
            <Section id="mcp" title="MCP server" lede="Study from Claude Desktop, Claude Code, Cursor or any MCP client.">
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
                explain_back. Read-only, stdio or loopback Streamable HTTP, re-reads the file on every call.
              </p>
            </Section>
            <Section id="performance" title="Performance and scalability">
              <Topics items={PERFORMANCE} />
            </Section>
            <Section id="security" title="Security">
              <Topics items={SECURITY} />
            </Section>
            <Section id="quality" title="Quality and safety">
              <Table
                head={["Check", "How"]}
                rows={[
                  ["AI output shape", "JSON Schema at generation + Zod validation"],
                  ["Prompt injection from uploads", "Material fenced as data; instructions inside are ignored"],
                  ["Mistake diagnosis", "Deterministic rules, unit-tested"],
                  ["Retrieval", "BM25, cosine, RRF and chunking unit-tested"],
                  ["Scheduling", "FSRS grading unit-tested"],
                  ["MCP server", "End-to-end test through a real MCP client"],
                  ["API reference", "Checked against the real routes by a unit test"],
                  ["Credentials", "Key never displayed after entry; never exported"],
                ]}
              />
            </Section>
            <Section id="analytics" title="Analytics" lede="Targets the team proposes; nothing is collected today.">
              <Topics items={ANALYTICS} />
            </Section>

            <GroupHeading id="History">History</GroupHeading>
            <Section id="changelog" title="Changelog">
              <ol className="space-y-5 border-l border-line pl-5">
                {CHANGELOG.map((c) => (
                  <li key={c.date} className="relative">
                    <span className="absolute top-1.5 -left-[25px] size-2 rounded-full bg-gold-500" />
                    <p className="label-data text-ink-faint tabular-nums">{c.date}</p>
                    <p className="mt-0.5 text-[14px] font-semibold text-ink">{c.title}</p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-ink-soft">
                      {c.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- closed page */

function DocsClosed({ status }: { status: DocsAccessStatus }) {
  const fmt = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }) + " UTC"
      : "";
  const line =
    status.state === "scheduled"
      ? `The docs open on ${fmt(status.config.start)}.`
      : status.state === "ended"
        ? `The docs were available until ${fmt(status.config.end)}.`
        : "The docs aren't public right now.";
  return (
    <div className="min-h-dvh bg-paper">
      <DocsHeader />
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="label-data text-gold-700">Documentation</p>
        <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-tight text-ink">
          Not available
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{line}</p>
        <Link
          href="/"
          className="mt-8 inline-block text-[14px] font-medium text-gold-700 hover:underline"
        >
          Go to BenkyoAI
        </Link>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------ primitives */

/** "To fill in: which plan…" → "Which plan…" (the tag says the rest). */
function withoutTodoPrefix(text: string) {
  const rest = text.replace(/^To fill in:\s*/, "");
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

function GroupHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={`group-${id}`} className="label-data border-b border-line pb-2 text-gold-700">
      {children}
    </p>
  );
}

function Section({
  id,
  title,
  lede,
  todo,
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  todo?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4 lg:scroll-mt-8">
      <div>
        <h2 className="group text-[20px] font-semibold tracking-tight text-ink">
          <a href={`#${id}`} className="hover:underline">
            {title}
          </a>
          {todo && <TodoTag />}
          <a
            href={`#${id}`}
            aria-label={`Link to ${title}`}
            className="docs-chrome ml-2 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </a>
        </h2>
        {lede && <p className="mt-1 text-[13px] text-ink-soft">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

function PitchBody({
  headline,
  points,
  sources,
}: {
  headline: string;
  points: string[];
  sources?: { label: string; url: string }[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-[17px] leading-snug font-medium text-ink">{headline}</p>
      <ul className="space-y-2">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-gold-500" />
            <span>
              {p.startsWith("To fill in") ? (
                <>
                  {withoutTodoPrefix(p)}
                  <TodoTag />
                </>
              ) : (
                p
              )}
            </span>
          </li>
        ))}
      </ul>
      {sources && sources.length > 0 && (
        <div className="border-t border-line pt-3">
          <p className="label-data text-ink-faint">Sources</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[12px] leading-snug text-ink-soft">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Topics({ items }: { items: Topic[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((t) => (
        <Point key={t.title} title={t.title}>
          {t.body.startsWith("To fill in") ? (
            <>
              {withoutTodoPrefix(t.body)}
              <TodoTag />
            </>
          ) : (
            t.body
          )}
        </Point>
      ))}
    </ul>
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

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[520px] text-left text-[13px]">
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
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? "px-4 py-2.5 align-top font-medium text-ink" : "px-4 py-2.5 align-top"}>
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
