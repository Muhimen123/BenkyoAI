/**
 * Turns a learner's material into located text sections, entirely in the
 * browser: PDFs page by page (pdf.js), slides one by one (PPTX XML), and
 * text-like files as-is. Each section keeps where it came from, so retrieved
 * passages can be cited back as "lecture.pdf, p. 4" or "deck.pptx, slide 7".
 *
 * Images, audio and video are kept in the vault but not extracted.
 */
import { listZipEntries, readZipEntry } from "./zip";

export interface Section {
  /** Human-readable place in the source, e.g. "p. 4" or "slide 7". */
  location: string;
  text: string;
}

const TEXT_EXTENSIONS = ["txt", "md", "markdown", "csv", "json", "html", "htm"];

export function extractableKind(name: string): "pdf" | "pptx" | "text" | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "pptx") return "pptx";
  if (TEXT_EXTENSIONS.includes(ext)) return "text";
  return null;
}

export async function extractSections(file: File): Promise<Section[]> {
  switch (extractableKind(file.name)) {
    case "pdf":
      return extractPdf(file);
    case "pptx":
      return extractPptx(await file.arrayBuffer());
    case "text":
      return [{ location: "full text", text: await file.text() }];
    default:
      return [];
  }
}

async function extractPdf(file: File): Promise<Section[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const sections: Section[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
      .join("")
      .trim();
    if (text) sections.push({ location: `p. ${i}`, text });
  }
  return sections;
}

const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

/** Pulls the visible text runs out of one slide's DrawingML, a line per paragraph. */
export function slideText(xml: string) {
  return xml
    .split("</a:p>")
    .map((paragraph) =>
      [...paragraph.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
        .map((m) => m[1].replace(/&(amp|lt|gt|quot|apos);/g, (e) => XML_ENTITIES[e]))
        .join(""),
    )
    .filter((line) => line.trim())
    .join("\n");
}

export async function extractPptx(buffer: ArrayBuffer): Promise<Section[]> {
  const slides = listZipEntries(buffer)
    .map((entry) => ({ entry, n: Number(entry.name.match(/^ppt\/slides\/slide(\d+)\.xml$/)?.[1]) }))
    .filter((s) => s.n > 0)
    .sort((a, b) => a.n - b.n);
  const sections: Section[] = [];
  for (const { entry, n } of slides) {
    const text = slideText(await readZipEntry(buffer, entry));
    if (text) sections.push({ location: `slide ${n}`, text });
  }
  return sections;
}
