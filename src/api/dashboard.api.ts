import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { DashboardResponse, PerformanceDataPoint, UserLevelResponse } from "@/types/api.types";

export const dashboardApi = {
  // Get dashboard data - uses referrals endpoint for user stats
  // Subscription status is checked separately via subscriptionApi
  getDashboard: async (): Promise<DashboardResponse> => {
    try {
      // Try to get referral stats for user info
      const referralResponse = await apiClient.get(ENDPOINTS.referrals.getStats).catch(() => ({ data: null }));
      
      // Combine the data (subscription status will be fetched separately by the app)
      return {
        nickname: referralResponse.data?.user?.nickname || "Student",
        rank: "Rookie",  // Default rank, will be updated by subscription check
        level: 1,
        points: referralResponse.data?.user?.referral_points || 0,
        average_score: 0,
        completed_days: 0,
        pending_tasks: 0,
        streak: 0,
      };
    } catch (error) {
      console.warn("[Dashboard] API not available, using fallback");
      // Return fallback data
      return {
        nickname: "Student",
        rank: "Rookie",
        level: 1,
        points: 0,
        average_score: 0,
        completed_days: 0,
        pending_tasks: 0,
        streak: 0,
      };
    }
  },

  // Get performance graph data
  getPerformanceGraph: async (): Promise<PerformanceDataPoint[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.performance.getGraph);
      return response.data;
    } catch (error) {
      console.warn("[Dashboard] Performance graph not available");
      return [];
    }
  },

  // Get user level
  getUserLevel: async (): Promise<UserLevelResponse> => {
    try {
      const response = await apiClient.get(ENDPOINTS.performance.getLevel);
      return response.data;
    } catch (error) {
      console.warn("[Dashboard] User level not available");
      return {
        level: 1,
        points: 0,
        next_level_points: 500,
        progress_percentage: 0,
      };
    }
  },
};
