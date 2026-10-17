/**
 * Retrieval-augmented study over the learner's own material.
 *
 * Ingest: extract located sections → chunk → embed with the learner's key →
 * store in IndexedDB. Retrieve: BM25 + embedding search fused with RRF. The
 * top passages are sent with explanation and chat requests as numbered
 * sources the tutor must cite, so answers are grounded in the learner's notes.
 */
import { request } from "@/lib/api/client";
import { readCredentials } from "@/lib/byokVault";
import { uid } from "@/lib/utils";
import { extractSections, type Section } from "./extract";
import { allChunks, putChunks } from "./store";
import { chunkSections, hybridSearch, type Chunk } from "./search";

export interface Source {
  /** Citation tag the tutor uses, e.g. "S1". */
  tag: string;
  label: string;
  text: string;
}

async function embed(texts: string[], task: "document" | "query"): Promise<number[][] | null> {
  // Embeddings run on Gemini. Other providers get keyword search, and their
  // keys are never sent to Google.
  if (readCredentials()?.provider !== "google") return null;
  try {
    const res = await request<{ texts: string[]; task: string }, { embeddings: number[][] }>(
      "/api/embed",
      { texts, task },
    );
    return res.embeddings.length === texts.length ? res.embeddings : null;
  } catch {
    // No key or embedding failure: the index still works on keywords alone.
    return null;
  }
}

export async function ingestSections(
  material: { id: string; name: string },
  sections: Section[],
): Promise<{ passages: number; semantic: boolean }> {
  const pieces = chunkSections(sections);
  if (!pieces.length) return { passages: 0, semantic: false };
  const vectors = await embed(pieces.map((p) => p.text), "document");
  const chunks: Chunk[] = pieces.map((p, i) => ({
    ...p,
    id: uid("ch"),
    materialId: material.id,
    materialName: material.name,
    embedding: vectors?.[i],
  }));
  await putChunks(chunks);
  return { passages: chunks.length, semantic: Boolean(vectors) };
}

export async function ingestFile(material: { id: string; name: string }, file: File) {
  return ingestSections(material, await extractSections(file));
}

export async function retrieve(query: string, limit = 4): Promise<Source[]> {
  const chunks = await allChunks().catch(() => []);
  if (!chunks.length) return [];
  const hasVectors = chunks.some((c) => c.embedding?.length);
  const [queryVector] = (hasVectors ? await embed([query], "query") : null) ?? [null];
  return hybridSearch(query, chunks, queryVector, limit).map((hit, i) => ({
    tag: `S${i + 1}`,
    label: `${hit.chunk.materialName}, ${hit.chunk.location}`,
    text: hit.chunk.text,
  }));
}

/** The learner's material as plain text, in upload order, capped for the summariser. */
export async function materialText(materialIds: string[], maxChars = 24000) {
  const ids = new Set(materialIds);
  const chunks = (await allChunks().catch(() => [])).filter((c) => ids.has(c.materialId));
  let text = "";
  for (const c of chunks) {
    if (text.length + c.text.length > maxChars) break;
    text += `[${c.materialName}, ${c.location}]\n${c.text}\n\n`;
  }
  return text;
}
