import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "./client";

export interface ReferralStats {
  user: {
    id: string;
    nickname: string;
    referral_code: string;  // User's personal referral code from backend
    referral_points: number;
    total_referrals: number;
    estimated_earnings: number; // 10 points = ₦30 (1 point = ₦3)
  };
  referrals: Array<{
    id: string;
    nickname: string;
    date: string;
    points_earned: number;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  referral_points: number;
  total_referrals: number;
  is_current_user: boolean;
}

export interface ReferralLeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  user_rank: number;
}

export const referralApi = {
  // Get user's referral stats from /api/accounts/referrals/
  // Returns user's personal referral_code, points, and total_referrals
  getReferralStats: async (): Promise<ReferralStats> => {
    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      console.log("[Referral] No auth token, returning fallback data");
      return {
        user: {
          id: "",
          nickname: "",
          referral_code: generateFallbackCode(),
          referral_points: 0,
          total_referrals: 0,
          estimated_earnings: 0,
        },
        referrals: [],
      };
    }
    
    try {
      const response = await apiClient.get(ENDPOINTS.referrals.getStats);
      return response.data;
    } catch (error) {
      console.warn("[Referral] Failed to fetch stats:", error);
      // Return fallback data
      return {
        user: {
          id: "",
          nickname: "",
          referral_code: generateFallbackCode(),
          referral_points: 0,
          total_referrals: 0,
          estimated_earnings: 0,
        },
        referrals: [],
      };
    }
  },

  // Get referral leaderboard (if supported by backend)
  getLeaderboard: async (): Promise<ReferralLeaderboardResponse> => {
    try {
      const response = await apiClient.get(
        `${ENDPOINTS.referrals.getStats}leaderboard/`
      );
      return response.data;
    } catch (error) {
      console.warn("[Referral] Leaderboard not available");
      return {
        leaderboard: [],
        user_rank: 0,
      };
    }
  },

  // Track referral share (when user shares their link)
  trackShare: async (platform: string, referralCode: string): Promise<void> => {
    try {
      await apiClient.post(`${ENDPOINTS.referrals.getStats}track-share/`, {
        platform,
        referral_code: referralCode,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail - tracking is not critical
      console.warn("[Referral] Failed to track share:", error);
    }
  },

  // Get referral history (if supported by backend)
  getReferralHistory: async (): Promise<
    Array<{
      id: string;
      referred_user: {
        id: string;
        nickname: string;
        email: string;
      };
      date: string;
      points_earned: number;
      status: "pending" | "completed" | "rewarded";
    }>
  > => {
    try {
      const response = await apiClient.get(
        `${ENDPOINTS.referrals.getStats}history/`
      );
      return response.data;
    } catch (error) {
      console.warn("[Referral] History not available");
      return [];
    }
  },
};

// Generate a fallback referral code
function generateFallbackCode(): string {
  const prefix = "PROP";
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${suffix}`;
}

export default referralApi;
