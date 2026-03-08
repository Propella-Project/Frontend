/**
 * Dashboard API
 * 
 * API functions for the authenticated dashboard using cookie-based auth.
 * These functions communicate with api.propella.ng
 */

import { dashboardClient } from "./dashboard-client";

// ========== User API ==========

export interface User {
  id: string;
  email: string;
  username?: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  referral_code?: string;
  referral_points?: number;
  total_referrals?: number;
  is_verified?: boolean;
  date_joined?: string;
  phone_number?: string;
  avatar?: string;
  rank?: string;
  level?: number;
  points?: number;
  streak?: number;
  subjects?: string[];
  ai_tutor_selected?: string;
  ai_voice_enabled?: boolean;
  payment_status?: string;
  exam_date?: string;
  study_hours_per_day?: number;
}

export const userApi = {
  // Get current user info
  getMe: (): Promise<User> => {
    return dashboardClient.get("/api/accounts/me/");
  },

  // Update user profile
  updateProfile: (data: Partial<User>): Promise<User> => {
    return dashboardClient.patch("/api/accounts/me/", data);
  },

  // Change password
  changePassword: (oldPassword: string, newPassword: string): Promise<void> => {
    return dashboardClient.post("/api/accounts/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};

// ========== Referrals API ==========

export interface ReferralStats {
  total_referrals: number;
  total_points: number;
  referrals: Array<{
    referred: string;
    date?: string;
  }>;
  user?: {
    id: string;
    nickname: string;
    referral_code: string;
    referral_points: number;
    total_referrals: number;
    estimated_earnings: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  referral_points: number;
  total_referrals: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  user_rank: number;
}

export const referralsApi = {
  // Get referral statistics
  getStats: (): Promise<ReferralStats> => {
    return dashboardClient.get("/api/accounts/referrals/");
  },

  // Get leaderboard
  getLeaderboard: (): Promise<LeaderboardResponse> => {
    return dashboardClient.get("/api/accounts/referrals/leaderboard/");
  },
};

// ========== Payments API ==========

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  duration_days: number;
}

export interface PaymentInitiatePayload {
  plan: string;
  user_id: string;
  amount: number;
  currency?: string;
  callback_url?: string;
}

export interface PaymentInitiateResponse {
  status: string;
  message: string;
  data: {
    link: string; // Payment gateway URL
    transaction_ref: string;
  };
}

export interface PaymentVerifyResponse {
  status: string;
  message: string;
  data: {
    transaction_id: string;
    status: "successful" | "pending" | "failed";
    amount: number;
    currency: string;
    paid_at?: string;
    plan?: string;
  };
}

export interface SubscriptionStatus {
  is_active: boolean;
  plan: string;
  expires_at: string;
  days_remaining: number;
}

export const paymentsApi = {
  // Get available plans
  getPlans: (): Promise<PaymentPlan[]> => {
    return dashboardClient.get("/api/accounts/plans");
  },

  // Initialize payment
  initiate: (payload: PaymentInitiatePayload): Promise<PaymentInitiateResponse> => {
    return dashboardClient.post("/api/payments/initialize/", payload);
  },

  // Verify payment
  verify: (transactionRef: string): Promise<PaymentVerifyResponse> => {
    return dashboardClient.post("/api/payments/verify/", {
      transaction_ref: transactionRef,
    });
  },

  // Get subscription status
  getSubscriptionStatus: (): Promise<SubscriptionStatus> => {
    return dashboardClient.get("/api/accounts/subscription-status/");
  },

  // Subscribe to a plan (alternative endpoint)
  subscribe: (planId: string): Promise<PaymentInitiateResponse> => {
    return dashboardClient.post("/api/accounts/subscribe", { plan_id: planId });
  },

  // Verify subscription after payment
  verifySubscription: (transactionId: string): Promise<PaymentVerifyResponse> => {
    return dashboardClient.get(`/api/accounts/verify-subscription?transaction_id=${transactionId}`);
  },
};

// ========== Auth API ==========

export const authApi = {
  // Logout user
  logout: (): Promise<void> => {
    return dashboardClient.post("/api/accounts/logout/", {});
  },

  // Check if authenticated
  checkAuth: (): Promise<User> => {
    return dashboardClient.get("/api/accounts/me/");
  },
};

// ========== Roadmap API ==========

export interface RoadmapDay {
  id: string;
  day_number: number;
  title: string;
  description: string;
  tasks: RoadmapTask[];
  is_completed: boolean;
  is_unlocked: boolean;
  quiz_score?: number;
  estimated_hours: number;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  type: "study" | "quiz" | "revision" | "practice";
  duration_minutes: number;
  is_completed: boolean;
  subject_id: string;
  topic_id?: string;
  resources?: string[];
}

export const roadmapApi = {
  // Get today's roadmap
  getToday: (): Promise<RoadmapDay> => {
    return dashboardClient.get("/api/roadmap/today/");
  },

  // Get roadmap by day ID
  getByDay: (dayId: string): Promise<RoadmapDay> => {
    return dashboardClient.get(`/api/roadmap/day/${dayId}/`);
  },

  // Complete a task
  completeTask: (taskId: string): Promise<void> => {
    return dashboardClient.post(`/api/roadmap/tasks/${taskId}/complete/`, {});
  },

  // Get full roadmap
  getFullRoadmap: (): Promise<RoadmapDay[]> => {
    return dashboardClient.get("/api/roadmap/");
  },
};

// ========== AI Tutor API ==========

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface TutorResponse {
  message: ChatMessage;
  suggestions?: string[];
}

export const tutorApi = {
  // Send message to AI tutor
  sendMessage: (message: string, context?: string): Promise<TutorResponse> => {
    return dashboardClient.post("/api/ai-tutor/chat/", {
      message,
      context,
    });
  },

  // Get chat history
  getHistory: (): Promise<ChatMessage[]> => {
    return dashboardClient.get("/api/ai-tutor/history/");
  },

  // Clear chat history
  clearHistory: (): Promise<void> => {
    return dashboardClient.post("/api/ai-tutor/clear/", {});
  },
};

// Dashboard API (legacy compatibility)
export const dashboardApi = {
  user: userApi,
  referrals: referralsApi,
  payments: paymentsApi,
  auth: authApi,
  roadmap: roadmapApi,
  tutor: tutorApi,
  
  // Legacy methods for compatibility
  getDashboard: async (): Promise<{
    nickname: string;
    rank: string;
    level: number;
    points: number;
    streak: number;
    average_score: number;
    completed_days: number;
    pending_tasks: number;
  }> => {
    const user = await userApi.getMe();
    return {
      nickname: user.nickname || user.username || "User",
      rank: user.rank || "Rookie",
      level: user.level || 1,
      points: user.points || user.referral_points || 0,
      streak: user.streak || 0,
      average_score: 0,
      completed_days: 0,
      pending_tasks: 0,
    };
  },
  
  getPerformanceGraph: async (): Promise<Array<{ date: string; score: number }>> => {
    return [];
  },
};

export default dashboardApi;
