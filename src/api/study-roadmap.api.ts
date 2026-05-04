import { isAxiosError } from "axios";
import { aiEngineClient } from "@/api/ai-engine.api";
import { AI_ENGINE_STUDY_PATHS } from "@/utils/constants";
import type {
  RoadmapProgress,
  RoadmapResponse,
  StudyRoadmapGeneratePayload,
  StudyRoadmapProgressMergePayload,
} from "@/types/api.types";

function extractProgress(data: unknown): RoadmapProgress {
  if (data && typeof data === "object" && "progress" in data) {
    const p = (data as { progress?: RoadmapProgress }).progress;
    if (p && Array.isArray(p.completed_phase_orders)) return p;
  }
  if (
    data &&
    typeof data === "object" &&
    "completed_phase_orders" in data &&
    Array.isArray((data as RoadmapProgress).completed_phase_orders)
  ) {
    return data as RoadmapProgress;
  }
  return { completed_phase_orders: [], current_phase_order: null };
}

export const studyRoadmapApi = {
  generate: async (body: StudyRoadmapGeneratePayload): Promise<RoadmapResponse> => {
    const res = await aiEngineClient.post<RoadmapResponse>(
      AI_ENGINE_STUDY_PATHS.ROADMAP,
      body,
    );
    return res.data;
  },

  getCurrent: async (
    userId: string,
    examDate: string,
  ): Promise<RoadmapResponse | null> => {
    try {
      const res = await aiEngineClient.get<RoadmapResponse>(
        AI_ENGINE_STUDY_PATHS.ROADMAP_CURRENT,
        {
          params: { user_id: userId, exam_date: examDate },
        },
      );
      return res.data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return null;
      throw err;
    }
  },

  mergeProgress: async (
    body: StudyRoadmapProgressMergePayload,
  ): Promise<RoadmapProgress> => {
    const res = await aiEngineClient.post<unknown>(
      AI_ENGINE_STUDY_PATHS.ROADMAP_PROGRESS_MERGE,
      body,
    );
    return extractProgress(res.data);
  },

  replaceProgress: async (body: {
    user_id: string;
    roadmap_id: string;
    progress: RoadmapProgress;
  }): Promise<void> => {
    await aiEngineClient.patch(AI_ENGINE_STUDY_PATHS.ROADMAP_PROGRESS, body);
  },
};

export default studyRoadmapApi;
