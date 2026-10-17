/** The whole of /docs as one Markdown file, built from the same content. */
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
  type Topic,
} from "./content";

const cell = (s: string) => s.replace(/\|/g, "\\|");

function topics(title: string, items: Topic[]) {
  return [`## ${title}`, "", ...items.map((t) => `**${t.title}.** ${t.body}\n`)].join("\n");
}

function mermaid(title: string, definition: string) {
  return `## ${title}\n\n\`\`\`mermaid\n${definition}\n\`\`\`\n`;
}

export function docsMarkdown(stack: { name: string; version: string }[] = []) {
  const out: string[] = ["# BenkyoAI", "", "A tutor that diagnoses, remembers and belongs to the learner.", ""];

  const pitch = (block: (typeof PITCH)[number]) =>
    out.push(
      `## ${block.title}`,
      "",
      `**${block.headline}**`,
      "",
      ...block.points.map((p) => `- ${p}`),
      "",
      ...(block.sources?.length
        ? ["Sources:", "", ...block.sources.map((s) => `- [${s.label}](${s.url})`), ""]
        : []),
    );

  // Same order as the page: the deck, then the team, then the vision.
  out.push("# Pitch", "");
  PITCH.filter((b) => b.id !== "vision").forEach(pitch);

  out.push(`## Team${TEAM.name ? ` — ${TEAM.name}` : ""}`, "");
  for (const m of TEAM.members) {
    out.push(`- **${m.name}** — ${m.role}${m.email ? ` · ${m.email}` : ""}`);
  }
  out.push("");
  PITCH.filter((b) => b.id === "vision").forEach(pitch);

  out.push("# Product and engineering", "");

  out.push(topics("Product overview", OVERVIEW));

  out.push("## Feature matrix", "", "| Feature | Area | Status | Note |", "|---|---|---|---|");
  for (const f of FEATURES) out.push(`| ${cell(f.name)} | ${f.area} | ${f.status} | ${cell(f.note)} |`);
  out.push("");

  out.push(mermaid("The learning loop", LOOP));
  out.push(mermaid("Architecture", ARCHITECTURE));
  out.push(mermaid("Data flow", DATA_FLOW));

  if (stack.length) {
    out.push("## Technology stack", "", ...stack.map((s) => `- ${s.name} ${s.version}`), "");
  }

  out.push("## API reference", "", API_AUTH, "", "| Method | Path | Purpose | Body | Returns |", "|---|---|---|---|---|");
  for (const e of API) {
    out.push(`| ${e.method} | \`${e.path}\` | ${cell(e.purpose)} | \`${cell(e.body)}\` | \`${cell(e.returns)}\` |`);
  }
  out.push("");

  out.push(topics("Data layer", DATA_LAYER));
  out.push(topics("AI layer", AI_LAYER));
  out.push(topics("Performance and scalability", PERFORMANCE));
  out.push(topics("Security", SECURITY));
  out.push(topics("Analytics", ANALYTICS));

  out.push("## Product roadmap", "");
  for (const r of ROADMAP) out.push(`### ${r.horizon}`, "", ...r.items.map((i) => `- ${i}`), "");

  out.push("## Changelog", "");
  for (const c of CHANGELOG) out.push(`### ${c.date} — ${c.title}`, "", ...c.items.map((i) => `- ${i}`), "");

  return out.join("\n");
}
