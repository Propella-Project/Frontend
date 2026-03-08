import { useState, useCallback, useEffect } from "react";
import { subscriptionApi, type SubscriptionPlan, type SubscribeResponse } from "@/api/subscription.api";
import { roadmapApi } from "@/api/roadmap.api";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import { toast } from "sonner";
import { getToken } from "@/api/client";

interface UsePaymentReturn {
  loading: boolean;
  verifying: boolean;
  error: string | null;
  plans: SubscriptionPlan[];
  selectedPlan: SubscriptionPlan | null;
  fetchPlans: () => Promise<void>;
  selectPlan: (plan: SubscriptionPlan) => void;
  initiatePayment: (plan: SubscriptionPlan) => Promise<SubscribeResponse | null>;
  verifySubscription: (transactionRef: string) => Promise<boolean>;
}

/**
 * Hook to manage payments via Flutterwave and subscriptions
 */
export function usePayment(): UsePaymentReturn {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const { setUser } = useUserStore();
  const { setPaymentStatus, setTodayRoadmap } = useAppStore();

  // Fetch available subscription plans
  const fetchPlans = useCallback(async () => {
    // Only fetch if user is authenticated
    const token = getToken();
    if (!token) {
      console.log("[Payment] Skipping plans fetch - no auth token");
      // Use fallback plans
      const fallbackPlans: SubscriptionPlan[] = [
        {
          id: "monthly",
          name: "Monthly Plan",
          description: "Full access for 1 month",
          amount: 1499,
          currency: "NGN",
          duration_days: 30,
          features: [
            "Personalized AI-generated roadmap",
            "Unlimited AI tutor chat sessions",
            "Detailed performance analytics",
            "Weak topics identification",
            "Daily streak tracking",
            "Practice quizzes and past questions",
          ],
        },
      ];
      setPlans(fallbackPlans);
      setSelectedPlan((current) => current || fallbackPlans[0]);
      return;
    }
    
    try {
      const plansData = await subscriptionApi.getPlans();
      setPlans(plansData);
      // Use functional update to avoid dependency on selectedPlan
      setSelectedPlan((current) => {
        if (plansData.length > 0 && !current) {
          return plansData[0];
        }
        return current;
      });
    } catch (err) {
      console.error("Failed to fetch subscription plans:", err);
      // Fallback plan - N1499 for one month
      const fallbackPlans: SubscriptionPlan[] = [
        {
          id: "monthly",
          name: "Monthly Plan",
          description: "Full access for 1 month",
          amount: 1499,
          currency: "NGN",
          duration_days: 30,
          features: [
            "Personalized AI-generated roadmap",
            "Unlimited AI tutor chat sessions",
            "Detailed performance analytics",
            "Weak topics identification",
            "Daily streak tracking",
            "Practice quizzes and past questions",
          ],
        },
      ];
      setPlans(fallbackPlans);
      setSelectedPlan((current) => current || fallbackPlans[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only fetch once on mount

  // Select a plan
  const selectPlan = useCallback((plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  }, []);

  // Initiate payment - calls backend to get payment link
  const initiatePayment = useCallback(
    async (plan?: SubscriptionPlan): Promise<SubscribeResponse | null> => {
      const targetPlan = plan || selectedPlan;
      
      if (!targetPlan) {
        toast.error("Please select a subscription plan");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Call backend to initiate subscription and get payment link
        // Backend handles email/username via Flutterwave
        const response = await subscriptionApi.subscribe({
          plan_id: targetPlan.id,
          payment_method: "flutterwave",
        });

        // Store transaction reference for later verification
        // Backend returns transaction_id, but we also support transaction_ref for legacy
        const transactionId = response.transaction_id || response.transaction_ref || "";
        localStorage.setItem("pending_transaction_id", transactionId);
        localStorage.setItem("pending_plan_id", targetPlan.id);

        // Redirect to Flutterwave payment page
        if (response.payment_link) {
          window.location.href = response.payment_link;
        }

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initiate payment";
        setError(errorMessage);
        
        // Handle auth error specifically
        if (errorMessage.includes("log in") || errorMessage.includes("authentication")) {
          toast.error("Please log in to subscribe", {
            description: "You'll be redirected to login",
          });
        } else {
          toast.error(errorMessage);
        }
        
        return null;
      } finally {
        setLoading(false);
      }
    },
    [selectedPlan]
  );

  // Verify subscription after payment
  const verifySubscription = useCallback(
    async (transactionRef: string): Promise<boolean> => {
      setVerifying(true);
      setError(null);

      try {
        const response = await subscriptionApi.verifySubscription(transactionRef);

        if (response.status === "success" && response.subscription) {
          // Update payment status
          setPaymentStatus("paid");
          setUser({ payment_status: "paid" });

          // Fetch and unlock day one roadmap
          try {
            const todayRoadmap = await roadmapApi.getTodayRoadmap();
            setTodayRoadmap(todayRoadmap);
          } catch (roadmapErr) {
            console.error("Failed to fetch roadmap:", roadmapErr);
          }

          // Clear pending transaction
          localStorage.removeItem("pending_transaction_id");
          localStorage.removeItem("pending_plan_id");

          toast.success("Payment successful! Your subscription is now active.");
          toast.success("Day one of your roadmap is now unlocked!");

          return true;
        } else {
          toast.error(response.message || "Payment verification failed");
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to verify subscription";
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      } finally {
        setVerifying(false);
      }
    },
    [setPaymentStatus, setUser, setTodayRoadmap]
  );

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    loading,
    verifying,
    error,
    plans,
    selectedPlan,
    fetchPlans,
    selectPlan,
    initiatePayment,
    verifySubscription,
  };
}

/**
 * Hook to check if user has paid and has active subscription
 */
export function usePaymentStatus() {
  const { payment_status } = useUserStore();
  const { paymentStatus } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActive: boolean;
    daysRemaining: number;
  }>({ hasActive: false, daysRemaining: 0 });

  // Check subscription status from backend
  const checkSubscriptionStatus = useCallback(async () => {
    // Only check if user is authenticated
    const token = getToken();
    if (!token) {
      console.log("[Payment] Skipping subscription check - no auth token");
      return false;
    }
    
    setIsLoading(true);
    try {
      const status = await subscriptionApi.getSubscriptionStatus();
      setSubscriptionStatus({
        hasActive: status.has_active_subscription,
        daysRemaining: status.days_remaining,
      });
      return status.has_active_subscription;
    } catch (err) {
      console.error("Failed to check subscription status:", err);
      // Fallback to local state
      const isPaid = payment_status === "paid" && paymentStatus === "paid";
      setSubscriptionStatus({ hasActive: isPaid, daysRemaining: isPaid ? 30 : 0 });
      return isPaid;
    } finally {
      setIsLoading(false);
    }
  }, [payment_status, paymentStatus]);

  // Check for pending transaction on mount (for payment callback)
  useEffect(() => {
    const pendingId = localStorage.getItem("pending_transaction_id");
    if (pendingId) {
      // Verify the pending transaction
      subscriptionApi.verifySubscription(pendingId).then((response) => {
        if (response.status === "success") {
          // Clear pending transaction
          localStorage.removeItem("pending_transaction_id");
          localStorage.removeItem("pending_plan_id");
          // Refresh status
          checkSubscriptionStatus();
        }
      }).catch(() => {
        // Silently fail - will retry next time
      });
    }
  }, [checkSubscriptionStatus]);

  // Use the most restrictive status
  const isPaid = payment_status === "paid" && paymentStatus === "paid";

  return {
    isPaid,
    isLoading,
    status: isPaid ? "paid" : "pending",
    subscriptionStatus,
    checkSubscriptionStatus,
  };
}
