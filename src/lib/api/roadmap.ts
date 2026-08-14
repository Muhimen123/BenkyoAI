/**
 * POST /api/roadmap — builds the Roadmap → Topic → Subtopic tree.
 * Mock implementation: a small library of shaped outlines, chosen by keyword,
 * with a structural fallback that adapts to whatever the user typed.
 */
import { request } from "./client";
import { titleCase, uid } from "@/lib/utils";
import type {
  CalibrationAnswer,
  CalibrationQuestion,
  Purpose,
  Roadmap,
  RoadmapRequest,
  Subtopic,
  Topic,
} from "@/lib/types";

interface OutlineNode {
  title: string;
  summary: string;
  milestone?: boolean;
  subtopics: { title: string; stub: string; min: number }[];
}

const OUTLINES: { match: RegExp; nodes: OutlineNode[] }[] = [
  {
    match: /chem|organic|reaction/i,
    nodes: [
      {
        title: "Structure and bonding",
        summary: "Why molecules hold the shapes they do.",
        subtopics: [
          { title: "Hybridisation and geometry", stub: "Orbital mixing sets bond angles, and bond angles set everything downstream.", min: 15 },
          { title: "Formal charge", stub: "Counting electrons around an atom to tell which structure is the real one.", min: 12 },
          { title: "Resonance structures", stub: "One molecule, several valid drawings, one weighted average of them all.", min: 18 },
        ],
      },
      {
        title: "Acids, bases and pKa",
        summary: "The single most reusable tool in the subject.",
        milestone: true,
        subtopics: [
          { title: "Reading a pKa table", stub: "Lower pKa means a happier conjugate base. Almost every mechanism starts here.", min: 14 },
          { title: "Stability of conjugate bases", stub: "Size, electronegativity, resonance, induction — in that order.", min: 20 },
          { title: "Predicting proton transfers", stub: "Equilibrium always runs toward the weaker acid.", min: 16 },
        ],
      },
      {
        title: "Substitution mechanisms",
        summary: "SN1 and SN2, and how to tell them apart under pressure.",
        subtopics: [
          { title: "SN2 backside attack", stub: "One concerted step, inversion at the carbon, hates crowding.", min: 18 },
          { title: "SN1 and carbocations", stub: "Leaving group departs first — the intermediate decides the outcome.", min: 20 },
          { title: "Choosing between them", stub: "Substrate, nucleophile, solvent, leaving group. Four checks, one answer.", min: 22 },
        ],
      },
      {
        title: "Elimination mechanisms",
        summary: "E1 and E2, and the substitution-versus-elimination fork.",
        milestone: true,
        subtopics: [
          { title: "E2 and anti-periplanar geometry", stub: "The hydrogen and the leaving group have to line up before anything happens.", min: 20 },
          { title: "Zaitsev and Hofmann products", stub: "Base size decides which alkene you actually get.", min: 16 },
          { title: "Substitution vs elimination", stub: "The exam question that punishes memorisation and rewards reasoning.", min: 24 },
        ],
      },
      {
        title: "Synthesis planning",
        summary: "Working backwards from the target molecule.",
        subtopics: [
          { title: "Retrosynthetic arrows", stub: "Break the target at bonds you know how to make.", min: 18 },
          { title: "Multi-step sequences", stub: "Order matters: protect, react, deprotect.", min: 22 },
        ],
      },
    ],
  },
  {
    match: /japanese|jlpt|kanji|nihongo/i,
    nodes: [
      {
        title: "Sound and script",
        summary: "Reading anything at all comes first.",
        subtopics: [
          { title: "Hiragana", stub: "46 characters. Everything else in the language sits on top of these.", min: 20 },
          { title: "Katakana", stub: "Same sounds, different shapes, used for borrowed words.", min: 20 },
          { title: "Pitch and long vowels", stub: "Length changes meaning: obasan and obaasan are different people.", min: 12 },
        ],
      },
      {
        title: "Sentence skeleton",
        summary: "Particles do the work that word order does in English.",
        milestone: true,
        subtopics: [
          { title: "は vs が", stub: "Topic versus subject — the distinction that never fully stops being subtle.", min: 25 },
          { title: "を, に, で", stub: "Object, destination, location of action.", min: 18 },
          { title: "Verb-final word order", stub: "The verb waits at the end, so listen to the end.", min: 12 },
        ],
      },
      {
        title: "Verb conjugation",
        summary: "Godan, ichidan, and the two irregulars.",
        subtopics: [
          { title: "Te-form", stub: "The connective form that unlocks requests, progressives and permission.", min: 25 },
          { title: "Plain vs polite", stub: "Same meaning, different register — pick by who you're talking to.", min: 16 },
          { title: "Past and negative", stub: "Stacking endings in a fixed order.", min: 18 },
        ],
      },
      {
        title: "Kanji in context",
        summary: "Readings stop being arbitrary once you meet them in words.",
        milestone: true,
        subtopics: [
          { title: "Radicals", stub: "Components repeat — learn the parts, not the pictures.", min: 22 },
          { title: "On and kun readings", stub: "Which reading fires depends on the company the character keeps.", min: 24 },
        ],
      },
    ],
  },
];

