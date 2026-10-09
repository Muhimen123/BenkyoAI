/**
 * Shared data contracts.
 *
 * Every shape here mirrors what the eventual `/api/*` routes will return, so a
 * real route handler can be dropped in behind `lib/api/*` without UI rework.
 */
import type { ReviewCard } from "./srs";

/* ------------------------------------------------------------------ BYOK */

export type ProviderId = "google" | "openai" | "anthropic" | "ollama";

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  /** Where the user goes to create a key. */
  consoleUrl: string;
  keyPrefix: string;
  /** Plain-language steps shown in the guided setup. */
  steps: string[];
  freeTierNote: string;
  /** Model used when the learner doesn't name one (non-Gemini providers). */
  defaultModel?: string;
  /** What the credential field asks for: a secret key, or a local address. */
  credentialLabel?: string;
}

/** What the Vault holds about the connection. The raw key is never rendered. */
export interface KeyConnection {
  provider: ProviderId;
  /** Last 4 characters only — for display. */
  keyTail: string;
  /** Model chosen for non-Gemini providers; Gemini picks its own. */
  model?: string;
  connectedAt: string;
  status: "connected" | "invalid" | "unverified";
  lastCheckedAt: string;
}

export interface KeyValidationResult {
  valid: boolean;
  provider: ProviderId;
  /** Human-readable outcome, shown verbatim under the field. */
  message: string;
  modelHint?: string;
}

/* -------------------------------------------------------------- Materials */

export type MaterialKind =
  | "pdf"
  | "slides"
  | "image"
  | "audio"
  | "video"
  | "note";

export interface Material {
  id: string;
  name: string;
  kind: MaterialKind;
  sizeLabel?: string;
  addedAt: string;
  status: "processing" | "ready";
  linkedTopicIds: string[];
  /** Searchable passages extracted into the retrieval index (0 = not readable as text). */
  passages?: number;
  /** True when the passages also have embeddings (semantic search), not just keywords. */
  semantic?: boolean;
}

export interface Summary {
  id: string;
  title: string;
  materialIds: string[];
  keyPoints: string[];
  readingTimeMin: number;
  generatedAt: string;
}

/* ---------------------------------------------------------------- Roadmap */

export type NodeStatus = "not-started" | "in-progress" | "mastered";
export type Purpose = "exam" | "project" | "job" | "curiosity";
export type Depth = "brief" | "balanced" | "deep";

export interface Subtopic {
  id: string;
  topicId: string;
  title: string;
  explanationStub: string;
  /** 0–100 */
  mastery: number;
  status: NodeStatus;
  /** True when this node came back from a past mistake and is blended into new work. */
  isWeakPoint: boolean;
  estimatedMin: number;
  sessionIds: string[];
  /** Earlier subtopics this one builds on (edges of the prerequisite graph). */
  prerequisiteIds?: string[];
  /** FSRS memory state; set after the first answer on this subtopic. */
  review?: ReviewCard;
}

export interface Topic {
  id: string;
  roadmapId: string;
  title: string;
  summary: string;
  order: number;
  status: NodeStatus;
  mastery: number;
  isMilestone: boolean;
  origin: "ai" | "manual";
  subtopics: Subtopic[];
}

export interface RoadmapAdjustment {
  at: string;
  reason: string;
  affectedSubtopicIds: string[];
}

export interface Roadmap {
  id: string;
  title: string;
  purpose: Purpose;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  /** Advanced control: the instruction the AI works from. */
  promptOverride?: string;
  pacing: {
    sessionsPerWeek: number;
    minutesPerSession: number;
    note: string;
  };
  lastAdjustment?: RoadmapAdjustment;
  topics: Topic[];
}

export interface CalibrationQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string; level: 1 | 2 | 3 | 4 }[];
}

export interface CalibrationAnswer {
  questionId: string;
  optionId: string;
}

/** POST /api/roadmap */
export interface RoadmapRequest {
  topic: string;
  materialIds: string[];
  /** Key points summarised from the learner's own material. */
  materialKeyPoints?: string[];
  calibration: CalibrationAnswer[];
  purpose: Purpose;
  deadline?: string;
  promptOverride?: string;
}

/* --------------------------------------------------------------- Practice */

