import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types/api.types";

interface UserState extends UserProfile {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Referral system
  referralCode: string;
  referralPoints: number;
  totalReferrals: number;

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
}

const initialState: Omit<UserState, "setUser" | "setAuthenticated" | "setLoading" | "setError" | "updateProfile" | "clearUser" | "setReferralCode" | "addReferralPoints" | "incrementReferrals"> = {
  user_id: "",
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
    (set) => ({
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
        localStorage.removeItem("propella_token");
        localStorage.removeItem("propella_refresh_token");
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
          referralPoints: state.referralPoints + 1, // 1 point per referral
        }));
      },
    }),
    {
      name: "propella-user-store",
      partialize: (state) => ({
        user_id: state.user_id,
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
