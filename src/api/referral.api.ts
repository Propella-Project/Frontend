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
  // Computed properties for convenience
  total_points?: number;  // alias for user.referral_points
  total_referrals?: number;  // alias for user.total_referrals
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
      return {
        user: {
          id: "",
          nickname: "",
          referral_code: "",
          referral_points: 0,
          total_referrals: 0,
          estimated_earnings: 0,
        },
        referrals: [],
      };
    }
    
    try {
      console.log("[Referral] Fetching stats from:", ENDPOINTS.referrals.getStats);
      const response = await apiClient.get(ENDPOINTS.referrals.getStats);
      console.log("[Referral] Raw response:", response.data);
      
      // Validate response structure - backend might return different format
      const data = response.data;
      
      // Handle different possible response structures
      let userData = data.user;
      let referralsData = data.referrals;
      
      // If backend returns flat structure (not nested under 'user')
      if (!userData && data.referral_code !== undefined) {
        userData = {
          id: data.id || "",
          nickname: data.nickname || "",
          referral_code: data.referral_code,
          referral_points: data.referral_points ?? 0,
          total_referrals: data.total_referrals ?? 0,
          estimated_earnings: (data.referral_points ?? 0) * 3,
        };
      }
      
      if (!userData) {
        userData = {
          id: "",
          nickname: "",
          referral_code: "",
          referral_points: 0,
          total_referrals: 0,
          estimated_earnings: 0,
        };
      }

      const normalizedStats: ReferralStats = {
        user: {
          id: userData.id || "",
          nickname: userData.nickname || "",
          referral_code: userData.referral_code || "",
          referral_points: userData.referral_points ?? 0,
          total_referrals: userData.total_referrals ?? 0,
          estimated_earnings: userData.estimated_earnings ?? (userData.referral_points ?? 0) * 3,
        },
        referrals: referralsData || [],
      };
      
      console.log("[Referral] Normalized stats:", normalizedStats);
      return normalizedStats;
    } catch (error) {
      console.warn("[Referral] Failed to fetch stats:", error);
      return {
        user: {
          id: "",
          nickname: "",
          referral_code: "",
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

export default referralApi;
