import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import { ENV } from "@/config/env";
import { getToken } from "./client";

// Raw plan from backend API
export interface RawSubscriptionPlan {
  id: number;
  name: string;
  price: string;  // Backend returns as string, e.g., "1500.00"
  duration_days: number;
  description: string;
  created_at: string;
}

// Frontend-friendly plan format
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;  // Converted from price string
  currency: string;
  duration_days: number;
  features: string[];
}

export interface SubscriptionPayload {
  plan_id: string;
  payment_method: string;
  transaction_ref?: string;
}

export interface SubscribeResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  payment_link: string;  // Flutterwave payment link
  transaction_ref?: string;  // Legacy field
  transaction_id?: string;   // New field from backend
  created_at: string;
}

export interface VerifySubscriptionResponse {
  status: string;
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    status: "active" | "expired" | "cancelled";
    start_date: string;
    end_date: string;
  } | null;
  message: string;
}

export interface SubscriptionResponse {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "expired" | "cancelled";
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface UserSubscriptionStatus {
  has_active_subscription: boolean;
  is_active?: boolean;  // alias for has_active_subscription
  subscription: SubscriptionResponse | null;
  plan?: string;  // plan name/id for display
  days_remaining: number;
  expires_at?: string;  // expiration date for display
}

export const subscriptionApi = {
  // Get available subscription plans (requires authentication)
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      console.log("[Subscription] No auth token, throwing auth error");
      throw new Error("Authentication required");
    }
    
    console.log("[Subscription] Fetching plans from:", ENDPOINTS.subscriptions.plans);
    const response = await apiClient.get<RawSubscriptionPlan[]>(ENDPOINTS.subscriptions.plans);
    
    // Transform raw backend response to frontend format
    return response.data.map((plan) => ({
      id: String(plan.id),
      name: plan.name,
      description: plan.description,
      amount: parseFloat(plan.price),  // Convert price string to number
      currency: "NGN",  // Default currency
      duration_days: plan.duration_days,
      features: [
        "Personalized AI-generated roadmap",
        "Unlimited AI tutor chat sessions",
        "Detailed performance analytics",
        "Weak topics identification",
        "Daily streak tracking",
        "Practice quizzes and past questions",
      ],
    }));
  },

  // Initiate subscription - returns Flutterwave payment link (requires auth)
  subscribe: async (
    payload: SubscriptionPayload,
  ): Promise<SubscribeResponse> => {
    console.log("[Subscription] Subscribing to plan:", payload.plan_id);
    console.log("[Subscription] Endpoint:", ENDPOINTS.subscriptions.subscribe);
    console.log("[Subscription] Full URL:", `${ENV.API_BASE_URL}${ENDPOINTS.subscriptions.subscribe}`);
    
    // Check if user is authenticated (supports both dashboard and landing page tokens)
    const token = getToken();
    if (!token) {
      console.error("[Subscription] No authentication token found");
      throw new Error("Please log in to subscribe");
    }
    
    try {
      const response = await apiClient.post(
        ENDPOINTS.subscriptions.subscribe,
        payload,
      );
      console.log("[Subscription] Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("[Subscription] Error:", error);
      const axiosError = error as { response?: { status: number; data: unknown } };
      if (axiosError.response) {
        console.error("[Subscription] Error status:", axiosError.response.status);
        console.error("[Subscription] Error data:", axiosError.response.data);
        
        // Handle 401 specifically
        if (axiosError.response.status === 401) {
          throw new Error("Please log in to subscribe");
        }
      }
      throw error;
    }
  },

  // Verify subscription after Flutterwave payment (requires transaction_id in body)
  verifySubscription: async (
    transactionId: string,
  ): Promise<VerifySubscriptionResponse> => {
    const response = await apiClient.post(
      ENDPOINTS.subscriptions.verify,
      { transaction_id: transactionId },
    );
    return response.data;
  },

  // Get current user's subscription status
  // Note: Backend doesn't have a dedicated status endpoint yet
  // This returns fallback data - the app should check local state or payment history
  getSubscriptionStatus: async (): Promise<UserSubscriptionStatus> => {
    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      console.log("[Subscription] No auth token for status check");
      return {
        has_active_subscription: false,
        subscription: null,
        days_remaining: 0,
      };
    }
    
    // For now, return fallback data
    // In the future, this could check localStorage for payment confirmation
    // or call a dedicated backend endpoint when available
    console.log("[Subscription] Using fallback status (no backend endpoint)");
    return {
      has_active_subscription: false,
      subscription: null,
      days_remaining: 0,
    };
  },

  // Cancel subscription
  cancelSubscription: async (): Promise<void> => {
    const response = await apiClient.post(
      `${ENDPOINTS.subscriptions.subscribe}cancel/`,
    );
    return response.data;
  },
};

export default subscriptionApi;
