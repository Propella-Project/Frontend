import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { DashboardResponse, PerformanceDataPoint, UserLevelResponse } from "@/types/api.types";

export const dashboardApi = {
  // Get dashboard data
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get(ENDPOINTS.dashboard.get);
    return response.data;
  },

  // Get performance graph data
  getPerformanceGraph: async (): Promise<PerformanceDataPoint[]> => {
    const response = await apiClient.get(ENDPOINTS.performance.getGraph);
    return response.data;
  },

  // Get user level
  getUserLevel: async (): Promise<UserLevelResponse> => {
    const response = await apiClient.get(ENDPOINTS.performance.getLevel);
    return response.data;
  },
};