function fallbackOutline(topic: string): OutlineNode[] {
  const t = titleCase(topic);
  return [
    {
      title: `Ground rules of ${t}`,
      summary: `The vocabulary and assumptions the rest of ${t} takes for granted.`,
      subtopics: [
        { title: "Core definitions", stub: `The handful of terms that every later idea in ${t} is phrased in.`, min: 14 },
        { title: "Why this field exists", stub: "The problem this body of knowledge was built to solve.", min: 10 },
        { title: "Common misconceptions", stub: "The wrong mental models most people arrive with.", min: 14 },
      ],
    },
    {
      title: `Core mechanics`,
      summary: `The moving parts of ${t} and how they fit together.`,
      milestone: true,
      subtopics: [
        { title: "The central model", stub: `The one framework most ${t} questions reduce to.`, min: 20 },
        { title: "Working through an example", stub: "Following the model end to end on a small case.", min: 18 },
        { title: "Where the model breaks", stub: "The edge cases that mark the boundary of the simple version.", min: 16 },
      ],
    },
    {
      title: "Applying it under pressure",
      summary: "Recognising which tool a question is asking for.",
      subtopics: [
        { title: "Pattern recognition", stub: "Reading a problem and naming the approach before starting.", min: 22 },
        { title: "Multi-step problems", stub: "Chaining two or three ideas without losing the thread.", min: 24 },
      ],
    },
    {
      title: "Depth and connections",
      summary: `How ${t} links to what sits next to it.`,
      milestone: true,
      subtopics: [
        { title: "Adjacent topics", stub: "The neighbouring ideas that make this one make more sense.", min: 18 },
        { title: "Explaining it to someone else", stub: "The test of whether you actually have it.", min: 15 },
      ],
    },
  ];
}

const PACING: Record<Purpose, { sessionsPerWeek: number; minutesPerSession: number; note: string }> = {
  exam: { sessionsPerWeek: 5, minutesPerSession: 35, note: "Tight cycles, heavy recall, ruthless about what's examinable." },
  project: { sessionsPerWeek: 3, minutesPerSession: 45, note: "Depth on the parts you'll actually build with, lighter elsewhere." },
  job: { sessionsPerWeek: 4, minutesPerSession: 30, note: "Front-loads the things interviewers and colleagues assume you know." },
  curiosity: { sessionsPerWeek: 2, minutesPerSession: 25, note: "Unhurried. Follows what you find interesting rather than a syllabus." },
};

function levelFromCalibration(answers: CalibrationAnswer[]) {
  const levels = answers
    .map((a) => Number(a.optionId.split(":")[1] ?? 2))
    .filter((n) => !Number.isNaN(n));
  if (!levels.length) return 2;
  return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
}

export async function getCalibrationQuestions(
  topic: string,
): Promise<CalibrationQuestion[]> {
  const t = topic.trim() || "this topic";
  return request<{ topic: string }, CalibrationQuestion[]>(
    "/api/roadmap/calibration",
    { topic: t },
    () => [
      {
        id: "q_seen",
        prompt: `How much of ${t} have you met before?`,
        options: [
          { id: "q_seen:1", label: "First time — start me at zero", level: 1 },
          { id: "q_seen:2", label: "I've read around it a bit", level: 2 },
          { id: "q_seen:3", label: "I studied it before and it faded", level: 3 },
          { id: "q_seen:4", label: "I'm actively studying it now", level: 4 },
        ],
      },
      {
        id: "q_solo",
        prompt: "Handed a typical problem in this area, what happens?",
        options: [
          { id: "q_solo:1", label: "I wouldn't know where to start", level: 1 },
          { id: "q_solo:2", label: "I'd need the notes open", level: 2 },
          { id: "q_solo:3", label: "I'd get most of the way", level: 3 },
          { id: "q_solo:4", label: "I'd finish it and check my work", level: 4 },
        ],
      },
      {
        id: "q_explain",
        prompt: "Could you explain the main idea to a classmate right now?",
        options: [
          { id: "q_explain:1", label: "Not yet", level: 1 },
          { id: "q_explain:2", label: "Roughly, with gaps", level: 2 },
          { id: "q_explain:3", label: "Yes, if they didn't push back", level: 3 },
          { id: "q_explain:4", label: "Yes, including the awkward questions", level: 4 },
        ],
      },
    ],
    { latency: 500 },
  );
}

