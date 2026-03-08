import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import { ENV } from "@/config/env";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
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
  subscription: SubscriptionResponse | null;
  days_remaining: number;
}

export const subscriptionApi = {
  // Get available subscription plans (requires authentication)
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    console.log("[Subscription] Fetching plans from:", ENDPOINTS.subscriptions.plans);
    const response = await apiClient.get(ENDPOINTS.subscriptions.plans);
    return response.data;
  },

  // Initiate subscription - returns Flutterwave payment link (requires auth)
  subscribe: async (
    payload: SubscriptionPayload,
  ): Promise<SubscribeResponse> => {
    console.log("[Subscription] Subscribing to plan:", payload.plan_id);
    console.log("[Subscription] Endpoint:", ENDPOINTS.subscriptions.subscribe);
    console.log("[Subscription] Full URL:", `${ENV.API_BASE_URL}${ENDPOINTS.subscriptions.subscribe}`);
    
    // Check if user is authenticated
    const token = localStorage.getItem("propella_token");
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

  // Verify subscription after Flutterwave payment (requires transaction_id query param)
  verifySubscription: async (
    transactionId: string,
  ): Promise<VerifySubscriptionResponse> => {
    const response = await apiClient.get(
      `${ENDPOINTS.subscriptions.verify}?transaction_id=${encodeURIComponent(transactionId)}`,
    );
    return response.data;
  },

  // Get current user's subscription status from the subscribe endpoint
  getSubscriptionStatus: async (): Promise<UserSubscriptionStatus> => {
    try {
      // Use the subscribe endpoint with GET to check subscription status
      const response = await apiClient.get(ENDPOINTS.subscriptions.subscribe);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return fallback
      console.warn("Subscription status endpoint not available");
      return {
        has_active_subscription: false,
        subscription: null,
        days_remaining: 0,
      };
    }
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
