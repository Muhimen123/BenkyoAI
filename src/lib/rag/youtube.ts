/**
 * YouTube lectures as study material: the video's own captions, grouped into
 * timestamped sections so a cited passage points at a moment in the video the
 * way a PDF passage points at a page. No AI involved: if a video has no
 * captions, nothing is invented in their place.
 */
import type { Section } from "./extract";

const ID = /^[a-zA-Z0-9_-]{11}$/;

/** The 11-character video id from a watch, youtu.be, shorts or embed link (or a bare id). */
export function youtubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (ID.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null | undefined;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    id = first === "shorts" || first === "embed" || first === "live" ? second : url.searchParams.get("v");
  }
  return id && ID.test(id) ? id : null;
}

export interface CaptionLine {
  text: string;
  /** Start time in milliseconds. */
  offset: number;
}

function timestamp(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Caption entities YouTube leaves encoded, e.g. &amp;#39; → '. */
function decode(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Groups caption lines into sections of about `windowSec`, each labelled with its start time. */
export function transcriptSections(lines: CaptionLine[], windowSec = 90): Section[] {
  const sections: Section[] = [];
  let start = -1;
  let parts: string[] = [];
  const flush = () => {
    if (parts.length) sections.push({ location: `at ${timestamp(start)}`, text: parts.join(" ") });
    parts = [];
  };
  for (const line of lines) {
    const text = decode(line.text);
    if (!text) continue;
    if (start < 0 || line.offset - start >= windowSec * 1000) {
      flush();
      start = line.offset;
    }
    parts.push(text);
  }
  flush();
  return sections;
}
