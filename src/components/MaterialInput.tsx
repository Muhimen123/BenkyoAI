"use client";

import { useRef, useState } from "react";
import {
  FileAudio,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Presentation,
  StickyNote,
  Trash2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useStudyStore } from "@/store/useStudyStore";
import { useT, type TFn, type TpFn } from "@/lib/i18n/LocaleProvider";
import type { Material, MaterialKind } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { ingestFile, ingestSections } from "@/lib/rag";
import type { Section } from "@/lib/rag/extract";
import { youtubeVideoId } from "@/lib/rag/youtube";
import { deleteChunksFor } from "@/lib/rag/store";

const ICONS: Record<MaterialKind, typeof FileText> = {
  pdf: FileText,
  slides: Presentation,
  image: ImageIcon,
  audio: FileAudio,
  video: Video,
  note: StickyNote,
};

function kindFor(name: string): MaterialKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["ppt", "pptx", "key"].includes(ext)) return "slides";
  if (["png", "jpg", "jpeg", "heic", "webp"].includes(ext)) return "image";
  if (["mp3", "m4a", "wav", "aac"].includes(ext)) return "audio";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "note";
}

function indexLabel(material: Material, t: TFn, tp: TpFn) {
  if (material.status === "processing") return t("material.status.indexing");
  if (material.passages === undefined) return t("material.status.notIndexed");
  if (material.passages === 0) return t("material.status.storedOnly");
  const kind = material.semantic
    ? t("material.status.semantic")
    : t("material.status.keyword");
  return tp("material.status.indexed", material.passages, { kind });
}

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MaterialInput({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { t, tp } = useT();
  const materials = useStudyStore((s) => s.materials);
  const addMaterial = useStudyStore((s) => s.addMaterial);
  const removeMaterial = useStudyStore((s) => s.removeMaterial);
  const updateMaterial = useStudyStore((s) => s.updateMaterial);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const material = addMaterial({
        name: file.name,
        kind: kindFor(file.name),
        sizeLabel: sizeLabel(file.size),
        linkedTopicIds: [],
      });
      index(material.id, () => ingestFile(material, file));
    });
  }

  /** Extracts, chunks and embeds the material into the in-browser retrieval index. */
  function index(id: string, run: () => Promise<{ passages: number; semantic: boolean }>) {
    updateMaterial(id, { status: "processing" });
    run()
      .then((result) => updateMaterial(id, { status: "ready", ...result }))
      .catch(() => updateMaterial(id, { status: "ready", passages: 0, semantic: false }));
  }

  function remove(id: string) {
    removeMaterial(id);
    deleteChunksFor(id).catch(() => {});
  }

  function addNotes() {
    const text = notes.trim();
    if (!text) return;
    const material = addMaterial({
      name: text.split("\n")[0].slice(0, 60) || t("material.pastedNotes"),
      kind: "note",
      sizeLabel: t("material.words", { count: text.split(/\s+/).length }),
      linkedTopicIds: [],
    });
    index(material.id, () => ingestSections(material, [{ location: "notes", text }]));
    setNotes("");
    setShowNotes(false);
  }

  /** Indexes a YouTube lecture's captions, cited by timestamp like a page. */
  function addVideo() {
    const url = videoUrl.trim();
    if (!youtubeVideoId(url)) {
      setVideoError(t("material.videoInvalid"));
      return;
    }
    setVideoError(null);
    const material = addMaterial({ name: url, kind: "video", sizeLabel: "YouTube", linkedTopicIds: [] });
    index(material.id, async () => {
      const res = await fetch("/api/parse/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { title?: string; sections?: Section[]; message?: string };
      if (!res.ok || !data.sections) {
        setVideoError(data.message ?? t("material.videoCaptions"));
        throw new Error(data.message);
      }
      const name = data.title ?? url;
      updateMaterial(material.id, {
        name,
        sizeLabel: t("material.youtubeParts", { count: data.sections.length }),
      });
      return ingestSections({ id: material.id, name }, data.sections);
    });
    setVideoUrl("");
    setShowVideo(false);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border border-dashed px-4 py-5 transition-colors",
          dragging ? "border-gold-500 bg-gold-50" : "border-line-strong bg-surface",
          compact && "py-4",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Paperclip className="size-4 text-gold-500" />
          <p className="min-w-56 flex-1 text-sm text-ink-soft">
            {t("material.dropHint")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              {t("material.add")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNotes((v) => !v)}>
              {t("material.pasteNotes")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowVideo((v) => !v)}>
              {t("material.youtube")}
            </Button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {showVideo && (
          <div className="animate-rise mt-3 space-y-2">
            <Input
              value={videoUrl}
              placeholder={t("material.videoPlaceholder")}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && videoUrl.trim()) addVideo();
              }}
            />
            <p className="text-[13px] text-ink-faint">
              {t("material.videoHint")}
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowVideo(false)}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={addVideo} disabled={!videoUrl.trim()}>
                {t("material.addVideo")}
              </Button>
            </div>
          </div>
        )}
        {videoError && <p className="mt-2 text-[13px] text-clay-700">{videoError}</p>}
        {showNotes && (
          <div className="animate-rise mt-3 space-y-2">
            <Textarea
              rows={4}
              value={notes}
              placeholder={t("material.notesPlaceholder")}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowNotes(false)}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={addNotes} disabled={!notes.trim()}>
                {t("material.addNotes")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {materials.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {materials.map((material: Material) => {
            const Icon = ICONS[material.kind];
            return (
              <li key={material.id} className="group flex items-center gap-3 px-4 py-3">
                <Icon className="size-4 shrink-0 text-ink-faint" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{material.name}</p>
                  <p className="label-data text-ink-faint">
                    {material.kind} · {material.sizeLabel} · {relativeTime(material.addedAt)}
                    {" · "}
                    {indexLabel(material, t, tp)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(material.id)}
                  aria-label={t("material.removeAria", { name: material.name })}
                  className="rounded-md p-1.5 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-sunk hover:text-clay-700 focus-visible:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
