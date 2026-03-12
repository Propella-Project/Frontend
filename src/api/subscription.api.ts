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
      console.log("[Subscription] Raw response:", response.data);
      
      // Flutterwave success: { status: "success", message: "Hosted Link", data: { link: "https://checkout.flutterwave.com/..." } }
      // Redirect user to data.link only when status is success and link is present
      const responseWrapper = response.data;
      if (!responseWrapper) {
        throw new Error("Empty response from server");
      }
      
      // Check for error in wrapper
      const messageStr = typeof responseWrapper.message === 'object' 
        ? responseWrapper.message?.message || responseWrapper.message?.code || JSON.stringify(responseWrapper.message)
        : responseWrapper.message;
      
      // Check if user already has an active subscription - treat as success
      const errorMsg = messageStr?.toLowerCase() || '';
      if (errorMsg.includes('already have an active subscription')) {
        console.log("[Subscription] User already has active subscription - treating as success");
        return {
          id: "existing_subscription",
          status: "success",
          amount: 0,
          currency: "NGN",
          payment_link: "",
          transaction_ref: "existing",
          transaction_id: "existing",
          created_at: new Date().toISOString(),
        };
      }
      
      if (responseWrapper.status === 'error' || 
          (messageStr?.toLowerCase().includes('error') && !errorMsg.includes('already'))) {
        throw new Error(messageStr || "Subscription failed");
      }
      
      // Extract actual data from nested structure
      const data = responseWrapper.data || responseWrapper;
      console.log("[Subscription] Extracted data:", data);
      
      // Validate required fields - check multiple possible field names
      const paymentLink = data.link || data.payment_link || data.payment_url || data.checkout_url;
      if (!paymentLink) {
        console.error("[Subscription] No payment link in response:", responseWrapper);
        throw new Error("Payment link not received from server. Please try again.");
      }
      
      // Normalize response to match SubscribeResponse interface
      return {
        id: data.id || data.transaction_id || data.ref || String(Date.now()),
        status: responseWrapper.status || 'success',
        amount: data.amount || 0,
        currency: data.currency || 'NGN',
        payment_link: paymentLink,
        transaction_ref: data.transaction_ref || data.transaction_id || data.ref,
        transaction_id: data.transaction_id || data.id || data.ref,
        created_at: data.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Subscription] Error:", error);
      const axiosError = error as { response?: { status: number; data: unknown }; message?: string };
      
      // If it's already a processed error, re-throw it
      if (error instanceof Error && error.message.includes("Payment link")) {
        throw error;
      }
      
      if (axiosError.response) {
        console.error("[Subscription] Error status:", axiosError.response.status);
        console.error("[Subscription] Error data:", axiosError.response.data);
        
        // Handle specific status codes
        const errorData = axiosError.response.data as { detail?: string; message?: string | object; error?: string | object };
        const extractMessage = (val: string | object | undefined): string => {
          if (typeof val === 'object' && val !== null) {
            return (val as {message?: string; code?: string}).message || (val as {message?: string; code?: string}).code || JSON.stringify(val);
          }
          return val || '';
        };
        const errorMessage = errorData?.detail || extractMessage(errorData?.message) || extractMessage(errorData?.error);
        
        if (axiosError.response.status === 401) {
          throw new Error("Please log in to subscribe");
        }
        if (axiosError.response.status === 400) {
          throw new Error(errorMessage || "Invalid subscription request. Please check your plan selection.");
        }
        if (axiosError.response.status === 500) {
          throw new Error("Server error. Please try again later or contact support.");
        }
        
        throw new Error(errorMessage || `Subscription failed (Error ${axiosError.response.status})`);
      }
      
      // Network or other errors
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to initiate subscription. Please try again.");
    }
  },

  // Verify subscription after Flutterwave payment.
  // Backend verifies with Flutterwave (GET /v3/transactions/{id}/verify), checks status === "successful", then creates Subscription.
  // Requires transaction_id; plan_id is required by backend to create the subscription record.
  verifySubscription: async (
    transactionId: string,
    planId?: string,
  ): Promise<VerifySubscriptionResponse> => {
    const body: { transaction_id: string; plan_id?: string } = {
      transaction_id: transactionId,
    };
    if (planId) body.plan_id = planId;
    
    console.log("[Subscription] Verifying payment with body:", body);
    console.log("[Subscription] Endpoint:", ENDPOINTS.subscriptions.verify);
    
    const response = await apiClient.post(
      ENDPOINTS.subscriptions.verify,
      body,
    );
    
    console.log("[Subscription] Verification raw response:", response.data);
    
    // Handle nested response structure - backend may wrap response in a 'data' field
    const responseData = response.data;
    
    // If the response is already in the expected format, return it
    if (responseData.status && (responseData.subscription !== undefined || responseData.message)) {
      return responseData as VerifySubscriptionResponse;
    }
    
    // If response is nested (e.g., { data: { status, subscription, message } })
    if (responseData.data && typeof responseData.data === 'object') {
      const nestedData = responseData.data;
      return {
        status: nestedData.status || responseData.status || "error",
        subscription: nestedData.subscription || null,
        message: nestedData.message || responseData.message || "Unknown response",
      };
    }
    
    // Fallback: try to construct a valid response
    return {
      status: responseData.status || "error",
      subscription: responseData.subscription || null,
      message: responseData.message || "Payment verification completed",
    };
  },

  // Get current user's subscription status
  // Checks localStorage first, then tries to verify with backend
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
    
    // Check localStorage for payment confirmation first
    const paymentVerified = localStorage.getItem("propella_payment_verified");
    const pendingId = localStorage.getItem("pending_transaction_id");
    
    if (paymentVerified === "true") {
      console.log("[Subscription] Payment verified in localStorage");
      return {
        has_active_subscription: true,
        subscription: {
          id: "local",
          user_id: "",
          plan_id: "",
          status: "active",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        days_remaining: 30,
      };
    }
    
    // Try to verify any pending transaction
    if (pendingId) {
      try {
        const pendingPlanId = localStorage.getItem("pending_plan_id");
        const verifyResult = await subscriptionApi.verifySubscription(pendingId, pendingPlanId ?? undefined);
        if ((verifyResult.status === "success" || verifyResult.status === "successful") && verifyResult.subscription) {
          console.log("[Subscription] Verified via pending transaction");
          const sub = verifyResult.subscription;
          return {
            has_active_subscription: true,
            subscription: {
              id: sub.id,
              user_id: sub.user_id,
              plan_id: sub.plan_id,
              status: sub.status,
              start_date: sub.start_date,
              end_date: sub.end_date,
              created_at: new Date().toISOString(),
            },
            days_remaining: 30, // Calculate from dates if available
          };
        }
      } catch (err) {
        console.log("[Subscription] Pending transaction verification failed:", err);
      }
    }
    
    // Check if user profile indicates paid status
    // This is a workaround until a dedicated endpoint is available
    try {
      // Try to access the plans endpoint - if it works, user is authenticated
      // This indirectly tells us the user is logged in
      await subscriptionApi.getPlans();
      
      // If we get here, user is authenticated
      // Check if there's any indication of subscription in local state
      const storedStatus = localStorage.getItem("propella_subscription_status");
      if (storedStatus) {
        const parsed = JSON.parse(storedStatus);
        if (parsed.has_active_subscription) {
          return parsed;
        }
      }
    } catch (err) {
      console.log("[Subscription] Could not verify subscription status:", err);
    }
    
    console.log("[Subscription] No active subscription found");
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
