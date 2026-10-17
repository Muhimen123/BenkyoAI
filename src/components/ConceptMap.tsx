"use client";

import { Card } from "@/components/ui/Card";
import { Mermaid } from "@/components/Mermaid";
import { Eyebrow } from "@/components/ui/Feedback";
import type { Roadmap, Subtopic } from "@/lib/types";

/** Mermaid labels sit inside double quotes; keep them from breaking out. */
function label(text: string) {
  return text.replace(/"/g, "#quot;").replace(/[<>]/g, "");
}

function nodeClass(sub: Subtopic) {
  if (sub.isWeakPoint) return "weak";
  if (sub.status === "mastered") return "mastered";
  if (sub.status === "in-progress") return "progress";
  return "fresh";
}

/** Builds a Mermaid flowchart: one box per topic, arrows from prerequisite to dependent. */
export function conceptMapDefinition(roadmap: Roadmap) {
  const ids = new Map<string, string>();
  const lines = ["flowchart TB"];
  roadmap.topics.forEach((topic, t) => {
    lines.push(`  subgraph T${t}["${label(topic.title)}"]`);
    topic.subtopics.forEach((sub) => {
      const id = `S${ids.size}`;
      ids.set(sub.id, id);
      lines.push(`    ${id}["${label(sub.title)}<br/>${sub.mastery}%"]:::${nodeClass(sub)}`);
    });
    lines.push("  end");
  });
  let edges = 0;
  for (const topic of roadmap.topics) {
    for (const sub of topic.subtopics) {
      for (const pre of sub.prerequisiteIds ?? []) {
        const from = ids.get(pre);
        const to = ids.get(sub.id);
        if (from && to) {
          lines.push(`  ${from} --> ${to}`);
          edges++;
        }
      }
    }
  }
  lines.push(
    "  classDef mastered fill:#e7e9d0,stroke:#a7a865,color:#2e2112",
    "  classDef progress fill:#f8ead0,stroke:#dd9c00,color:#2e2112",
    "  classDef weak fill:#fbefe9,stroke:#b4553a,stroke-width:2px,color:#2e2112",
    "  classDef fresh fill:#ffffff,stroke:#dbd1c1,color:#6b5a46",
  );
  return { definition: lines.join("\n"), edges };
}

/**
 * The roadmap as a prerequisite graph. When a learner shows a missing concept,
 * the store walks these arrows backwards and folds the foundation back in —
 * this view makes that reasoning visible.
 */
export function ConceptMap({ roadmap }: { roadmap: Roadmap }) {
  const { definition, edges } = conceptMapDefinition(roadmap);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Eyebrow>Concept map</Eyebrow>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">
            Arrows point from a foundation to what builds on it. A missing concept
            sends you back along an arrow.
          </p>
        </div>
        <ul className="flex flex-wrap gap-3 text-[12px] text-ink-soft">
          <Legend color="#a7a865" text="Mastered" />
          <Legend color="#dd9c00" text="In progress" />
          <Legend color="#b4553a" text="Weak point" />
        </ul>
      </div>
      {edges === 0 && (
        <p className="text-[12px] text-ink-faint">
          This roadmap was made before prerequisites were tracked. Regenerate it to
          see the arrows.
        </p>
      )}
      <Mermaid definition={definition} />
    </Card>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full border-2" style={{ borderColor: color }} />
      {text}
    </li>
  );
}
