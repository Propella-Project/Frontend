import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { StreakResponse } from "@/types/api.types";

export const streakApi = {
  // Get current streak
  getStreak: async (): Promise<StreakResponse> => {
    const response = await apiClient.get(ENDPOINTS.streak.get);
    return response.data;
  },

  // Update streak (call when user completes study session or unlocks day)
  updateStreak: async (): Promise<StreakResponse> => {
    const response = await apiClient.post(ENDPOINTS.streak.update);
    return response.data;
  },
};
