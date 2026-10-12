import { test } from "node:test";
import assert from "node:assert/strict";
import { transcriptSections, youtubeVideoId } from "@/lib/rag/youtube";

test("video ids come from every common YouTube link shape", () => {
  const id = "aircAruvnKk";
  for (const link of [
    id,
    `https://www.youtube.com/watch?v=${id}&t=30s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
  ]) {
    assert.equal(youtubeVideoId(link), id, link);
  }
  assert.equal(youtubeVideoId("https://example.com/watch?v=aircAruvnKk"), null);
  assert.equal(youtubeVideoId("not a link"), null);
});

test("captions group into timestamped sections", () => {
  const sections = transcriptSections(
    [
      { text: "Neurons hold a number.", offset: 4_000 },
      { text: "It&amp;#39;s called its activation.", offset: 30_000 },
      { text: "  ", offset: 60_000 },
      { text: "Layers pass activations on.", offset: 100_000 },
      { text: "Training adjusts the weights.", offset: 3_725_000 },
    ],
    90,
  );
  assert.deepEqual(sections, [
    { location: "at 0:04", text: "Neurons hold a number. It's called its activation." },
    { location: "at 1:40", text: "Layers pass activations on." },
    { location: "at 1:02:05", text: "Training adjusts the weights." },
  ]);
  assert.deepEqual(transcriptSections([]), []);
});
