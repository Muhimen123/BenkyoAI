"use client";

import { useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useT } from "@/lib/i18n/LocaleProvider";
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
  const { t } = useT();

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
        {t("roadmap.controls.addByMyself")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<SlidersHorizontal className="size-4" />}
        onClick={() => setPromptOpen(true)}
      >
        {t("roadmap.controls.modifyPrompt")}
      </Button>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("roadmap.controls.addTitle")}
        description={t("roadmap.controls.addDescription")}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handleAdd} loading={busy} disabled={!title.trim()}>
              {t("roadmap.controls.addTopic")}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label={t("roadmap.controls.topicLabel")} htmlFor="new-topic">
            <Input
              id="new-topic"
              value={title}
              autoFocus
              placeholder={t("roadmap.controls.topicPlaceholder")}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field
            label={t("roadmap.controls.subtopicsLabel")}
            htmlFor="new-subtopics"
            optional
            hint={t("roadmap.controls.subtopicsHint")}
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
        title={t("roadmap.controls.modifyTitle")}
        description={t("roadmap.controls.modifyDescription")}
        width="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPromptOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handlePrompt} loading={busy}>
              {t("roadmap.controls.rebuild")}
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
            {t("roadmap.controls.rebuildNote")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
