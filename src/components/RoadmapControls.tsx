"use client";

import { useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { addManualTopic, regenerateRoadmap } from "@/lib/api/roadmap";
import { useStudyStore } from "@/store/useStudyStore";
import type { Roadmap } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_PROMPT = (roadmap: Roadmap) =>
  `Build a roadmap for "${roadmap.title}" for someone learning it ${
    roadmap.purpose === "exam" ? "for an exam" : `for a ${roadmap.purpose}`
  }. Order topics so nothing depends on something later. Keep subtopics small enough to finish in one sitting.`;

export function RoadmapControls({
  roadmap,
  className,
}: {
  roadmap: Roadmap;
  className?: string;
}) {
  const addTopic = useStudyStore((s) => s.addTopic);
  const setRoadmap = useStudyStore((s) => s.setRoadmap);

  const [addOpen, setAddOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtopics, setSubtopics] = useState("");
  const [prompt, setPrompt] = useState(roadmap.promptOverride ?? DEFAULT_PROMPT(roadmap));
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    setBusy(true);
    try {
      const topic = await addManualTopic(
        roadmap.id,
        title,
        subtopics.split("\n").map((s) => s.trim()).filter(Boolean),
      );
      addTopic(topic);
      setTitle("");
      setSubtopics("");
      setAddOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function handlePrompt() {
    setBusy(true);
    try {
      const updated = await regenerateRoadmap(roadmap, prompt);
      setRoadmap(updated);
      setPromptOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        variant="secondary"
        size="sm"
        icon={<Plus className="size-4" />}
        onClick={() => setAddOpen(true)}
      >
        Add by myself
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<SlidersHorizontal className="size-4" />}
        onClick={() => setPromptOpen(true)}
      >
        Modify prompt
      </Button>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a topic yourself"
        description="Anything the roadmap missed — a chapter your lecturer added, a gap you noticed."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} loading={busy} disabled={!title.trim()}>
              Add topic
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Topic" htmlFor="new-topic">
            <Input
              id="new-topic"
              value={title}
              autoFocus
              placeholder="e.g. Stereochemistry of ring systems"
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field
            label="Subtopics"
            htmlFor="new-subtopics"
            optional
            hint="One per line. Leave it blank and BenkyoAI fills them in when you open the topic."
          >
            <Textarea
              id="new-subtopics"
              rows={4}
              value={subtopics}
              placeholder={"Chair conformations\nAxial vs equatorial"}
              onChange={(e) => setSubtopics(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Modify the instruction"
        description="This is what BenkyoAI works from when it builds or adjusts your roadmap. Edit it directly."
        width="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPromptOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handlePrompt} loading={busy}>
              Rebuild roadmap
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            rows={7}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="font-mono text-[13px]"
          />
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Rebuilding keeps your mastery on topics that survive the change.
            Anything that disappears takes its practice history with it.
          </p>
        </div>
      </Modal>
    </div>
  );
}