export type QuestionKind = "mcq" | "short" | "explain-back";
export type MistakeType = "misunderstanding" | "careless" | "missing-concept";
export type NextAction = "move-on" | "review" | "go-deeper";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  subtopicId: string;
  kind: QuestionKind;
  prompt: string;
  options?: QuestionOption[];
  /** Deliberately misleading — tagged so it reads differently in review. */
  tricky: boolean;
  /** A refresher on an older weak point, blended into this set. */
  isReviewBlend: boolean;
  reviewOfLabel?: string;
}

export interface PracticeSet {
  subtopicId: string;
  questions: Question[];
}

/** POST /api/practice/answer */
export interface AnswerPayload {
  questionId: string;
  subtopicId: string;
  optionId?: string;
  text?: string;
  /** Seconds spent — feeds the careless-vs-misunderstanding call. */
  elapsedSec: number;
}

export interface AnswerResult {
  questionId: string;
  correct: boolean;
  /** Change in mastery, in percentage points. */
  understandingDelta: number;
  mistakeType?: MistakeType;
  feedback: string;
  correctOptionId?: string;
  suggestedAction: NextAction;
  /** Cross-user anonymized insight, surfaced subtly. */
  bestExplanation?: { text: string; helpedNote: string };
  /** Set when a past mistake was just answered correctly unaided. */
  growth?: GrowthCallout;
}

/** POST /api/practice/explanation */
export interface ExplanationPayload {
  subtopicId: string;
  text: string;
  source: "typed" | "spoken";
}

export interface ExplanationEvaluation {
  verdict: "pass" | "needs-review";
  gaps: string[];
  followUp?: string;
  understandingDelta: number;
}

/* ----------------------------------------------------------- Active recall */

export type RecallMode = "session-wise" | "milestone-wise" | "exam-night";

export interface RecallItem {
  id: string;
  prompt: string;
  sourceSubtopicId: string;
  sourceLabel: string;
  reason: "previous-mistake" | "unresolved" | "spaced-review";
  kind: "mcq" | "short";
  options?: QuestionOption[];
}

/** POST /api/recall */
export interface RecallRequest {
  mode: RecallMode;
  /** Session id, topic (milestone) id, or "all". */
  scope: string;
  roadmap: Roadmap;
}

export interface RecallQueue {
  mode: RecallMode;
  scopeLabel: string;
  items: RecallItem[];
  /** Only meaningful for exam-night: progress through the whole vault. */
  vaultCoverage: { covered: number; total: number };
}

/* --------------------------------------------------------------- Sessions */

export interface Session {
  id: string;
  roadmapId: string;
  subtopicId?: string;
  subtopicTitle?: string;
  topicTitle?: string;
  mode: "lesson" | "practice" | "recall";
  startedAt: string;
  endedAt?: string;
  /** 0–100 */
  progress: number;
  lastQuestionIndex: number;
}

export interface GrowthCallout {
  id: string;
  title: string;
  detail: string;
  previousMistakeType: MistakeType;
}

export interface SessionSummary {
  sessionId: string;
  roadmapId: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  covered: { subtopicId: string; title: string }[];
  struggled: { subtopicId: string; title: string; mistakeType: MistakeType }[];
  understood: { subtopicId: string; title: string; mastery: number }[];
  growth: GrowthCallout[];
  nextUp?: { subtopicId: string; title: string; reason: string };
  /** The line the next session opens with. */
  carryOver?: { subtopicId: string; question: string };
}

/* ------------------------------------------------------------------- Chat */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  streaming?: boolean;
}

export type ExplainMode = "differently" | "simpler" | "deeper";

/* ------------------------------------------------------------------ Usage */

/** One Gemini call, as reported by the `x-benkyo-usage` response header. */
export interface UsageEntry {
  at: string;
  roadmapId?: string;
  /** The API route that made the call, e.g. "/api/practice/set". */
  path: string;
  /** "google", "openai", "anthropic" or "ollama". Older entries are Gemini. */
  provider?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/* -------------------------------------------------------------- Vault (OPFS) */

export type VaultItemType = 'file' | 'directory';

export interface VaultItem {
  name: string;
  path: string; // e.g. "/notes/math.md"
  kind: VaultItemType;
  size?: number;
  lastModified?: number;
  children?: VaultItem[];
}

export interface VaultStats {
  totalFiles: number;
  totalDirectories: number;
  estimatedUsage?: number;
  estimatedQuota?: number;
}