export async function generateRoadmap(input: RoadmapRequest): Promise<Roadmap> {
  return request<RoadmapRequest, Roadmap>("/api/roadmap", input, (body) => {
    const outline =
      OUTLINES.find((o) => o.match.test(body.topic))?.nodes ??
      fallbackOutline(body.topic);
    const level = levelFromCalibration(body.calibration);
    const roadmapId = uid("rm");
    const now = new Date().toISOString();

    // A higher calibration level means early ground is already partly held.
    const topics: Topic[] = outline.map((node, index) => {
      const subtopics: Subtopic[] = node.subtopics.map((s) => {
        const headStart = index === 0 ? (level - 1) * 18 : index === 1 ? (level - 2) * 12 : 0;
        const mastery = Math.max(0, Math.min(85, headStart));
        return {
          id: uid("st"),
          topicId: "",
          title: s.title,
          explanationStub: s.stub,
          mastery,
          status: mastery >= 80 ? "mastered" : mastery > 0 ? "in-progress" : "not-started",
          isWeakPoint: false,
          estimatedMin: s.min,
          sessionIds: [],
        };
      });
      const topicId = uid("tp");
      subtopics.forEach((s) => (s.topicId = topicId));
      const mastery = Math.round(
        subtopics.reduce((sum, s) => sum + s.mastery, 0) / subtopics.length,
      );
      return {
        id: topicId,
        roadmapId,
        title: node.title,
        summary: node.summary,
        order: index,
        status: mastery >= 80 ? "mastered" : mastery > 0 ? "in-progress" : "not-started",
        mastery,
        isMilestone: Boolean(node.milestone),
        origin: "ai",
        subtopics,
      };
    });

    return {
      id: roadmapId,
      title: titleCase(body.topic),
      purpose: body.purpose,
      deadline: body.deadline,
      createdAt: now,
      updatedAt: now,
      promptOverride: body.promptOverride,
      pacing: PACING[body.purpose],
      topics,
    };
  });
}

/** POST /api/roadmap — re-runs generation against an edited instruction. */
export async function regenerateRoadmap(
  roadmap: Roadmap,
  promptOverride: string,
): Promise<Roadmap> {
  return request<{ roadmapId: string; promptOverride: string }, Roadmap>(
    "/api/roadmap",
    { roadmapId: roadmap.id, promptOverride },
    () => ({
      ...roadmap,
      promptOverride,
      updatedAt: new Date().toISOString(),
      lastAdjustment: {
        at: new Date().toISOString(),
        reason: "Rebuilt from your edited instruction.",
        affectedSubtopicIds: roadmap.topics.flatMap((t) =>
          t.subtopics.map((s) => s.id),
        ),
      },
    }),
    { latency: 1100 },
  );
}

/** POST /api/roadmap/topic — the "+ Add by myself" path. */
export async function addManualTopic(
  roadmapId: string,
  title: string,
  subtopicTitles: string[],
): Promise<Topic> {
  return request<
    { roadmapId: string; title: string; subtopicTitles: string[] },
    Topic
  >(
    "/api/roadmap/topic",
    { roadmapId, title, subtopicTitles },
    (body) => {
      const topicId = uid("tp");
      const titles = body.subtopicTitles.filter(Boolean);
      return {
        id: topicId,
        roadmapId: body.roadmapId,
        title: titleCase(body.title),
        summary: "Added by you.",
        order: 999,
        status: "not-started",
        mastery: 0,
        isMilestone: false,
        origin: "manual",
        subtopics: (titles.length ? titles : ["Get started"]).map((t) => ({
          id: uid("st"),
          topicId,
          title: titleCase(t),
          explanationStub: "You added this one. BenkyoAI will fill in the explanation when you open it.",
          mastery: 0,
          status: "not-started" as const,
          isWeakPoint: false,
          estimatedMin: 15,
          sessionIds: [],
        })),
      };
    },
    { latency: 600 },
  );
}
