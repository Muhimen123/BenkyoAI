import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { bm25, chunkSections, cosine, fuse, hybridSearch, type Chunk } from "@/lib/rag/search";
import { extractPptx, slideText } from "@/lib/rag/extract";

const chunk = (id: string, text: string, embedding?: number[]): Chunk => ({
  id,
  materialId: "m",
  materialName: "notes.pdf",
  location: `p. ${id}`,
  text,
  embedding,
});

const corpus = [
  chunk("1", "Photosynthesis converts light energy into chemical energy in chloroplasts.", [1, 0, 0]),
  chunk("2", "The Krebs cycle produces NADH and FADH2 in the mitochondrial matrix.", [0, 1, 0]),
  chunk("3", "Glycolysis splits glucose into two pyruvate molecules in the cytoplasm.", [0, 0.9, 0.1]),
];

test("BM25 ranks the passage containing the query terms first", () => {
  const hits = bm25("where does glycolysis happen", corpus);
  assert.equal(hits[0].chunk.id, "3");
  assert.equal(bm25("quantum chromodynamics", corpus).length, 0);
});

test("cosine similarity", () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0], [1, 0]), 0);
});

test("RRF rewards chunks that rank well in both lists", () => {
  const a = { chunk: corpus[0], score: 0 };
  const b = { chunk: corpus[1], score: 0 };
  const c = { chunk: corpus[2], score: 0 };
  const fused = fuse([[a, b, c], [b, a, c]]);
  assert.deepEqual(fused.slice(0, 2).map((h) => h.chunk.id).sort(), ["1", "2"]);
  assert.equal(fused[2].chunk.id, "3");
});

test("hybrid search finds a paraphrase that keywords alone miss", () => {
  // The query shares no words with chunk 2, but its embedding is closest to it.
  const hits = hybridSearch("cellular respiration carriers", corpus, [0, 1, 0], 2);
  assert.equal(hits[0].chunk.id, "2");
});

test("hybrid search falls back to keywords without embeddings", () => {
  const hits = hybridSearch("chloroplasts light", corpus, null, 1);
  assert.equal(hits[0].chunk.id, "1");
});

test("chunks stay within one page, respect the size limit and overlap", () => {
  const sentence = "Entropy measures the number of microscopic arrangements. ";
  const chunks = chunkSections([
    { location: "p. 1", text: sentence.repeat(40) },
    { location: "p. 2", text: "Short page." },
  ]);
  const page1 = chunks.filter((c) => c.location === "p. 1");
  assert.ok(page1.length > 1);
  assert.ok(page1.every((c) => c.text.length <= 1350));
  // Consecutive chunks overlap: the next one opens with text the previous one ended on.
  assert.ok(page1[0].text.includes(page1[1].text.slice(0, 30)));
  assert.deepEqual(chunks.at(-1), { location: "p. 2", text: "Short page." });
});

test("slide text: one line per paragraph, entities decoded", () => {
  const xml = "<a:p><a:r><a:t>A &amp; B</a:t></a:r><a:r><a:t>!</a:t></a:r></a:p><a:p><a:r><a:t>next</a:t></a:r></a:p>";
  assert.equal(slideText(xml), "A & B!\nnext");
});

test("PPTX extraction reads deflated and stored slides in slide order", async () => {
  const buf = await readFile(new URL("./fixtures/two-slides.pptx", import.meta.url));
  const sections = await extractPptx(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  assert.deepEqual(sections, [
    { location: "slide 2", text: "Boolean Expressions\nand & or short-circuit" },
    { location: "slide 10", text: "Loops\nfor walks an iterable" },
  ]);
});
