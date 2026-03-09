import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types/api.types";
// import referralApi from "@/api/referral.api";
// import { dashboardApi } from "@/api/dashboard.api";

interface UserState extends UserProfile {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Referral system
  referralCode: string;
  referralPoints: number;
  totalReferrals: number;
  
  // Username from backend
  username: string;

  // Actions
  setUser: (user: Partial<UserProfile>) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearUser: () => void;
  
  // Referral actions
  setReferralCode: (code: string) => void;
  addReferralPoints: (points: number) => void;
  incrementReferrals: () => void;
  fetchReferralStats: () => Promise<void>;
  generateReferralCode: () => Promise<string>;
  refreshUserData: () => Promise<void>;
}

const initialState: Omit<UserState, "setUser" | "setAuthenticated" | "setLoading" | "setError" | "updateProfile" | "clearUser" | "setReferralCode" | "addReferralPoints" | "incrementReferrals" | "fetchReferralStats" | "generateReferralCode" | "refreshUserData"> = {
  user_id: "",
  username: "",
  nickname: "",
  rank: "Rookie",
  level: 1,
  points: 0,
  streak: 0,
  subjects: [],
  ai_tutor_selected: "Professor Wisdom",
  ai_voice_enabled: false,
  payment_status: "pending",
  exam_date: undefined,
  study_hours_per_day: undefined,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  // Referral system defaults
  referralCode: "",
  referralPoints: 0,
  totalReferrals: 0,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => {
        set((state) => ({
          ...state,
          ...user,
          isAuthenticated: true,
        }));
      },

      setAuthenticated: (value) => {
        set({ isAuthenticated: value });
      },

      setLoading: (value) => {
        set({ isLoading: value });
      },

      setError: (error) => {
        set({ error });
      },

      updateProfile: (updates) => {
        set((state) => ({
          ...state,
          ...updates,
        }));
      },

      clearUser: () => {
        set({
          ...initialState,
          isAuthenticated: false,
        });
        // Clear both dashboard and landing page token names
        localStorage.removeItem("propella_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("propella_refresh_token");
        localStorage.removeItem("refresh_token");
      },
      
      // Referral actions
      setReferralCode: (code) => {
        set({ referralCode: code });
      },
      
      addReferralPoints: (points) => {
        set((state) => ({
          referralPoints: state.referralPoints + points,
        }));
      },
      
      incrementReferrals: () => {
        set((state) => ({
          totalReferrals: state.totalReferrals + 1,
          referralPoints: state.referralPoints + 10, // 10 points per referral (10 points = ₦30)
        }));
      },

      // Fetch live referral stats from backend - DISABLED (endpoint not available)
      fetchReferralStats: async () => {
        // Only fetch if user is authenticated
        const state = get();
        if (!state.isAuthenticated || !state.user_id) {
          console.log("[Referral] Skipping fetch - user not authenticated");
          return;
        }
        console.log("[Referral] fetchReferralStats disabled - endpoint not available");
        // try {
        //   const stats = await referralApi.getReferralStats();
        //   set({
        //     referralCode: stats.user.referral_code,
        //     referralPoints: stats.user.referral_points,
        //     totalReferrals: stats.user.total_referrals,
        //   });
        // } catch (error) {
        //   console.error("Failed to fetch referral stats:", error);
        // }
      },

      // Generate new referral code (local fallback)
      // Note: The primary referral code comes from backend via fetchReferralStats
      generateReferralCode: async () => {
        // Generate local code as fallback
        const fallbackCode = `PROP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        set({ referralCode: fallbackCode });
        return fallbackCode;
      },

      // Refresh all user data from backend - DISABLED (endpoint not available)
      refreshUserData: async () => {
        // Only refresh if user is authenticated
        const state = get();
        if (!state.isAuthenticated || !state.user_id) {
          console.log("[User] Skipping refresh - user not authenticated");
          return;
        }
        console.log("[User] refreshUserData disabled - endpoint not available");
        // try {
        //   const dashboardData = await dashboardApi.getDashboard();
        //   set((prevState) => ({
        //     ...prevState,
        //     // Only update nickname if backend returns a valid non-empty value
        //     // Preserve locally set nickname from onboarding if backend returns empty/default
        //     nickname: dashboardData.nickname?.trim() && !dashboardData.nickname.toLowerCase().includes('student')
        //       ? dashboardData.nickname 
        //       : prevState.nickname || dashboardData.nickname || prevState.nickname,
        //     rank: dashboardData.rank || prevState.rank,
        //     level: dashboardData.level || prevState.level,
        //     points: dashboardData.points ?? prevState.points,
        //     streak: dashboardData.streak ?? prevState.streak,
        //     // Use user_id as username if username not provided
        //     username: prevState.username || (dashboardData.nickname?.trim() && !dashboardData.nickname.toLowerCase().includes('student') 
        //       ? dashboardData.nickname 
        //       : prevState.user_id),
        //   }));
        //   
        //   // Also fetch referral stats
        //   const { fetchReferralStats } = get();
        //   await fetchReferralStats();
        // } catch (error) {
        //   console.error("Failed to refresh user data:", error);
        // }
      },
    }),
    {
      name: "propella-user-store",
      partialize: (state) => ({
        user_id: state.user_id,
        username: state.username,
        nickname: state.nickname,
        rank: state.rank,
        level: state.level,
        points: state.points,
        streak: state.streak,
        subjects: state.subjects,
        ai_tutor_selected: state.ai_tutor_selected,
        ai_voice_enabled: state.ai_voice_enabled,
        payment_status: state.payment_status,
        exam_date: state.exam_date,
        study_hours_per_day: state.study_hours_per_day,
        isAuthenticated: state.isAuthenticated,
        referralCode: state.referralCode,
        referralPoints: state.referralPoints,
        totalReferrals: state.totalReferrals,
      }),
    }
  )
);
