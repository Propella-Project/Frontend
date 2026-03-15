import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "./client";
import { generateTransactionRef } from "@/services/flutterwave.service";

/** Replace placeholder or empty plan description with a sensible default by plan name */
function getPlanDescription(planName: string, apiDescription: string | undefined): string {
  const raw = (apiDescription || "").trim();
  if (raw && !/lorem\s+ipsum/i.test(raw)) return raw;
  const name = (planName || "").toLowerCase();
  if (name.includes("smart") || name.includes("monthly")) {
    return "Full access to your personalized study roadmap, AI tutor, and analytics for 30 days.";
  }
  if (name.includes("quarter") || name.includes("3 month")) {
    return "Three months of full access with the best per-day value.";
  }
  if (name.includes("year") || name.includes("annual")) {
    return "Full access for 12 months with maximum savings.";
  }
  return "Full access to your personalized roadmap, AI tutor, and performance analytics.";
}

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
  amount: number;
  currency?: string;
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
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
      throw new Error("Authentication required");
    }
    
    const response = await apiClient.get<RawSubscriptionPlan[]>(ENDPOINTS.subscriptions.plans);
    
    // Transform raw backend response to frontend format
    return response.data.map((plan) => ({
      id: String(plan.id),
      name: plan.name,
      description: getPlanDescription(plan.name, plan.description),
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

  // Initiate subscription - used when payment is opened via flutterwave-react-v3 in PaymentModal.
  // This is a no-op stub for callers that still use initiatePayment(); the modal handles Flutterwave.
  subscribe: async (
    payload: SubscriptionPayload,
  ): Promise<SubscribeResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Please log in to subscribe");
    }
    const txRef = generateTransactionRef();
    localStorage.setItem("pending_transaction_id", txRef);
    localStorage.setItem("pending_plan_id", payload.plan_id);
    return {
      id: txRef,
      status: "success",
      amount: payload.amount,
      currency: payload.currency ?? "NGN",
      payment_link: "",
      transaction_ref: txRef,
      transaction_id: txRef,
      created_at: new Date().toISOString(),
    };
  },

  // Verify subscription (How_it_works.md §14) - body: { reference }
  verifySubscription: async (
    transactionId: string,
    _planId?: string,
  ): Promise<VerifySubscriptionResponse> => {
    const response = await apiClient.post(ENDPOINTS.subscriptions.verify, {
      reference: transactionId,
    });
    return response.data;
  },

  // Get current user's subscription status from backend only (no local verification storage)
  getSubscriptionStatus: async (): Promise<UserSubscriptionStatus> => {
    const token = getToken();
    if (!token) {
      return {
        has_active_subscription: false,
        subscription: null,
        days_remaining: 0,
      };
    }
    try {
      const response = await apiClient.get<{
        has_active_subscription?: boolean;
        subscription?: SubscriptionResponse | null;
        days_remaining?: number;
        expires_at?: string;
      }>(ENDPOINTS.subscriptions.status);
      const data = response.data;
      const hasActive = !!data?.has_active_subscription;
      return {
        has_active_subscription: hasActive,
        subscription: data?.subscription ?? null,
        days_remaining: data?.days_remaining ?? 0,
        expires_at: data?.expires_at,
      };
    } catch {
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
