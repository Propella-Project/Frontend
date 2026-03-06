import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { TodayRoadmapResponse, RoadmapDay } from "@/types/api.types";

export const roadmapApi = {
  // Get today's roadmap
  getTodayRoadmap: async (): Promise<TodayRoadmapResponse> => {
    const response = await apiClient.get(ENDPOINTS.roadmap.getToday);
    return response.data;
  },

  // Get roadmap for a specific day
  getRoadmapByDay: async (dayId: string): Promise<RoadmapDay> => {
    const response = await apiClient.get(ENDPOINTS.roadmap.getByDay(dayId));
    return response.data;
  },

  // Complete a task
  completeTask: async (taskId: string): Promise<void> => {
    const response = await apiClient.post(ENDPOINTS.roadmap.completeTask(taskId));
    return response.data;
  },
};
