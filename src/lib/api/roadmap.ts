/** POST /api/roadmap — builds the Roadmap → Topic → Subtopic tree. */
import { request } from "./client";
import type {
  CalibrationQuestion,
  Roadmap,
  RoadmapRequest,
  Topic,
} from "@/lib/types";

export async function getCalibrationQuestions(
  topic: string,
): Promise<CalibrationQuestion[]> {
  return request<{ topic: string }, CalibrationQuestion[]>(
    "/api/roadmap/calibration",
    { topic: topic.trim() || "this topic" },
  );
}

export async function generateRoadmap(input: RoadmapRequest): Promise<Roadmap> {
  return request<RoadmapRequest, Roadmap>("/api/roadmap", input);
}

export async function regenerateRoadmap(
  roadmap: Roadmap,
  promptOverride: string,
): Promise<Roadmap> {
  return request<{
    roadmapId: string;
    topic: string;
    purpose: string;
    deadline?: string;
    calibration: [];
    promptOverride: string;
  }, Roadmap>("/api/roadmap", {
    roadmapId: roadmap.id,
    topic: roadmap.title,
    purpose: roadmap.purpose,
    deadline: roadmap.deadline,
    calibration: [],
    promptOverride,
  });
}

export async function addManualTopic(
  roadmapId: string,
  title: string,
  subtopicTitles: string[],
): Promise<Topic> {
  return request<{ roadmapId: string; title: string; subtopicTitles: string[] }, Topic>(
    "/api/roadmap/topic",
    { roadmapId, title, subtopicTitles },
  );
}
