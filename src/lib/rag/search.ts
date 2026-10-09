/**
 * Chunking and hybrid retrieval over the learner's own material.
 *
 * Keyword (BM25) and semantic (embedding cosine) rankings are fused with
 * Reciprocal Rank Fusion, so an exact term from the syllabus and a paraphrase
 * of it both find the right passage. If no embeddings exist (no key, or the
 * embedding call failed) retrieval degrades to BM25 alone instead of failing.
 */
import type { Section } from "./extract";

export interface Chunk {
  id: string;
  materialId: string;
  materialName: string;
  location: string;
  text: string;
  embedding?: number[];
}

export interface Hit {
  chunk: Chunk;
  score: number;
}

const CHUNK_CHARS = 900;
const OVERLAP_CHARS = 150;

/**
 * Splits sections into ~900-character chunks on paragraph and sentence
 * boundaries, overlapping by ~150 characters so an idea cut at a boundary
 * still appears whole in one chunk. Chunks never cross pages or slides.
 */
export function chunkSections(sections: Section[]): Omit<Chunk, "id" | "materialId" | "materialName">[] {
  const chunks: Omit<Chunk, "id" | "materialId" | "materialName">[] = [];
  for (const section of sections) {
    const pieces = section.text
      .replace(/\r/g, "")
      .split(/\n\s*\n|(?<=[.!?])\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    let current = "";
    for (const piece of pieces) {
      if (current && current.length + piece.length + 1 > CHUNK_CHARS) {
        chunks.push({ location: section.location, text: current });
        current = current.slice(-OVERLAP_CHARS).replace(/^\S*\s/, "");
      }
      current = current ? `${current} ${piece}` : piece;
      // A single run-on piece longer than a chunk gets hard-split.
      while (current.length > CHUNK_CHARS * 1.5) {
        chunks.push({ location: section.location, text: current.slice(0, CHUNK_CHARS) });
        current = current.slice(CHUNK_CHARS - OVERLAP_CHARS);
      }
    }
    if (current.trim()) chunks.push({ location: section.location, text: current });
  }
  return chunks;
}

const STOPWORDS = new Set(
  "a an and are as at be by for from has have in is it its of on or that the this to was were will with what when which how why does do".split(" "),
);

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Okapi BM25 (k1 = 1.2, b = 0.75) over the given chunks. */
export function bm25(query: string, chunks: Chunk[]): Hit[] {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length || !chunks.length) return [];
  const docs = chunks.map((c) => tokenize(c.text));
  const avgLength = docs.reduce((n, d) => n + d.length, 0) / docs.length || 1;
  const df = new Map(terms.map((t) => [t, docs.filter((d) => d.includes(t)).length]));
  const k1 = 1.2;
  const b = 0.75;
  return chunks
    .map((chunk, i) => {
      const doc = docs[i];
      let score = 0;
      for (const term of terms) {
        const tf = doc.filter((t) => t === term).length;
        if (!tf) continue;
        const n = df.get(term) ?? 0;
        const idf = Math.log(1 + (chunks.length - n + 0.5) / (n + 0.5));
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.length) / avgLength)));
      }
      return { chunk, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function semantic(queryEmbedding: number[], chunks: Chunk[]): Hit[] {
  return chunks
    .filter((c) => c.embedding?.length === queryEmbedding.length)
    .map((chunk) => ({ chunk, score: cosine(queryEmbedding, chunk.embedding!) }))
    .sort((a, b) => b.score - a.score);
}

/** Reciprocal Rank Fusion: each list contributes 1 / (k + rank) per chunk. */
export function fuse(lists: Hit[][], k = 60): Hit[] {
  const scores = new Map<string, Hit>();
  for (const list of lists) {
    list.forEach((hit, rank) => {
      const prev = scores.get(hit.chunk.id);
      scores.set(hit.chunk.id, { chunk: hit.chunk, score: (prev?.score ?? 0) + 1 / (k + rank + 1) });
    });
  }
  return [...scores.values()].sort((a, b) => b.score - a.score);
}

export function hybridSearch(
  query: string,
  chunks: Chunk[],
  queryEmbedding: number[] | null,
  limit = 4,
): Hit[] {
  const keyword = bm25(query, chunks).slice(0, 20);
  const vector = queryEmbedding ? semantic(queryEmbedding, chunks).slice(0, 20) : [];
  return fuse([keyword, vector]).slice(0, limit);
}
